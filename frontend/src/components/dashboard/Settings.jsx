'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, LogOut, ShieldCheck, User as UserIcon, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const COLORS = [
  { id: 'emerald', label: 'Emerald' },
  { id: 'violet', label: 'Violet' },
  { id: 'amber', label: 'Amber' },
  { id: 'rose', label: 'Rose' },
  { id: 'cyan', label: 'Cyan' },
];

export function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    occupation: user?.occupation || '',
    incomeRange: user?.incomeRange || '',
    address: user?.address || '',
    avatarColor: user?.avatarColor || 'emerald',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and security.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Profile
          </CardTitle>
          <CardDescription>Your identity across Sanchiva.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={form.name || user?.name} color={form.avatarColor} size="xl" />
              <div>
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <Badge variant="success" className="mt-1 gap-1">
                  <ShieldCheck className="h-3 w-3" /> KYC Verified
                </Badge>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Avatar color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c.id }))}
                    className={`card-${c.id} h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition ${
                      form.avatarColor === c.id ? 'ring-2 ring-primary' : ''
                    }`}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" icon={<UserIcon className="h-4 w-4" />}>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label="Phone" icon={<Phone className="h-4 w-4" />}>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Field>
              <Field label="City" icon={<MapPin className="h-4 w-4" />}>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </Field>
              <Field label="Occupation" icon={<Briefcase className="h-4 w-4" />}>
                <Input value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} />
              </Field>
              <Field label="Income range">
                <Input value={form.incomeRange} onChange={(e) => setForm((f) => ({ ...f, incomeRange: e.target.value }))} />
              </Field>
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </Field>
            </div>

            <Button type="submit" disabled={saving} className="gap-1">
              {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3 text-sm">
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium">{user?.email}</div>
            </div>
            <Badge variant="muted">Read-only</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3 text-sm">
            <div>
              <div className="text-muted-foreground">Role</div>
              <div className="font-medium">{user?.role}</div>
            </div>
            <Badge variant="default">Sanchiva Member</Badge>
          </div>
          <Button variant="destructive" onClick={logout} className="gap-1">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
