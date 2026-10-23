import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Military } from '../types';
import { MONTHS, clampDate, parseBirth } from '../utils/format';

interface CalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  soldiers: Military[];
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect, soldiers }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const today = new Date();

  const countsByDay = useMemo(() => {
    const map = new Map<number, number>();
    soldiers.forEach((s) => {
      const b = parseBirth(s);
      if (b.month === month) map.set(b.day, (map.get(b.day) || 0) + 1);
    });
    return map;
  }, [soldiers, month]);

  const offset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const goMonth = (delta: number) => onSelect(clampDate(year, month + delta, selectedDate.getDate()));

  const isCurrentDay =
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === selectedDate.getDate();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{year}</p>
          <h3 className="text-lg font-extrabold text-stone-900">{MONTHS[month]}</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentDay && (
            <button
              onClick={() => onSelect(new Date())}
              className="mr-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-cbmmg-red transition-colors hover:bg-red-100"
            >
              Hoje
            </button>
          )}
          <button
            onClick={() => goMonth(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goMonth(1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-[11px] font-bold text-stone-400">
            {d}
          </div>
        ))}
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - offset + 1;
          if (day < 1 || day > daysInMonth) return <div key={i} />;

          const count = countsByDay.get(day) || 0;
          const isSelected = day === selectedDate.getDate();
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          return (
            <button
              key={i}
              onClick={() => onSelect(new Date(year, month, day))}
              title={count ? `${count} aniversariante(s)` : undefined}
              className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-sm transition-all
                ${isSelected
                  ? 'bg-cbmmg-red font-bold text-white shadow-md shadow-red-300/60'
                  : isToday
                    ? 'font-bold text-cbmmg-red ring-2 ring-inset ring-cbmmg-red/40 hover:bg-red-50'
                    : count
                      ? 'bg-orange-50 font-semibold text-stone-800 hover:bg-orange-100'
                      : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                    <span key={k} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-cbmmg-orange'}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cbmmg-orange" /> Aniversário
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-inset ring-cbmmg-red/40" /> Hoje
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-cbmmg-red" /> Selecionado
        </span>
      </div>
    </div>
  );
};

export default Calendar;
