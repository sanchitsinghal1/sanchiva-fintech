/**
 * RAZORPAY CONTROLLER — free student payment gateway (TEST mode).
 * Razorpay TEST mode simulates card/UPI payments with NO real money.
 * Sign up free at https://dashboard.razorpay.com → Settings → API Keys.
 * Uses fetch (no SDK). Verifies HMAC SHA256 signature. Credits wallet ACID-ly.
 *
 * HUMAN ACTION REQUIRED: Paste your Razorpay key_id here from your Razorpay dashboard
 *   https://dashboard.razorpay.com  →  Settings  →  API Keys  →  Generate Test Key
 *   Example: rzp_test_AbCdEfGhIjKlMnOp
 * HUMAN ACTION REQUIRED: Paste your Razorpay key_secret here (shown once at creation)
 */
const crypto = require('crypto'); const { z } = require('zod'); const mongoose = require('mongoose');
const Account = require('../models/Account'); const Transaction = require('../models/Transaction'); const Notification = require('../models/Notification');
const { ok, ApiError } = require('../utils/apiResponse'); const { emitToUser } = require('../utils/socketEmitter'); const { randRef } = require('./transactionController');
// HUMAN ACTION REQUIRED: Paste your Razorpay key_id here from your Razorpay dashboard
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
// HUMAN ACTION REQUIRED: Paste your Razorpay key_secret here
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const configured = () => RZP_KEY_ID && RAZORPAY_KEY_SECRET && !RZP_KEY_ID.includes('placeholder');
const createSchema = z.object({ amount: z.number().int().min(100), currency: z.string().optional().default('INR') });
exports.createOrder = async (req,res,next)=>{ try{ const {amount,currency}=createSchema.parse(req.body); if(!configured()) throw new ApiError('RAZORPAY_NOT_CONFIGURED','Razorpay not configured. Add RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (rzp_test_...) to backend/.env. Get them free at https://dashboard.razorpay.com → Settings → API Keys.',503); const auth=Buffer.from(`${RZP_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64'); const r=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Basic ${auth}`},body:JSON.stringify({amount,currency,receipt:`sanchiva_${Date.now()}`})}); const o=await r.json(); if(!r.ok) throw new ApiError('RAZORPAY_ERROR',o.error?.description||'Order creation failed',502); return ok(res,{orderId:o.id,amount:o.amount,currency:o.currency,keyId:RZP_KEY_ID}); }catch(e){ if(e.name==='ZodError') return next(new ApiError('VALIDATION',e.issues[0].message,422)); next(e); } };
const verifySchema = z.object({ razorpay_payment_id: z.string().min(1), razorpay_order_id: z.string().min(1), razorpay_signature: z.string().min(1), amount: z.number().int().positive() });
exports.verify = async (req,res,next)=>{ const s=await mongoose.startSession(); try{ const b=verifySchema.parse(req.body); if(!configured()) throw new ApiError('RAZORPAY_NOT_CONFIGURED','Razorpay keys missing in backend/.env',503); const exp=crypto.createHmac('sha256',RAZORPAY_KEY_SECRET).update(`${b.razorpay_order_id}|${b.razorpay_payment_id}`).digest('hex'); if(exp!==b.razorpay_signature) throw new ApiError('SIGNATURE_MISMATCH','Payment signature verification failed',400); const amt=b.amount/100; s.startTransaction(); const acc=await Account.findOne({userId:req.user._id}).session(s); if(!acc) throw new ApiError('NOT_FOUND','Account not found',404); acc.balance+=amt; await acc.save({session}); const t=await Transaction.create([{toAccountId:acc._id,toUserId:req.user._id,amount:amt,type:'TOPUP',status:'COMPLETED',category:'INCOME',description:`Razorpay top-up · ${b.razorpay_payment_id.slice(-8)}`,reference:randRef()}],{session,ordered:true}); await s.commitTransaction(); await s.endSession(); await Notification.create({userId:req.user._id,title:'Wallet topped up',message:`₹${amt.toLocaleString('en-IN')} added via Razorpay.`,type:'TRANSACTION'}); emitToUser(req.user._id,'money-received',{amount:amt,from:'Razorpay top-up',reference:t[0].reference}); return ok(res,{ok:true,accountBalance:acc.balance}); }catch(e){ if(s.inTransaction()) await s.abortTransaction(); await s.endSession(); if(e.name==='ZodError') return next(new ApiError('VALIDATION',e.issues[0].message,422)); next(e); } };
