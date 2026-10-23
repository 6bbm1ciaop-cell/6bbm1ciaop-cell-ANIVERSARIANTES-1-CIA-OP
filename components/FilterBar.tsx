import React, { useState } from 'react';
import { Search, X, Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableUnits: string[];
  /** Controles extras (ex.: seletor de mês na lista) */
  children?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, availableUnits, children }) => {
  const [open, setOpen] = useState(false);

  const toggleUnit = (u: string) =>
    setFilters((prev) => ({
      ...prev,
      units: prev.units.includes(u) ? prev.units.filter((x) => x !== u) : [...prev.units, u],
    }));

  const unitLabel =
    filters.units.length === 0
      ? 'Todas as unidades'
      : filters.units.length === 1
        ? filters.units[0]
        : `${filters.units.length} unidades`;

  const hasFilters = filters.search !== '' || filters.units.length > 0;

  return (
    <div className="relative z-20 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm shadow-stone-200/50">
      <div className="flex flex-col gap-2.5 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Buscar militar pelo nome…"
            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-10 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-cbmmg-red/40 focus:bg-white focus:ring-4 focus:ring-cbmmg-red/10"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:bg-stone-200/60 hover:text-stone-600"
              aria-label="Limpar busca"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="relative md:w-60">
          <button
            onClick={() => setOpen(!open)}
            className={`flex h-11 w-full items-center gap-2 rounded-xl border px-3.5 text-sm transition
              ${open || filters.units.length > 0
                ? 'border-cbmmg-red/40 bg-white ring-4 ring-cbmmg-red/10'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
          >
            <SlidersHorizontal size={16} className="shrink-0 text-stone-400" />
            <span className={`flex-1 truncate text-left ${filters.units.length ? 'font-semibold text-stone-900' : 'text-stone-500'}`}>
              {unitLabel}
            </span>
            <ChevronDown size={16} className={`shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="custom-scrollbar absolute left-0 right-0 top-full z-50 mt-2 max-h-80 animate-scale-in overflow-y-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-300/40 md:left-auto md:w-72">
                <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Filtrar por unidade
                </p>
                {availableUnits.length === 0 && <p className="px-3 py-2 text-sm text-stone-400">Nenhuma unidade.</p>}
                {availableUnits.map((u) => {
                  const selected = filters.units.includes(u);
                  return (
                    <button
                      key={u}
                      onClick={() => toggleUnit(u)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors
                        ${selected ? 'bg-red-50 font-semibold text-cbmmg-red' : 'text-stone-700 hover:bg-stone-50'}`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors
                          ${selected ? 'border-cbmmg-red bg-cbmmg-red' : 'border-stone-300 bg-white'}`}
                      >
                        {selected && <Check size={13} className="text-white" strokeWidth={3} />}
                      </span>
                      {u}
                    </button>
                  );
                })}
                <div className="mt-1 flex justify-between border-t border-stone-100 px-1 pt-1.5">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, units: [] }))}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-cbmmg-red hover:bg-red-50"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {children}
      </div>

      {hasFilters && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-1 pl-2.5 pr-1 text-xs font-medium text-stone-700">
              “{filters.search}”
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-stone-200"
                aria-label="Remover busca"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.units.map((u) => (
            <span key={u} className="inline-flex items-center gap-1 rounded-full bg-red-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-cbmmg-red">
              {u}
              <button
                onClick={() => toggleUnit(u)}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-red-100"
                aria-label={`Remover ${u}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFilters((prev) => ({ ...prev, search: '', units: [] }))}
            className="ml-1 text-xs font-semibold text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
