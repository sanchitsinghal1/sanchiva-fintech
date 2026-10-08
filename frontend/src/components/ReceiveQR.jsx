'use client';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { inr } from '@/lib/utils';
export function ReceiveQR({ open, onClose, account, user }) {
  const [copied,setCopied]=useState(false);
  if(!account||!user) return null;
  const payload=JSON.stringify({bank:'Sanchiva',accountNumber:account.accountNumber,ifsc:'SANC0001',payee:user.name,currency:account.currency||'INR'});
  const copy=async()=>{try{await navigator.clipboard.writeText(account.accountNumber);setCopied(true);toast.success('Account number copied');setTimeout(()=>setCopied(false),1500);}catch{toast.error('Could not copy');}};
  const download=()=>{const svg=document.getElementById('sanchiva-qr');if(!svg)return;const data=new XMLSerializer().serializeToString(svg);const blob=new Blob([data],{type:'image/svg+xml'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sanchiva-receive-${account.accountNumber}.svg`;a.click();URL.revokeObjectURL(url);toast.success('QR downloaded');};
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader><DialogTitle className="flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" /> Your receive QR</DialogTitle><DialogDescription>Anyone can scan this to send you money instantly.</DialogDescription></DialogHeader>
      <div className="flex flex-col items-center gap-5 py-2">
        <div className="card-emerald relative overflow-hidden rounded-2xl p-5 text-white shadow-2xl shadow-emerald-900/30">
          <div className="rounded-xl bg-white p-4"><QRCodeSVG id="sanchiva-qr" value={payload} size={184} level="H" fgColor="#059669" bgColor="#ffffff" /></div>
          <div className="mt-3 text-center"><div className="text-[10px] uppercase tracking-widest opacity-70">Sanchiva Pay</div><div className="text-sm font-medium">{user.name}</div></div>
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/30 blur-2xl" />
        </div>
        <div className="w-full space-y-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Account holder</span><span className="flex items-center gap-2 font-medium"><Avatar name={user.name} color={user.avatarColor} size="sm" />{user.name}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Account number</span><button onClick={copy} className="flex items-center gap-1.5 font-mono hover:text-primary">{account.accountNumber}{copied?<Check className="h-3.5 w-3.5 text-success" />:<Copy className="h-3.5 w-3.5 opacity-60" />}</button></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">IFSC</span><span className="font-mono">SANC0001</span></div>
          {account.balance!=null&&<div className="flex items-center justify-between"><span className="text-muted-foreground">Balance</span><span className="font-semibold">{inr(account.balance)}</span></div>}
        </div>
        <div className="flex w-full gap-2"><Button variant="outline" onClick={copy} className="flex-1 gap-1.5"><Copy className="h-4 w-4" /> Copy account</Button><Button onClick={download} className="flex-1 gap-1.5"><Download className="h-4 w-4" /> Download QR</Button></div>
      </div>
    </Dialog>
  );
}
