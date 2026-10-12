'use client';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { inr, inrCompact } from '@/lib/utils';

const TYPE_COLORS = {
  out: 'var(--chart-3)',
  inn: 'var(--chart-5)',
};

export function SpendingByCategory({ data = [], height = 280 }) {
  const total = data.reduce((s, d) => s + d.total, 0);

  if (data.length === 0) {
    return (
      <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">
        No spend in this window yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v) => inr(v)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total spend</div>
            <div className="text-lg font-bold">{inrCompact(total)}</div>
          </div>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2">
        {data.map((d) => (
          <div key={d.category} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.label}
            </div>
            <div className="text-sm font-medium">{inr(d.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashFlowChart({ data = [], height = 260 }) {
  const chartData = data.map((d) => ({ ...d, net: d.inn - d.out }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TYPE_COLORS.inn} stopOpacity={0.35} />
            <stop offset="95%" stopColor={TYPE_COLORS.inn} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TYPE_COLORS.out} stopOpacity={0.3} />
            <stop offset="95%" stopColor={TYPE_COLORS.out} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          tickFormatter={(v) => inrCompact(v)}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v, name) => [inr(v), name === 'inn' ? 'In' : name === 'out' ? 'Out' : name]}
          labelFormatter={(l) => `Date: ${l}`}
        />
        <Legend
          formatter={(v) => (v === 'inn' ? 'Money in' : v === 'out' ? 'Money out' : v)}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area type="monotone" dataKey="inn" stroke={TYPE_COLORS.inn} strokeWidth={2} fill="url(#gradIn)" />
        <Area type="monotone" dataKey="out" stroke={TYPE_COLORS.out} strokeWidth={2} fill="url(#gradOut)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
