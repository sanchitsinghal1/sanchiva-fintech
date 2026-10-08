/** ADMIN CONTROLLER — Super Admin command center. Protected by requireUser+requireAdmin. */
const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const SessionLog = require('../models/SessionLog');
const PlatformStat = require('../models/PlatformStat');
const RefreshToken = require('../models/RefreshToken');
const { ok, ApiError } = require('../utils/apiResponse');

exports.stats = async (req, res, next) => {
  try {
    const [totalUsers, superAdmins, accounts, volumeAgg] = await Promise.all([
      User.countDocuments(), User.countDocuments({ role: 'SUPER_ADMIN' }), Account.find({}).lean(),
      Transaction.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, volume: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    ]);
    const volume = volumeAgg[0] || { volume: 0, count: 0 };
    const verified = await User.countDocuments({ kycStatus: 'VERIFIED' });
    const pending = await User.countDocuments({ kycStatus: 'PENDING' });
    const tiers = await User.aggregate([{ $group: { _id: '$tier', count: { $sum: 1 } } }]);
    const tierCounts = { SILVER: 0, GOLD: 0, OBSIDIAN: 0 }; tiers.forEach((t) => (tierCounts[t._id] = t.count));
    return ok(res, {
      totalUsers, superAdmins, totalLiquidity: Math.round(accounts.reduce((s,a)=>s+(a.balance||0),0)*100)/100,
      totalVolume: Math.round(volume.volume*100)/100, totalTransactions: volume.count,
      frozenAccounts: accounts.filter((a) => a.status === 'FROZEN').length, kyc: { verified, pending }, tiers: tierCounts,
    });
  } catch (e) { next(e); }
};
exports.users = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const accounts = await Account.find({ userId: { $in: users.map((u) => u._id) } }).lean();
    const m = new Map(accounts.map((a) => [String(a.userId), a]));
    return ok(res, { users: users.map((u) => { const a = m.get(String(u._id)); return { _id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, kycStatus: u.kycStatus, avatarColor: u.avatarColor, tier: u.tier, frozen: u.frozen, city: u.city, balance: a ? a.balance : 0, accountNumber: a ? a.accountNumber : null, accountStatus: a ? a.status : null, createdAt: u.createdAt }; }) });
  } catch (e) { next(e); }
};
exports.sessions = async (req, res, next) => { try { const l = Math.min(parseInt(req.query.limit,10)||25,100); const s = await SessionLog.find({}).sort({createdAt:-1}).limit(l).lean(); return ok(res, { sessions: s, count: s.length }); } catch(e){next(e);} };
exports.platformStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.range,10)||30; const since = new Date(Date.now()-days*86400_000);
    const stats = await PlatformStat.find({ createdAt: { $gte: since } }).sort({ date: 1 }).lean();
    const byDate = new Map(stats.map((s)=>[s.date,s])); const out = [];
    for (let i=days-1;i>=0;i--){ const d=new Date(Date.now()-i*86400_000); const k=d.toISOString().slice(0,10); out.push(byDate.get(k)||{date:k,activeUsers:0,newSignups:0,pageViews:0,totalVolume:0,totalTransactions:0}); }
    const totals = out.reduce((a,s)=>({activeUsers:a.activeUsers+(s.activeUsers||0),newSignups:a.newSignups+(s.newSignups||0),pageViews:a.pageViews+(s.pageViews||0)}),{activeUsers:0,newSignups:0,pageViews:0});
    return ok(res, { series: out, totals });
  } catch(e){next(e);}
};
exports.approveKyc = async (req,res,next)=>{ try{ const u=await User.findByIdAndUpdate(req.params.id,{kycStatus:'VERIFIED',kycSubmittedAt:new Date()},{new:true}); if(!u) throw new ApiError('NOT_FOUND','User not found',404); return ok(res,{user:{_id:u._id,kycStatus:u.kycStatus}}); }catch(e){next(e);} };
exports.toggleFreeze = async (req,res,next)=>{ try{ const u=await User.findById(req.params.id); if(!u) throw new ApiError('NOT_FOUND','User not found',404); if(u.role==='SUPER_ADMIN') throw new ApiError('FORBIDDEN','Cannot freeze a Super Admin',403); const n=!u.frozen; u.frozen=n; await u.save(); await Account.updateMany({userId:u._id},{status:n?'FROZEN':'ACTIVE'}); return ok(res,{user:{_id:u._id,frozen:u.frozen}}); }catch(e){next(e);} };
exports.revokeSessions = async (req,res,next)=>{ try{ await RefreshToken.updateMany({userId:req.params.id,revoked:false},{revoked:true}); return ok(res,{ok:true}); }catch(e){next(e);} };
exports.health = async (req,res,next)=>{ try{ const t0=Date.now(); await User.findOne().lean(); const dbLatency=Date.now()-t0; const {getIOStats}=require('../utils/socketEmitter'); const s=getIOStats?getIOStats():{clients:0}; return ok(res,{apiStatus:'OPERATIONAL',uptimePct:99.99,dbLatencyMs:dbLatency,activeSockets:s.clients||0,serverTime:new Date().toISOString()}); }catch(e){next(e);} };
