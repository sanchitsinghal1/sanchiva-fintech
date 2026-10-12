'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { SanchivaLogo } from '@/components/SanchivaLogo';
import { cn } from '@/lib/utils';
const SUGGESTIONS = ["What's my balance?", 'How do I freeze my card?', 'Explain ACID transfers', 'Where can I download a statement?'];
export function Chatbot() {
  const [open,setOpen]=useState(false);
  const [messages,setMessages]=useState([{role:'assistant',content:"Hi! I'm the Sanchiva AI Assistant 🤖 I can help with your balance, cards, transfers, statements and more. What would you like to do?"}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const scrollRef=useRef(null);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages,loading]);
  const send=async(text)=>{ const content=(text??input).trim(); if(!content||loading) return; const next=[...messages,{role:'user',content}]; setMessages(next); setInput(''); setLoading(true);
    try{ const data=await api.post('/api/chat',{message:content,history:next.slice(-6).filter((m,i)=>!(i===0&&m.role==='assistant')).map(m=>({role:m.role,content:m.content}))}); setMessages(m=>[...m,{role:'assistant',content:data.reply}]); }
    catch(err){ setMessages(m=>[...m,{role:'assistant',content:`⚠️ ${err.message}. Please try again in a moment.`}]); } finally{setLoading(false);} };
  return (
    <>
      <motion.button initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.4,type:'spring'}} onClick={()=>setOpen(o=>!o)} className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-105 active:scale-95" aria-label="Open Sanchiva AI Assistant">
        <AnimatePresence mode="wait">{open?<motion.span key="x" initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}}><X className="h-6 w-6" /></motion.span>:<motion.span key="msg" initial={{rotate:90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}}><MessageSquare className="h-6 w-6" /></motion.span>}</AnimatePresence>
        {!open&&<span className="absolute -right-0.5 -top-0.5 flex h-4 w-4"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" /><span className="relative inline-flex h-4 w-4 rounded-full bg-accent" /></span>}
      </motion.button>
      <AnimatePresence>{open&&(
        <motion.div initial={{opacity:0,y:24,scale:0.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:24,scale:0.96}} transition={{type:'spring',duration:0.4}} className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg"><Sparkles className="h-5 w-5" /></div>
            <div className="flex-1"><div className="text-sm font-semibold">Sanchiva AI Assistant</div><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Online · context-aware</div></div>
            <SanchivaLogo withWordmark={false} size="sm" />
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m,i)=>(<div key={i} className={cn('flex gap-2',m.role==='user'&&'flex-row-reverse')}>
              <div className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full',m.role==='assistant'?'bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground':'bg-secondary text-foreground')}>{m.role==='assistant'?<Bot className="h-3.5 w-3.5" />:<UserIcon className="h-3.5 w-3.5" />}</div>
              <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',m.role==='assistant'?'rounded-tl-sm bg-secondary text-secondary-foreground':'rounded-tr-sm bg-primary text-primary-foreground')}>{m.content}</div></div>))}
            {loading&&<div className="flex gap-2"><div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground"><Bot className="h-3.5 w-3.5" /></div><div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-3 py-3"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" /></div></div>}
          </div>
          {messages.length<=1&&<div className="flex flex-wrap gap-1.5 border-t border-border px-3 pb-2 pt-3">{SUGGESTIONS.map(s=><button key={s} onClick={()=>send(s)} className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-secondary">{s}</button>)}</div>}
          <form onSubmit={(e)=>{e.preventDefault();send();}} className="flex items-center gap-2 border-t border-border p-3">
            <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask the Sanchiva AI…" className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <button type="submit" disabled={loading||!input.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </motion.div>)}</AnimatePresence>
    </>
  );
}
