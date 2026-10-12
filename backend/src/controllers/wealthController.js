/** WEALTH CONTROLLER — FD/MF/Stocks/Gold portfolio + robo advisory. */
const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const { ok } = require('../utils/apiResponse');
exports.list = async (req,res,next)=>{ try{ const items=await Investment.find({userId:req.user._id}).lean(); const invested=items.reduce((s,i)=>s+i.invested,0); const current=items.reduce((s,i)=>s+i.currentValue,0); return ok(res,{investments:items,invested:Math.round(invested*100)/100,current:Math.round(current*100)/100,pl:Math.round((current-invested)*100)/100,plPct:invested>0?Math.round(((current-invested)/invested)*10000)/100:0}); }catch(e){next(e);} };
exports.create = async (req,res,next)=>{ try{ const {type,name,invested,currentValue,units,maturityDate}=req.body; const returnsPct=invested>0?Math.round(((currentValue-invested)/invested)*10000)/100:0; const inv=await Investment.create({userId:req.user._id,type,name,invested,currentValue,units:units||0,returnsPct,maturityDate:maturityDate?new Date(maturityDate):null}); return ok(res,{investment:inv},201); }catch(e){next(e);} };
