/**
 * SANCHIVA — Database seed. Auto-run on first boot by config/db.js.
 * Creates: Super Admin (Sanchit Singhal / Sanchiva@2006) + 14 users + 220 txns +
 * 30d SessionLog + 30d PlatformStat + 2 vaults + cashbacks + beneficiaries.
 *
 * Super Admin login:  singhalsanchit852@gmail.com  /  Sanchiva@2006
 */
const mongoose = require('mongoose');
const User = require('./models/User'); const Account = require('./models/Account'); const Card = require('./models/Card');
const Beneficiary = require('./models/Beneficiary'); const Request = require('./models/Request'); const Notification = require('./models/Notification');
const Transaction = require('./models/Transaction'); const SessionLog = require('./models/SessionLog'); const PlatformStat = require('./models/PlatformStat');
const Vault = require('./models/Vault'); const Cashback = require('./models/Cashback');
const { hashPassword } = require('./utils/password');

function mulberry32(seed){ return function(){ let t=(seed+=0x6d2b79f5); t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
const rng = mulberry32(7); const pick = (a) => a[Math.floor(rng()*a.length)];
const money = (min,max) => Math.round((min+rng()*(max-min))*100)/100;
const digits = (n) => Array.from({length:n},()=>Math.floor(rng()*10)).join('');
const CATEGORIES = ['FOOD','TRAVEL','BILLS','SHOPPING','TRANSFER','OTHER'];
const MERCHANTS = { FOOD:['Swiggy','Zomato','Blue Tokai',"Domino's",'BigBasket'], TRAVEL:['Uber','IRCTC','IndiGo','Ola','MakeMyTrip'], BILLS:['BESCOM','Airtel','Jio Fiber','BBMP Water'], SHOPPING:['Amazon','Flipkart','Myntra','Apple Store','Croma'], TRANSFER:['Peer Transfer'], OTHER:['Misc'] };
const CITIES=['Mumbai','Delhi','Bengaluru','Pune','Hyderabad','Chennai','Kolkata','Jaipur'];
const DEVICES=['MacBook','iPhone','Android','Windows PC']; const BROWSERS=['Chrome','Safari','Edge','Firefox'];
const LOCATIONS=['Mumbai, IN','Delhi, IN','Bengaluru, IN','Pune, IN','Hyderabad, IN','Chennai, IN','Kolkata, IN'];
const NAMES=['Rohan Verma','Meera Iyer','Karan Malhotra','Priya Nair','Arjun Reddy','Sneha Kapoor','Vikram Singh','Ananya Das','Rahul Mehta','Ishita Rao','Aditya Joshi','Kavya Menon','Nikhil Gupta','Pooja Bhatt'];
const ADMIN_EMAIL='singhalsanchit852@gmail.com';

async function makeUser(o, role='USER'){
  const passwordHash = await hashPassword('Sanchiva@2006');
  const user = await User.create({ name:o.name, email:o.email, phone:o.phone, passwordHash, kycStatus:'VERIFIED', avatarColor:o.color, city:o.city, country:'India', occupation:o.occupation||'Software Engineer', incomeRange:'12-25 LPA', address:`${Math.floor(rng()*200)} MG Road`, dob:'1996-04-12', role, tier:o.tier||'SILVER' });
  const account = await Account.create({ userId:user._id, accountNumber:digits(10), type:'SAVINGS', balance:money(20000,280000), currencyBalances:[{currency:'INR',balance:money(20000,280000)},{currency:'USD',balance:money(0,2000)},{currency:'EUR',balance:money(0,1500)}] });
  return { user, account };
}
async function makeCard(user,account,color){ return Card.create({ userId:user._id, accountId:account._id, cardNumber:`4242 4242 4242 ${digits(4)}`, cardHolder:user.name.toUpperCase(), expiryMonth:String(1+Math.floor(rng()*12)).padStart(2,'0'), expiryYear:String(27+Math.floor(rng()*5)), cvvHash:`demo:${digits(3)}`, network:pick(['VISA','MASTERCARD']), type:pick(['VIRTUAL','PHYSICAL']), color, spentToday:money(0,5000), spentThisMonth:money(0,40000) }); }

async function seed(){
  const count = await User.countDocuments();
  if (count > 0) { console.log('Seed skipped — data already present.'); return; }
  console.log('🌱 Seeding Sanchiva database...');
  const admin = await makeUser({ name:'Sanchit Singhal', email:ADMIN_EMAIL, phone:'8595136808', color:'emerald', city:'Bengaluru', occupation:'Founder & CEO', tier:'OBSIDIAN' }, 'SUPER_ADMIN');
  const peers = await Promise.all(NAMES.map((name,i)=> makeUser({ name, email:`${name.toLowerCase().replace(/\s+/g,'.')}@sanchiva.com`, phone:`+91 90000 ${(10000+i).toString().slice(0,5)}`, color:pick(['emerald','violet','amber','rose','cyan']), city:pick(CITIES), occupation:pick(['Engineer','Designer','Product Manager','Analyst','Consultant']), tier:pick(['SILVER','GOLD','OBSIDIAN']) })));

  await makeCard(admin.user, admin.account, 'emerald'); await makeCard(admin.user, admin.account, 'obsidian');
  for (const p of peers.slice(0,3)) await Beneficiary.create({ userId:admin.user._id, name:p.user.name, accountNumber:p.account.accountNumber, bankName:'Sanchiva Bank', ifsc:'SANC0001', nickname:p.user.name.split(' ')[0] });

  const now = Date.now(); const txns=[]; let cbTotal=0;
  for (let i=0;i<220;i++){
    const daysAgo=Math.floor(rng()*90); const createdAt=new Date(now-daysAgo*86400_000-Math.floor(rng()*86400_000));
    const isIncome=rng()<0.15; const category=isIncome?'INCOME':pick(CATEGORIES);
    const merchant=pick(MERCHANTS[category]||['Misc']); const amount=isIncome?money(5000,60000):money(50,4500);
    txns.push(Transaction.create({ fromAccountId:isIncome?null:admin.account._id, toAccountId:isIncome?admin.account._id:null, fromUserId:isIncome?null:admin.user._id, toUserId:isIncome?admin.user._id:null, amount, type:isIncome?'DEPOSIT':'PAYMENT', status:'COMPLETED', category, description:merchant, reference:`TXN${Math.floor(rng()*1e9)}`, createdAt }));
    if(!isIncome&&category==='SHOPPING'&&rng()<0.4){ const rate=1+Math.floor(rng()*5); cbTotal+=Math.round((amount*rate)/100); }
  }
  const created=await Promise.all(txns);
  let cbRows=[];
  for(const t of created){ if(t.category==='SHOPPING'&&rng()<0.4){ const rate=1+Math.floor(rng()*5); cbRows.push({userId:admin.user._id,transactionId:t._id,amount:Math.round((t.amount*rate)/100),rate,merchant:t.description}); } }
  if(cbRows.length) await Cashback.insertMany(cbRows);
  await User.updateOne({ _id:admin.user._id }, { $inc:{ cashbackTotal:cbTotal } });

  await Vault.create({ userId:admin.user._id, name:'Goa Trip', target:50000, current:32500, color:'cyan', icon:'🏖️' });
  await Vault.create({ userId:admin.user._id, name:'New MacBook', target:150000, current:92000, color:'violet', icon:'💻' });

  await Request.create({ fromUserId:peers[0].user._id, toUserId:admin.user._id, amount:1850, description:'Dinner at Toit last Friday', type:'REQUEST', status:'PENDING' });
  await Request.create({ fromUserId:peers[1].user._id, toUserId:admin.user._id, amount:4200, description:'Goa trip — flight + stay split', type:'SPLIT', totalAmount:12600, splitMembers:[{userId:admin.user._id,name:'Sanchit',share:4200},{userId:peers[1].user._id,name:'Meera',share:4200},{userId:peers[2].user._id,name:'Karan',share:4200}], status:'PENDING' });

  await Notification.create([
    { userId:admin.user._id, title:'Welcome to Sanchiva', message:'Your premium banking account is ready.', type:'SYSTEM' },
    { userId:admin.user._id, title:'Salary credited', message:'₹58,400 received from Acme Corp Payroll.', type:'TRANSACTION' },
    { userId:admin.user._id, title:'New money request', message:'Rohan requested ₹1,850 from you.', type:'REQUEST' },
    { userId:admin.user._id, title:'Card delivered', message:'Your Sanchiva Virtual Card is now active.', type:'SECURITY' },
    { userId:admin.user._id, title:'Obsidian tier unlocked', message:'You reached Obsidian — top 1% of Sanchiva members.', type:'SYSTEM' },
  ]);

  // 30d SessionLog
  const sessionLogs=[]; const allUsers=[admin,...peers];
  for(let d=29;d>=0;d--){ const day=new Date(now-d*86400_000); const cnt=3+Math.floor(rng()*6);
    for(let j=0;j<cnt;j++){ const u=pick(allUsers); sessionLogs.push({ userId:u.user._id, userName:u.user.name, email:u.user.email, ipAddress:`${Math.floor(rng()*255)}.${Math.floor(rng()*255)}.${Math.floor(rng()*255)}.${Math.floor(rng()*255)}`, location:pick(LOCATIONS), device:pick(DEVICES), browser:pick(BROWSERS), status:'SUCCESS', createdAt:new Date(day.getTime()+Math.floor(rng()*86400_000)) }); }
  }
  if(sessionLogs.length) await SessionLog.insertMany(sessionLogs);

  // 30d PlatformStat
  const stats=[];
  for(let d=29;d>=0;d--){ const day=new Date(now-d*86400_000); stats.push({ date:day.toISOString().slice(0,10), activeUsers:80+Math.floor(rng()*220), newSignups:d>25?2+Math.floor(rng()*4):Math.floor(rng()*9), pageViews:1200+Math.floor(rng()*4800), totalVolume:money(20000,180000), totalTransactions:40+Math.floor(rng()*180), createdAt:day }); }
  if(stats.length) await PlatformStat.insertMany(stats);

  // extra txns for random users
  for(const p of peers.slice(0,6)){ for(let i=0;i<8;i++){ const isIn=rng()<0.4; const cat=isIn?'INCOME':pick(CATEGORIES); await Transaction.create({ fromAccountId:isIn?null:p.account._id, toAccountId:isIn?p.account._id:null, fromUserId:isIn?null:p.user._id, toUserId:isIn?p.user._id:null, amount:isIn?money(2000,30000):money(100,3000), type:isIn?'DEPOSIT':'PAYMENT', status:'COMPLETED', category:cat, description:pick(MERCHANTS[cat]||['Misc']), reference:`TXN${Math.floor(rng()*1e9)}`, createdAt:new Date(now-Math.floor(rng()*60)*86400_000) }); } }

  console.log('✅ Seed complete.');
  console.log('   Super Admin login:  singhalsanchit852@gmail.com  /  Sanchiva@2006');
}

if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanchiva')
    .then(() => seed().then(() => process.exit(0)))
    .catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { seed };
