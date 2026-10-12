/** INSURANCE CONTROLLER — policy management (life/health/motor/travel). */
const InsurancePolicy = require('../models/InsurancePolicy'); const { ok } = require('../utils/apiResponse');
exports.list = async (req,res,next)=>{ try{ const p=await InsurancePolicy.find({userId:req.user._id}).lean(); return ok(res,{policies:p}); }catch(e){next(e);} };
exports.create = async (req,res,next)=>{ try{ const {type,provider,policyNumber,premium,sumInsured,startDate,endDate}=req.body; const p=await InsurancePolicy.create({userId:req.user._id,type,provider,policyNumber,premium,sumInsured,startDate:new Date(startDate),endDate:new Date(endDate)}); return ok(res,{policy:p},201); }catch(e){next(e);} };
