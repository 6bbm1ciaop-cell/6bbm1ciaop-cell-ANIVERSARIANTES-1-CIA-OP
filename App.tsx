import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  AlertTriangle, CalendarDays, CalendarRange, Cake, ChevronLeft, ChevronRight, Download, Eye, Mail,
  Printer, RefreshCw, Search, Send, Users, X, XCircle, CheckCircle2, Gift, Loader2,
} from 'lucide-react';
import { Military, ViewMode, FilterState } from './types';
import {
  fetchMilitaryData, getBirthdaysByDate, getBirthdaysByMonth, getBirthdaysByWeek, filterSoldiers, sendEmailViaGoogleScript,
} from './services/dataService';
import Sidebar, { MobileHeader, MobileNav } from './components/Sidebar';
import BirthdayCard from './components/BirthdayCard';
import FilterBar from './components/FilterBar';
import Calendar from './components/Calendar';
import BirthdayListItem from './components/BirthdayListItem';
import CardPreview from './components/CardPreview';
import { Avatar, DateTile, EmptyState, Panel, RankBadge, StatCard, TodayBadge } from './components/ui';
import { LOGO_CBMMG } from './types-logos';
import {
  MONTHS, clampDate, daysUntilBirthday, emailFor, formatDayMonth, formatWeekRange, isBirthdayToday, parseBirth, sortByDay,
} from './utils/format';

