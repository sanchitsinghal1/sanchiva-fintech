'use client';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TransactionList } from '@/components/TransactionList';

const CATEGORIES = [
  { value: 'ALL', label: 'All categories' },
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'BILLS', label: 'Bills' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'INCOME', label: 'Income' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'OTHER', label: 'Other' },
];

const TYPES = [
  { value: 'ALL', label: 'All types' },
  { value: 'TRANSFER', label: 'Transfers' },
  { value: 'DEPOSIT', label: 'Deposits' },
  { value: 'PAYMENT', label: 'Payments' },
  { value: 'TOPUP', label: 'Top-ups' },
  { value: 'REQUEST', label: 'Requests' },
];

export function Transactions() {
  const [category, setCategory] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [q, setQ] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Transactions</h1>
        <p className="text-sm text-muted-foreground">Infinite-scroll history with smart filters.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search description…"
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory} options={CATEGORIES} />
            <Select value={type} onValueChange={setType} options={TYPES} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {/* key forces remount when filters change so the observer resets */}
          <TransactionList key={`${category}-${type}-${q}`} category={category} type={type} q={q} pageSize={20} />
        </CardContent>
      </Card>
    </div>
  );
}
