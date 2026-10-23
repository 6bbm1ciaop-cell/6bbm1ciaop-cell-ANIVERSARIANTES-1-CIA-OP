import React from 'react';
import { initials, isOfficer, monthShort } from '../utils/format';

const AVATAR_TONES = [
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-800',
  'bg-stone-200 text-stone-700',
  'bg-rose-100 text-rose-700',
];

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  name,
  size = 'md',
  className = '',
}) => {
  const hash = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  const dims =
    size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${dims} ${tone} ${className}`}>
      {initials(name)}
    </span>
  );
};

export const RankBadge: React.FC<{ rank: string }> = ({ rank }) => {
  if (!rank) return null;
  const officer = isOfficer(rank);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none
        ${officer ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' : 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'}`}
    >
      {rank}
    </span>
  );
};

export const DateTile: React.FC<{ day: number; month: number; highlight?: boolean; small?: boolean }> = ({
  day,
  month,
  highlight = false,
  small = false,
}) => (
  <div
    className={`flex shrink-0 flex-col items-center justify-center rounded-xl font-bold leading-none
      ${small ? 'h-10 w-10' : 'h-12 w-12'}
      ${highlight ? 'bg-cbmmg-orange text-white shadow-sm shadow-orange-300' : 'bg-red-50 text-cbmmg-red'}`}
  >
    <span className={small ? 'text-base' : 'text-lg'}>{isNaN(day) ? '--' : String(day).padStart(2, '0')}</span>
    <span className="mt-0.5 text-[9px] uppercase tracking-wider opacity-80">{isNaN(month) ? '' : monthShort(month)}</span>
  </div>
);

export const TodayBadge: React.FC = () => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cbmmg-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
    Hoje
  </span>
);

interface PanelProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  accent?: 'red' | 'orange' | 'gold' | 'none';
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  accent = 'none',
  actions,
  children,
  bodyClassName = 'p-4 sm:p-5',
  className = '',
}) => {
  const accentClass =
    accent === 'red' ? 'bg-cbmmg-red' : accent === 'orange' ? 'bg-cbmmg-orange' : accent === 'gold' ? 'bg-cbmmg-gold' : '';
  return (
    <section className={`rounded-2xl border border-stone-200/80 bg-white shadow-sm shadow-stone-200/50 ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {accentClass && <span className={`h-7 w-1.5 shrink-0 rounded-full ${accentClass}`} />}
          <div className="min-w-0">
            <h3 className="truncate font-bold text-stone-900">{title}</h3>
            {subtitle && <p className="truncate text-xs text-stone-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
  tone: string;
}> = ({ label, value, hint, icon: Icon, tone }) => (
  <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-200/50 sm:p-5">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 sm:text-xs">{label}</span>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </span>
    </div>
    <div className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 tabular-nums sm:text-4xl">{value}</div>
    {hint && <p className="mt-1 truncate text-xs text-stone-500">{hint}</p>}
  </div>
);

export const EmptyState: React.FC<{ icon: React.ElementType; title: string; text?: string }> = ({
  icon: Icon,
  title,
  text,
}) => (
  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
    <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-400">
      <Icon size={22} />
    </span>
    <p className="font-semibold text-stone-700">{title}</p>
    {text && <p className="mt-1 max-w-xs text-sm text-stone-500">{text}</p>}
  </div>
);
