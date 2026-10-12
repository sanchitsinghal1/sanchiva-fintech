'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FileDown, Loader2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function Statements() {
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400_000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const download = async (presetDays) => {
    setLoading(true);
    try {
      let f = from;
      let t = to;
      if (presetDays) {
        const end = new Date();
        const start = new Date(Date.now() - presetDays * 86400_000);
        f = start.toISOString().slice(0, 10);
        t = end.toISOString().slice(0, 10);
        setFrom(f);
        setTo(t);
      }
      const url = await api.getPdf(`/api/statement?from=${f}&to=${t}`);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanchiva-statement-${f}_to_${t}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Statement downloaded');
    } catch (e) {
      toast.error(e.message || 'Statement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Statements</h1>
        <p className="text-sm text-muted-foreground">Generate a branded PDF of your transaction history.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Custom period
            </CardTitle>
            <CardDescription>Pick a date range and download the PDF.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <Button onClick={() => download()} disabled={loading} className="mt-4 w-full" size="lg">
              {loading ? <Loader2 className="animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download statement
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick presets</CardTitle>
            <CardDescription>One-tap PDFs for common windows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PRESETS.map((p) => (
              <Button
                key={p.days}
                variant="outline"
                className="w-full justify-between"
                onClick={() => download(p.days)}
                disabled={loading}
              >
                <span>{p.label}</span>
                <FileDown className="h-4 w-4" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-4 text-sm text-muted-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Each statement is generated server-side with PDFKit — including your account number, a
            transaction table with running balance, and the Sanchiva letterhead. It is NOT stored —
            the PDF streams straight to your browser.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