type PreviewState = { kind: 'single'; soldier: Military } | { kind: 'week' } | { kind: 'month' } | null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [soldiers, setSoldiers] = useState<Military[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [selectedSoldierIds, setSelectedSoldierIds] = useState<Set<string>>(new Set());
  const [processingEmails, setProcessingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{ current: number; total: number; name?: string } | null>(null);
  const [emailReport, setEmailReport] = useState<{ success: number; failed: number } | null>(null);

  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Cartão oculto usado para gerar as imagens (individual / coletivo)
  const [captureSoldier, setCaptureSoldier] = useState<Military | null>(null);
  const [captureSoldiers, setCaptureSoldiers] = useState<Military[]>([]);
  const captureRef = useRef<HTMLDivElement>(null);

  const [generatorSearch, setGeneratorSearch] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    units: [],
    month: new Date().getMonth(),
  });

  const uniqueUnits = useMemo(() => {
    const units = new Set(soldiers.map((s) => s.unit).filter((u) => u && u.trim() !== ''));
    return Array.from(units).sort();
  }, [soldiers]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, month: selectedDate.getMonth() }));
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setPreview(null);
  }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMilitaryData();
      const isMock = data.length > 0 && data[0].id === '1' && data[0].name === 'Carlos Eduardo Silva';
      setIsUsingMockData(isMock);
      setSoldiers(data);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------ dados derivados
  const todaysBirthdays = useMemo(() => getBirthdaysByDate(soldiers, new Date()), [soldiers]);
  const selectedDateBirthdays = useMemo(() => getBirthdaysByDate(soldiers, selectedDate), [soldiers, selectedDate]);

  const weekBirthdaysFiltered = useMemo(() => {
    const weekData = getBirthdaysByWeek(soldiers, selectedDate);
    return filterSoldiers(weekData, filters.search, filters.units);
  }, [soldiers, selectedDate, filters.search, filters.units]);

  const monthBirthdaysFiltered = useMemo(() => {
    const monthData = getBirthdaysByMonth(soldiers, selectedDate.getMonth());
    return filterSoldiers(monthData, filters.search, filters.units);
  }, [soldiers, selectedDate, filters.search, filters.units]);

  const filteredSoldiersList = useMemo(() => {
    const list = sortByDay(getBirthdaysByMonth(soldiers, filters.month));
    return filterSoldiers(list, filters.search, filters.units);
  }, [soldiers, filters]);

  const nextBirthday = useMemo(() => {
    let best: { soldier: Military; days: number } | null = null;
    soldiers.forEach((s) => {
      const d = daysUntilBirthday(s);
      if (d > 0 && d !== Infinity && (!best || d < best.days)) best = { soldier: s, days: d };
    });
    return best as { soldier: Military; days: number } | null;
  }, [soldiers]);

  const monthName = MONTHS[selectedDate.getMonth()];

  // ------------------------------------------------------------------ seleção
  const handleSelectSoldier = (id: string) => {
    const next = new Set(selectedSoldierIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSoldierIds(next);
  };

  const allListSelected =
    filteredSoldiersList.length > 0 && filteredSoldiersList.every((s) => selectedSoldierIds.has(s.id));

  const handleSelectAll = () => {
    const next = new Set(selectedSoldierIds);
    if (allListSelected) filteredSoldiersList.forEach((s) => next.delete(s.id));
    else filteredSoldiersList.forEach((s) => next.add(s.id));
    setSelectedSoldierIds(next);
  };

  const changeMonth = (delta: number) =>
    setSelectedDate(clampDate(selectedDate.getFullYear(), selectedDate.getMonth() + delta, selectedDate.getDate()));

  // ------------------------------------------------------------------ geração de imagem
  const captureCanvas = async () => {
    if (!captureRef.current) return null;
    return html2canvas(captureRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#F4F1EA',
      width: 595,
      height: 842,
      windowWidth: 1200,
      scrollY: 0,
      x: 0,
      y: 0,
    });
  };

  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 0.8);
    link.click();
  };

  const handleDownloadCollective = async (kind: 'week' | 'month') => {
    const list = kind === 'week' ? weekBirthdaysFiltered : monthBirthdaysFiltered;
    if (list.length === 0 || downloading) return;

    setDownloading(kind);
    setPreview(null);
    setCaptureSoldier(null);
    setCaptureSoldiers(list);
    await wait(500);

    try {
      const canvas = await captureCanvas();
      if (canvas) {
        const filename =
          kind === 'week'
            ? `aniversariantes_semana_${selectedDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}.jpg`
            : `aniversariantes_mes_${selectedDate.toLocaleDateString('pt-BR', { month: 'long' })}.jpg`;
        downloadCanvas(canvas, filename);
      }
    } catch (error) {
      console.error(`Erro ao gerar cartão ${kind === 'week' ? 'semanal' : 'mensal'}`, error);
      alert(`Erro ao gerar a imagem do cartão ${kind === 'week' ? 'semanal' : 'mensal'}.`);
    }
    setCaptureSoldiers([]);
    setDownloading(null);
  };

  const handleDownloadSingleCard = async (soldier: Military) => {
    if (downloading) return;
    setDownloading(soldier.id);
    setCaptureSoldier(soldier);
    setCaptureSoldiers([]);
    await wait(500);

    try {
      const canvas = await captureCanvas();
      if (canvas) downloadCanvas(canvas, `cartao_${soldier.name.replace(/\s+/g, '_')}.jpg`);
    } catch (error) {
      console.error('Erro ao gerar cartão individual', error);
      alert('Erro ao gerar o cartão.');
    }
    setCaptureSoldier(null);
    setDownloading(null);
  };

  // ------------------------------------------------------------------ e-mail
  const handleSendEmails = async (specificIds?: string[]) => {
    const idsToSend = specificIds ? new Set(specificIds) : selectedSoldierIds;
    if (idsToSend.size === 0) return;

    const targets: Military[] = [];
    idsToSend.forEach((id) => {
      const s = soldiers.find((soldier) => soldier.id === id);
      if (s) targets.push(s);
    });
    if (targets.length === 0) return;

    setProcessingEmails(true);
    setEmailReport(null);
    setPreview(null);
    setEmailProgress({ current: 0, total: targets.length, name: targets[0].name });
    setCaptureSoldiers([]);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const soldier = targets[i];
      let sent = false;

      setEmailProgress({ current: i, total: targets.length, name: `${soldier.rank} ${soldier.name}` });
      setCaptureSoldier(soldier);
      await wait(400);

      try {
        const canvas = await captureCanvas();
        if (canvas) {
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const emailAddress = emailFor(soldier);
          const subject = `Feliz Aniversário - ${soldier.rank} ${soldier.name}`;
          // cid:birthdayCard → imagem inline tratada pelo Google Apps Script
          const body = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <p>Prezado(a) ${soldier.rank} ${soldier.name},</p>
                        <p>O Comando da 1ª Cia Operacional parabeniza-o(a) pelo seu aniversário.</p>
                        <br>
                        <img src="cid:birthdayCard" alt="Cartão de Aniversário" style="width: 100%; max-width: 600px; height: auto; border: 1px solid #ddd;">
                        <br><br>
                        <p>Atenciosamente,</p>
                        <p><strong>Comando da 1ª Cia Op - CBMMG</strong></p>
                    </div>
                `;
          sent = await sendEmailViaGoogleScript(emailAddress, subject, body, imgData);
        }
      } catch (err) {
        console.error(`Falha ao processar e-mail para ${soldier.name}`, err);
        sent = false;
      }

      if (sent) successCount++;
      else failureCount++;
      setEmailProgress({ current: i + 1, total: targets.length, name: `${soldier.rank} ${soldier.name}` });
    }

    setCaptureSoldier(null);
    setProcessingEmails(false);
    setEmailProgress(null);
    setEmailReport({ success: successCount, failed: failureCount });

    if (!specificIds) setSelectedSoldierIds(new Set());
  };

  const handleSendTodayEmails = () => handleSendEmails(todaysBirthdays.map((s) => s.id));

  const handleViewCard = (soldier: Military) => {
    setSelectedSoldierIds(new Set([soldier.id]));
    setView(ViewMode.GENERATOR);
  };

  // ================================================================== PAINEL
  const renderDashboard = () => (
    <div className="animate-fade-in space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="1ª Cia Operacional · 6º BBM"
        title="Painel de aniversariantes"
        subtitle="Acompanhe as datas do efetivo e envie os cartões de parabéns."
        right={
          <div className="inline-flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2 text-sm shadow-sm">
            <CalendarDays className="text-cbmmg-red" size={17} />
            <span className="font-semibold text-stone-700">
              {(() => {
                const txt = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
                return txt.charAt(0).toUpperCase() + txt.slice(1);
              })()}
            </span>
          </div>
        }
      />

      {isUsingMockData && <MockBanner onRetry={loadData} />}

      {/* Destaque do dia */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8f1117] via-cbmmg-red to-[#e4572a] p-5 text-white shadow-xl shadow-red-900/15 sm:p-7">
        <img
          src={LOGO_CBMMG}
          alt=""
          className="pointer-events-none absolute -bottom-12 -right-10 w-56 select-none opacity-[0.12] sm:w-72"
        />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Cake size={14} />
              Hoje · {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </span>

            {todaysBirthdays.length > 0 ? (
              <>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {todaysBirthdays.length} {todaysBirthdays.length === 1 ? 'aniversariante' : 'aniversariantes'} hoje
                </h2>
                <p className="mt-1 text-sm text-white/80 sm:text-base">
                  Envie os cartões de parabéns por e-mail com um clique.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {todaysBirthdays.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleViewCard(s)}
                      className="flex max-w-full items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      <Avatar name={s.name} size="sm" className="!bg-white !text-cbmmg-red" />
                      <span className="truncate">
                        {s.rank} {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Nenhum aniversariante hoje</h2>
                {nextBirthday ? (
                  <p className="mt-1 text-sm text-white/85 sm:text-base">
                    Próximo:{' '}
                    <strong className="font-bold text-white">
                      {nextBirthday.soldier.rank} {nextBirthday.soldier.name}
                    </strong>{' '}
                    — {nextBirthday.days === 1 ? 'amanhã' : `em ${nextBirthday.days} dias`} ({formatDayMonth(nextBirthday.soldier)})
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-white/80">Sem próximos aniversários cadastrados.</p>
                )}
              </>
            )}
          </div>

          {todaysBirthdays.length > 0 ? (
            <button
              onClick={handleSendTodayEmails}
              disabled={processingEmails}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-cbmmg-red shadow-lg shadow-red-950/20 transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
            >
              {processingEmails ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Enviar para todos ({todaysBirthdays.length})
            </button>
          ) : (
            nextBirthday && (
              <button
                onClick={() => handleViewCard(nextBirthday.soldier)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
              >
                <Eye size={18} />
                Ver cartão do próximo
              </button>
            )
          )}
        </div>
      </section>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Hoje" value={todaysBirthdays.length} hint="aniversariantes do dia" icon={Cake} tone="bg-red-50 text-cbmmg-red" />
        <StatCard
          label="Na semana"
          value={weekBirthdaysFiltered.length}
          hint={formatWeekRange(selectedDate)}
          icon={CalendarRange}
          tone="bg-orange-50 text-cbmmg-orange"
        />
        <StatCard
          label="No mês"
          value={monthBirthdaysFiltered.length}
          hint={`em ${monthName.toLowerCase()}`}
          icon={CalendarDays}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard label="Efetivo" value={soldiers.length} hint="militares cadastrados" icon={Users} tone="bg-stone-100 text-stone-600" />
      </div>

      <FilterBar filters={filters} setFilters={setFilters} availableUnits={uniqueUnits} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Coluna esquerda: calendário + dia */}
        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-200/50 sm:p-5">
            <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} soldiers={soldiers} />
          </div>

          <Panel
            title={`Dia ${selectedDate.getDate()} de ${monthName.toLowerCase()}`}
            subtitle={
              selectedDateBirthdays.length
                ? `${selectedDateBirthdays.length} aniversariante(s)`
                : 'Clique em um dia do calendário'
            }
          >
            {selectedDateBirthdays.length === 0 ? (
              <EmptyState icon={Gift} title="Sem aniversários neste dia" />
            ) : (
              <div className="space-y-2">
                {selectedDateBirthdays.map((s) => (
                  <BirthdayListItem
                    key={s.id}
                    soldier={s}
                    compact
                    onClick={() => handleViewCard(s)}
                    onHover={(x) => setPreview(x ? { kind: 'single', soldier: x } : null)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Coluna direita: semana + mês */}
        <div className="space-y-5 lg:col-span-7 xl:col-span-8">
          <Panel
            accent="orange"
            title="Aniversariantes da semana"
            subtitle={`${formatWeekRange(selectedDate)} · ${weekBirthdaysFiltered.length} militar(es)`}
            actions={
              weekBirthdaysFiltered.length > 0 && (
                <CollectiveButton
                  label="Cartão semanal"
                  tone="orange"
                  loading={downloading === 'week'}
                  onClick={() => handleDownloadCollective('week')}
                  onHover={(on) => setPreview(on ? { kind: 'week' } : null)}
                />
              )
            }
          >
            {weekBirthdaysFiltered.length === 0 ? (
              <EmptyState icon={CalendarRange} title="Ninguém nesta semana" text="Nenhum militar encontrado com os filtros atuais." />
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {weekBirthdaysFiltered.map((s) => (
                  <BirthdayListItem
                    key={s.id}
                    soldier={s}
                    onClick={() => handleViewCard(s)}
                    onHover={(x) => setPreview(x ? { kind: 'single', soldier: x } : null)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            accent="red"
            title={`Aniversariantes de ${monthName.toLowerCase()}`}
            subtitle={`${monthBirthdaysFiltered.length} militar(es) no mês`}
            actions={
              monthBirthdaysFiltered.length > 0 && (
                <CollectiveButton
                  label="Cartão mensal"
                  tone="red"
                  loading={downloading === 'month'}
                  onClick={() => handleDownloadCollective('month')}
                  onHover={(on) => setPreview(on ? { kind: 'month' } : null)}
                />
              )
            }
            bodyClassName="p-0"
          >
            {monthBirthdaysFiltered.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Ninguém neste mês" text="Nenhum militar encontrado com os filtros atuais." />
            ) : (
              <div className="custom-scrollbar grid max-h-[460px] grid-cols-1 gap-2.5 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
                {sortByDay(monthBirthdaysFiltered).map((s) => (
                  <BirthdayListItem
                    key={s.id}
                    soldier={s}
                    onClick={() => handleViewCard(s)}
                    onHover={(x) => setPreview(x ? { kind: 'single', soldier: x } : null)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );

  // ================================================================== LISTA
  const renderList = () => (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        eyebrow="Envio em lote"
        title="Lista de militares"
        subtitle={`${filteredSoldiersList.length} aniversariante(s) em ${monthName.toLowerCase()} · selecione e envie os cartões por e-mail.`}
        right={
          <button
            onClick={() => handleSendEmails()}
            disabled={selectedSoldierIds.size === 0 || processingEmails}
            className="hidden items-center gap-2 rounded-xl bg-cbmmg-red px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-300/50 transition hover:bg-cbmmg-red-dark disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none sm:inline-flex"
          >
            {processingEmails ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
            {processingEmails ? 'Enviando…' : `Enviar e-mail (${selectedSoldierIds.size})`}
          </button>
        }
      />

      <FilterBar filters={filters} setFilters={setFilters} availableUnits={uniqueUnits}>
        <div className="flex h-11 items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-1 md:w-56">
          <button
            onClick={() => changeMonth(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-white hover:text-stone-900"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={17} />
          </button>
          <select
            value={filters.month}
            onChange={(e) =>
              setSelectedDate(clampDate(selectedDate.getFullYear(), parseInt(e.target.value), selectedDate.getDate()))
            }
            className="h-full flex-1 cursor-pointer appearance-none bg-transparent text-center text-sm font-bold text-stone-800 outline-none"
            aria-label="Mês"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={() => changeMonth(1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-white hover:text-stone-900"
            aria-label="Próximo mês"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </FilterBar>

      <div className="overflow-clip rounded-2xl border border-stone-200/80 bg-white shadow-sm shadow-stone-200/50">
        {/* Cabeçalho da lista (celular) */}
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 md:hidden">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-stone-700">
            <input
              type="checkbox"
              className="h-5 w-5 rounded accent-cbmmg-red"
              checked={allListSelected}
              onChange={handleSelectAll}
            />
            Selecionar todos
          </label>
          <span className="text-xs text-stone-500">{filteredSoldiersList.length} militar(es)</span>
        </div>

        {filteredSoldiersList.length === 0 ? (
          <EmptyState icon={Search} title="Nenhum militar encontrado" text={`Não há aniversariantes em ${monthName.toLowerCase()} com os filtros atuais.`} />
        ) : (
          <>
            {/* Tabela (tablet/computador) */}
            <table className="hidden w-full text-left md:table">
              <thead className="sticky top-14 z-10 bg-stone-50/95 backdrop-blur lg:top-0">
                <tr className="border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="w-12 py-3 pl-5">
                    <input
                      type="checkbox"
                      className="h-[18px] w-[18px] cursor-pointer rounded accent-cbmmg-red"
                      checked={allListSelected}
                      onChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </th>
                  <th className="px-3 py-3">Aniversário</th>
                  <th className="px-3 py-3">Militar</th>
                  <th className="px-3 py-3">Lotação</th>
                  <th className="hidden px-3 py-3 xl:table-cell">E-mail</th>
                  <th className="py-3 pl-3 pr-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSoldiersList.map((soldier) => {
                  const isSelected = selectedSoldierIds.has(soldier.id);
                  const today = isBirthdayToday(soldier);
                  const { day, month } = parseBirth(soldier);
                  return (
                    <tr
                      key={soldier.id}
                      onClick={() => handleSelectSoldier(soldier.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-red-50/70' : 'hover:bg-stone-50'}`}
                    >
                      <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-[18px] w-[18px] cursor-pointer rounded accent-cbmmg-red"
                          checked={isSelected}
                          onChange={() => handleSelectSoldier(soldier.id)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <DateTile day={day} month={month} highlight={today} small />
                          {today && <TodayBadge />}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={soldier.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-stone-900">{soldier.name}</p>
                            <div className="mt-1">
                              <RankBadge rank={soldier.rank} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">{soldier.unit}</span>
                      </td>
                      <td className="hidden px-3 py-3 font-mono text-xs text-stone-500 xl:table-cell">{emailFor(soldier)}</td>
                      <td className="py-3 pl-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-cbmmg-red transition-colors hover:bg-red-50"
                          onClick={() => handleViewCard(soldier)}
                          onMouseEnter={() => setPreview({ kind: 'single', soldier })}
                          onMouseLeave={() => setPreview(null)}
                        >
                          <Eye size={16} /> Visualizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Cartões (celular) */}
            <ul className="divide-y divide-stone-100 md:hidden">
              {filteredSoldiersList.map((soldier) => {
                const isSelected = selectedSoldierIds.has(soldier.id);
                const today = isBirthdayToday(soldier);
                const { day, month } = parseBirth(soldier);
                return (
                  <li
                    key={soldier.id}
                    onClick={() => handleSelectSoldier(soldier.id)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-red-50/70' : 'active:bg-stone-50'}`}
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 rounded accent-cbmmg-red"
                      checked={isSelected}
                      onChange={() => handleSelectSoldier(soldier.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <DateTile day={day} month={month} highlight={today} small />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900">{soldier.name}</p>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-stone-500">
                        <RankBadge rank={soldier.rank} />
                        <span className="truncate">{soldier.unit}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCard(soldier);
                      }}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-cbmmg-red hover:bg-red-50"
                      aria-label="Visualizar cartão"
                    >
                      <Eye size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Barra de ação flutuante */}
      {selectedSoldierIds.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 lg:bottom-6 lg:pl-72">
          <div className="pointer-events-auto flex w-full max-w-md animate-slide-up items-center gap-2 rounded-2xl bg-stone-900 py-2 pl-4 pr-2 text-white shadow-2xl shadow-stone-900/30">
            <span className="flex-1 text-sm">
              <strong className="font-extrabold">{selectedSoldierIds.size}</strong> selecionado(s)
            </span>
            <button
              onClick={() => setSelectedSoldierIds(new Set())}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-300 hover:bg-white/10 hover:text-white"
            >
              Limpar
            </button>
            <button
              onClick={() => handleSendEmails()}
              disabled={processingEmails}
              className="inline-flex items-center gap-2 rounded-xl bg-cbmmg-red px-4 py-2 text-sm font-bold transition hover:bg-cbmmg-red-dark disabled:opacity-60"
            >
              {processingEmails ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar e-mail
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ================================================================== GERADOR
  const renderGenerator = () => {
    const targetId = selectedSoldierIds.size > 0 ? Array.from(selectedSoldierIds)[0] : soldiers[0]?.id;
    const targetSoldier = soldiers.find((s) => s.id === targetId);

    const pickerList = generatorSearch.trim()
      ? soldiers.filter((s) => s.name.toLowerCase().includes(generatorSearch.toLowerCase())).slice(0, 30)
      : filteredSoldiersList;

    if (!targetSoldier) {
      return (
        <div className="animate-fade-in">
          <EmptyState icon={Users} title="Nenhum militar disponível" text="Selecione um militar na lista para gerar o cartão." />
        </div>
      );
    }

    const { day, month } = parseBirth(targetSoldier);
    const today = isBirthdayToday(targetSoldier);
    const daysLeft = daysUntilBirthday(targetSoldier);

    return (
      <div className="animate-fade-in space-y-5">
        <PageHeader eyebrow="Cartões" title="Gerador de cartão" subtitle="Visualize, baixe, imprima ou envie o cartão por e-mail." />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[380px_1fr] lg:grid-rows-[auto_1fr] lg:gap-6">
            {/* Militar selecionado */}
            <div className="overflow-hidden rounded-2xl lg:col-start-1 lg:row-start-1 border border-stone-200/80 bg-white shadow-sm shadow-stone-200/50">
              <div className="relative bg-gradient-to-br from-stone-900 to-stone-800 px-5 pb-5 pt-5 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cbmmg-red/30 blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <Avatar name={targetSoldier.name} size="lg" className="ring-4 ring-white/10" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <RankBadge rank={targetSoldier.rank} />
                      {today && <TodayBadge />}
                    </div>
                    <p className="mt-1.5 text-lg font-extrabold leading-tight">{targetSoldier.name}</p>
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-px bg-stone-100 text-sm">
                <InfoCell label="Unidade (OBM)" value={targetSoldier.unit} />
                <InfoCell
                  label="Aniversário"
                  value={
                    <span className="flex items-center gap-2">
                      {formatDayMonth(targetSoldier)}
                      <span className="text-xs font-medium text-stone-400">
                        {today ? 'hoje' : daysLeft === 1 ? 'amanhã' : daysLeft !== Infinity ? `em ${daysLeft} dias` : ''}
                      </span>
                    </span>
                  }
                />
                <InfoCell label="E-mail" value={<span className="break-all font-mono text-xs">{emailFor(targetSoldier)}</span>} wide />
              </dl>

              <div className="grid grid-cols-2 gap-2 p-4">
                <button
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-cbmmg-red py-3 font-bold text-white shadow-md shadow-red-300/50 transition hover:bg-cbmmg-red-dark active:scale-[0.99] disabled:opacity-60"
                  onClick={() => handleSendEmails([targetSoldier.id])}
                  disabled={processingEmails}
                >
                  {processingEmails ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  {processingEmails ? 'Processando…' : 'Enviar por e-mail'}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
                  onClick={() => handleDownloadSingleCard(targetSoldier)}
                  disabled={downloading === targetSoldier.id}
                >
                  {downloading === targetSoldier.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Baixar imagem
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              </div>
            </div>

          {/* Pré-visualização */}
          <div className="rounded-2xl border lg:col-start-2 lg:row-span-2 lg:row-start-1 border-stone-200/80 bg-stone-100 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] p-4 shadow-inner [background-size:16px_16px] sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600 shadow-sm">
                <Eye size={14} /> Pré-visualização
              </span>
              <span className="hidden items-center gap-1.5 text-xs text-stone-500 sm:flex">
                <DateTile day={day} month={month} small highlight={today} />
              </span>
            </div>
            <CardPreview soldier={targetSoldier} maxWidth={560} id="printable-card" />
          </div>

            {/* Escolher outro militar */}
            <Panel
              className="lg:col-start-1 lg:row-start-2"
              title="Escolher militar"
              subtitle={generatorSearch ? 'Resultado da busca em todo o efetivo' : `Aniversariantes de ${monthName.toLowerCase()}`}
              bodyClassName="p-0"
            >
              <div className="border-b border-stone-100 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    value={generatorSearch}
                    onChange={(e) => setGeneratorSearch(e.target.value)}
                    placeholder="Buscar no efetivo…"
                    className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none transition focus:border-cbmmg-red/40 focus:bg-white focus:ring-4 focus:ring-cbmmg-red/10"
                  />
                </div>
              </div>
              <div className="custom-scrollbar max-h-80 space-y-2 overflow-y-auto p-3">
                {pickerList.length === 0 ? (
                  <EmptyState icon={Search} title="Nenhum militar encontrado" />
                ) : (
                  pickerList.map((s) => (
                    <BirthdayListItem
                      key={s.id}
                      soldier={s}
                      compact
                      active={s.id === targetSoldier.id}
                      onClick={() => setSelectedSoldierIds(new Set([s.id]))}
                    />
                  ))
                )}
              </div>
            </Panel>
        </div>
      </div>
    );
  };

  // ================================================================== SHELL
  return (
    <div className="min-h-screen bg-[#f6f5f2] font-sans text-stone-800">
      <Sidebar
        currentView={view}
        onChangeView={setView}
        todayCount={todaysBirthdays.length}
        selectedCount={selectedSoldierIds.size}
        totalCount={soldiers.length}
        isMock={isUsingMockData}
        loading={loading}
        onRefresh={loadData}
      />
      <MobileHeader isMock={isUsingMockData} loading={loading} onRefresh={loadData} />

      {/* ÁREA DE CAPTURA OCULTA — usada para gerar as imagens sem afetar a interface */}
      <div
        style={{ position: 'absolute', top: 0, left: '-2000px', width: '595px', height: '842px', zIndex: -10, overflow: 'hidden' }}
        ref={captureRef}
        aria-hidden="true"
      >
        {captureSoldier && !captureSoldiers.length && <BirthdayCard soldier={captureSoldier} className="bg-[#F4F1EA]" />}
        {captureSoldiers.length > 0 && <BirthdayCard soldiers={captureSoldiers} className="bg-[#F4F1EA]" />}
      </div>

      <main className="pb-28 lg:pb-10 lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {loading ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-stone-500">
              <div className="relative mb-5">
                <img src={LOGO_CBMMG} alt="" className="h-16 w-16 opacity-90" />
                <Loader2 className="absolute -bottom-2 -right-2 animate-spin rounded-full bg-white text-cbmmg-red" size={24} />
              </div>
              <p className="font-semibold">Sincronizando dados da planilha…</p>
            </div>
          ) : (
            <>
              {view === ViewMode.DASHBOARD && renderDashboard()}
              {view === ViewMode.LIST && renderList()}
              {view === ViewMode.GENERATOR && renderGenerator()}
            </>
          )}
        </div>
      </main>

      <MobileNav
        currentView={view}
        onChangeView={setView}
        todayCount={todaysBirthdays.length}
        selectedCount={selectedSoldierIds.size}
      />

      {/* Pré-visualização flutuante (hover, apenas computador) */}
      {preview && !processingEmails && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 hidden animate-slide-up overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/25 ring-1 ring-stone-200 lg:block">
          <div className="flex items-center justify-center gap-2 bg-stone-900 py-2 text-[11px] font-bold uppercase tracking-wider text-white">
            <Eye size={12} />
            {preview.kind === 'week' ? 'Cartão semanal' : preview.kind === 'month' ? 'Cartão mensal' : 'Cartão individual'}
          </div>
          <div style={{ width: '268px', height: '379px', overflow: 'hidden' }}>
            <div style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '595px', height: '842px' }}>
              {preview.kind === 'week' ? (
                <BirthdayCard soldiers={weekBirthdaysFiltered} />
              ) : preview.kind === 'month' ? (
                <BirthdayCard soldiers={monthBirthdaysFiltered} />
              ) : (
                <BirthdayCard soldier={preview.soldier} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progresso do envio */}
      {processingEmails && emailProgress && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-scale-in rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-cbmmg-orange">
              <Send size={28} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-stone-900">Enviando cartões…</h3>
            <p className="mt-1 text-sm text-stone-500">
              {emailProgress.current} de {emailProgress.total} concluído(s)
            </p>
            {emailProgress.name && <p className="mt-3 truncate text-sm font-semibold text-stone-700">{emailProgress.name}</p>}
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cbmmg-orange to-cbmmg-red transition-all duration-300"
                style={{ width: `${(emailProgress.current / emailProgress.total) * 100}%` }}
              />
            </div>
            <p className="mt-4 text-xs text-stone-400">Por favor, não feche esta janela.</p>
          </div>
        </div>
      )}

      {/* Relatório do envio */}
      {emailReport && (
        <div className="fixed inset-x-4 top-16 z-[55] flex justify-center sm:inset-x-auto sm:right-6 sm:top-6">
          <div
            className={`flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl shadow-stone-900/10
              ${emailReport.failed > 0 ? 'border-red-200' : 'border-emerald-200'}`}
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl
                ${emailReport.failed > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
            >
              {emailReport.failed > 0 ? <XCircle size={22} /> : <CheckCircle2 size={22} />}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-stone-900">Relatório de envio</h4>
              <p className="mt-0.5 text-sm text-stone-600">
                {emailReport.success > 0 && (
                  <span className="font-semibold text-emerald-700">{emailReport.success} enviado(s) com sucesso. </span>
                )}
                {emailReport.failed > 0 && <span className="font-semibold text-red-700">{emailReport.failed} falhou(aram).</span>}
              </p>
              {emailReport.failed > 0 && (
                <p className="mt-1 text-xs text-stone-500">
                  Verifique se a URL do Script Google está correta ou se os e-mails dos militares são válidos.
                </p>
              )}
            </div>
            <button
              className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              onClick={() => setEmailReport(null)}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ subcomponentes

const PageHeader: React.FC<{ eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode }> = ({
  eyebrow,
  title,
  subtitle,
  right,
}) => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cbmmg-red">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-stone-500 sm:text-base">{subtitle}</p>}
    </div>
    {right}
  </header>
);

const MockBanner: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
      <AlertTriangle size={20} />
    </span>
    <div className="flex-1 text-sm text-amber-900">
      <h3 className="font-bold">Modo de demonstração ativo</h3>
      <p className="mt-0.5 text-amber-800">O sistema não conseguiu conectar à planilha. Verifique:</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-amber-800">
        <li>
          O ID da planilha em <code className="rounded bg-amber-100 px-1">services/dataService.ts</code> está correto?
        </li>
        <li>
          A planilha está compartilhada como <strong>“Qualquer pessoa com o link pode ler”</strong>?
        </li>
        <li>
          O nome da aba é exatamente <strong>ANIVERSARIANTES</strong>?
        </li>
      </ul>
    </div>
    <button
      onClick={onRetry}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-100 px-3.5 py-2 text-sm font-bold text-amber-900 transition-colors hover:bg-amber-200"
    >
      <RefreshCw size={15} /> Tentar novamente
    </button>
  </div>
);

const CollectiveButton: React.FC<{
  label: string;
  tone: 'orange' | 'red';
  loading: boolean;
  onClick: () => void;
  onHover: (on: boolean) => void;
}> = ({ label, tone, loading, onClick, onHover }) => (
  <button
    onClick={onClick}
    onMouseEnter={() => onHover(true)}
    onMouseLeave={() => onHover(false)}
    disabled={loading}
    title={`Baixar ${label.toLowerCase()} (sem enviar e-mail)`}
    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 sm:text-sm
      ${tone === 'orange' ? 'bg-cbmmg-orange hover:bg-orange-600' : 'bg-cbmmg-red hover:bg-cbmmg-red-dark'}`}
  >
    {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
    {label}
  </button>
);

const InfoCell: React.FC<{ label: string; value: React.ReactNode; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={`bg-white px-5 py-3 ${wide ? 'col-span-2' : ''}`}>
    <dt className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</dt>
    <dd className="mt-0.5 font-semibold text-stone-900">{value}</dd>
  </div>
);

export default App;
