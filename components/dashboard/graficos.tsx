"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatearRD } from "@/lib/format";

const ejeStyle = { fontSize: 11, fill: "var(--text-muted)" };

function TooltipMoneda({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-field border border-line bg-elevated px-3 py-2 text-xs shadow-elevated">
      {label && <p className="mb-1 font-medium text-fg">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular-nums text-muted">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-fg">{formatearRD(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function AreaIngresos({
  data,
}: {
  data: { mes: string; Ingresos: number; Costos: number; Utilidad: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gUti" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="mes" tick={ejeStyle} axisLine={false} tickLine={false} />
        <YAxis tick={ejeStyle} axisLine={false} tickLine={false} width={70}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<TooltipMoneda />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="Ingresos" stroke="var(--accent)" fill="url(#gIng)" strokeWidth={2} />
        <Area type="monotone" dataKey="Costos" stroke="var(--danger)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
        <Area type="monotone" dataKey="Utilidad" stroke="var(--success)" fill="url(#gUti)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarrasClientes({ data }: { data: { nombre: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={ejeStyle} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="nombre" tick={ejeStyle} axisLine={false} tickLine={false} width={110} />
        <Tooltip content={<TooltipMoneda />} cursor={{ fill: "var(--bg-elevated)" }} />
        <Bar dataKey="total" name="Facturado" fill="var(--accent)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BarrasTendenciaGastos({
  data,
}: {
  data: { mes: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="mes" tick={ejeStyle} axisLine={false} tickLine={false} />
        <YAxis tick={ejeStyle} axisLine={false} tickLine={false} width={44}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<TooltipMoneda />} cursor={{ fill: "var(--bg-elevated)" }} />
        <Bar dataKey="total" name="Gastos" fill="var(--accent)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PALETA = ["#E8A33D", "#60A5FA", "#34D399", "#F87171", "#A78BFA", "#FBBF24", "#94A3B8"];

export function DonutGastos({ data }: { data: { nombre: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="nombre"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke="var(--bg-surface)"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETA[i % PALETA.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipMoneda />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
