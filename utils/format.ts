import { Military } from '../types';

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Mês (0-11) e dia do aniversário a partir de YYYY-MM-DD */
export const parseBirth = (s: Military) => {
  const parts = (s.birthDate || '').split('-');
  return { month: parseInt(parts[1]) - 1, day: parseInt(parts[2]) };
};

/** "dd/mm" */
export const formatDayMonth = (s: Military) =>
  (s.birthDate || '').split('-').reverse().slice(0, 2).join('/');

export const monthShort = (m: number) =>
  new Date(2000, m, 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

export const emailFor = (s: Military) =>
  `${s.bmNumber.replace(/\D/g, '')}@bombeiros.mg.gov.br`;

export const isBirthdayToday = (s: Military, today: Date = new Date()) => {
  const { month, day } = parseBirth(s);
  return month === today.getMonth() && day === today.getDate();
};

/** Dias até o próximo aniversário (0 = hoje) */
export const daysUntilBirthday = (s: Military, from: Date = new Date()) => {
  const { month, day } = parseBirth(s);
  if (isNaN(month) || isNaN(day)) return Infinity;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(from.getFullYear(), month, day);
  if (next < start) next = new Date(from.getFullYear() + 1, month, day);
  return Math.round((next.getTime() - start.getTime()) / 86400000);
};

/** Cria uma data mantendo o dia dentro do limite do mês (ex.: 31 → 30) */
export const clampDate = (year: number, month: number, day: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, daysInMonth));
};

/** Domingo a sábado da semana da data de referência */
export const weekRange = (ref: Date) => {
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - ref.getDay());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
};

export const formatWeekRange = (ref: Date) => {
  const { start, end } = weekRange(ref);
  const sameMonth = start.getMonth() === end.getMonth();
  const startTxt = sameMonth
    ? String(start.getDate())
    : `${start.getDate()} de ${monthShort(start.getMonth())}`;
  return `${startTxt} a ${end.getDate()} de ${monthShort(end.getMonth())}`;
};

export const isOfficer = (rank: string) => /\b(Ten|Cap|Maj|Cel)\b/i.test(rank);

export const sortByDay = (list: Military[]) =>
  [...list].sort((a, b) => (parseBirth(a).day || 0) - (parseBirth(b).day || 0));
