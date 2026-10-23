import React from 'react';
import { LayoutDashboard, Users, CreditCard, RefreshCw } from 'lucide-react';
import { ViewMode } from '../types';
import { LOGO_CBMMG } from '../types-logos';

interface NavProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  todayCount: number;
  selectedCount: number;
  totalCount: number;
  isMock: boolean;
  loading: boolean;
  onRefresh: () => void;
}

const NAV_ITEMS = [
  { id: ViewMode.DASHBOARD, label: 'Painel', fullLabel: 'Painel Geral', icon: LayoutDashboard },
  { id: ViewMode.LIST, label: 'Militares', fullLabel: 'Lista de Militares', icon: Users },
  { id: ViewMode.GENERATOR, label: 'Cartões', fullLabel: 'Gerar Cartões', icon: CreditCard },
];

const badgeFor = (id: ViewMode, todayCount: number, selectedCount: number) => {
  if (id === ViewMode.DASHBOARD && todayCount > 0) return { value: todayCount, tone: 'bg-cbmmg-orange text-white' };
  if (id === ViewMode.LIST && selectedCount > 0) return { value: selectedCount, tone: 'bg-cbmmg-red text-white' };
  return null;
};

/** Menu lateral (computador) */
const Sidebar: React.FC<NavProps> = ({
  currentView,
  onChangeView,
  todayCount,
  selectedCount,
  totalCount,
  isMock,
  loading,
  onRefresh,
}) => (
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-stone-950 text-stone-300 lg:flex">
    <div className="relative overflow-hidden px-6 pb-6 pt-7">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cbmmg-red/25 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <img src={LOGO_CBMMG} alt="Brasão CBMMG" className="h-12 w-12 drop-shadow" />
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cbmmg-orange">CBMMG</p>
          <h1 className="text-lg font-extrabold tracking-tight text-white">Aniversariantes</h1>
          <p className="text-xs text-stone-400">1ª Cia Operacional · 6º BBM</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 space-y-1 px-3">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Menu</p>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = currentView === item.id;
        const badge = badgeFor(item.id, todayCount, selectedCount);
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors
              ${active ? 'bg-white/10 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'}`}
          >
            {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cbmmg-red" />}
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg transition-colors
                ${active ? 'bg-cbmmg-red text-white' : 'bg-white/5 text-stone-400 group-hover:text-stone-100'}`}
            >
              <Icon size={17} />
            </span>
            <span className="flex-1 text-left">{item.fullLabel}</span>
            {badge && (
              <span className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${badge.tone}`}>
                {badge.value}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isMock ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <span className="text-xs font-semibold text-stone-200">
          {isMock ? 'Modo demonstração' : 'Planilha sincronizada'}
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-400">
        {loading ? 'Carregando dados…' : `${totalCount} militares no efetivo`}
      </p>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-semibold text-stone-100 transition-colors hover:bg-white/15 disabled:opacity-50"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        Atualizar dados
      </button>
    </div>
    <p className="px-6 pb-5 text-[11px] text-stone-500">&copy; {new Date().getFullYear()} CBMMG</p>
  </aside>
);

/** Cabeçalho superior (celular/tablet) */
export const MobileHeader: React.FC<Pick<NavProps, 'isMock' | 'loading' | 'onRefresh'>> = ({
  isMock,
  loading,
  onRefresh,
}) => (
  <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
    <img src={LOGO_CBMMG} alt="Brasão CBMMG" className="h-9 w-9" />
    <div className="min-w-0 flex-1 leading-tight">
      <p className="truncate text-sm font-extrabold text-stone-900">Aniversariantes</p>
      <p className="flex items-center gap-1.5 truncate text-[11px] text-stone-500">
        <span className={`h-1.5 w-1.5 rounded-full ${isMock ? 'bg-amber-400' : 'bg-emerald-500'}`} />
        1ª Cia Op · {isMock ? 'demonstração' : 'sincronizado'}
      </p>
    </div>
    <button
      onClick={onRefresh}
      disabled={loading}
      className="grid h-9 w-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
      aria-label="Atualizar dados"
    >
      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
    </button>
  </header>
);

/** Barra de navegação inferior (celular/tablet) */
export const MobileNav: React.FC<Pick<NavProps, 'currentView' | 'onChangeView' | 'todayCount' | 'selectedCount'>> = ({
  currentView,
  onChangeView,
  todayCount,
  selectedCount,
}) => (
  <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden">
    <div className="grid h-16 grid-cols-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = currentView === item.id;
        const badge = badgeFor(item.id, todayCount, selectedCount);
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors
              ${active ? 'text-cbmmg-red' : 'text-stone-500'}`}
          >
            <span className={`relative grid h-8 w-12 place-items-center rounded-full transition-colors ${active ? 'bg-red-50' : ''}`}>
              <Icon size={20} />
              {badge && (
                <span className={`absolute -right-0.5 -top-1 min-w-[1.1rem] rounded-full px-1 text-[10px] leading-4 ${badge.tone}`}>
                  {badge.value}
                </span>
              )}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  </nav>
);

export default Sidebar;
