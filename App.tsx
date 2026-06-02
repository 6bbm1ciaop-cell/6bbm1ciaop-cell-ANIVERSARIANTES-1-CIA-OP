import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Military, ViewMode, FilterState } from './types';
import { fetchMilitaryData, getBirthdaysByDate, getBirthdaysByMonth, getBirthdaysByWeek, filterSoldiers, getDateForYear, sendEmailViaGoogleScript } from './services/dataService';
import Sidebar from './components/Sidebar';
import BirthdayCard from './components/BirthdayCard';
import { Calendar as CalendarIcon, Search, Mail, Filter, Download, Check, X, RefreshCw, ChevronRight, Zap, Eye, AlertTriangle, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

// Extracted FilterBar Component
interface FilterBarProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    availableUnits: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, availableUnits }) => {
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6 border-l-4 border-cbmmg-red relative z-30">
            <div className="flex items-center gap-2 text-cbmmg-red font-bold uppercase text-sm w-full md:w-auto">
                <Filter size={18} />
                <span>Filtros Rápidos</span>
            </div>
            <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Filtrar por nome do militar..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-cbmmg-red focus:outline-none focus:bg-white transition-colors"
                    value={filters.search}
                    onChange={e => setFilters(prev => ({...prev, search: e.target.value}))}
                />
            </div>
            
            <div className="w-full md:w-72 relative">
                 <button
                    onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-cbmmg-red focus:outline-none focus:bg-white transition-colors flex justify-between items-center group hover:border-gray-300"
                >
                    <span className={`text-sm ${filters.units.length === 0 ? 'text-gray-500' : 'text-gray-900 font-medium'} truncate`}>
                        {filters.units.length === 0 
                            ? 'Todas as Unidades' 
                            : filters.units.length === 1 
                                ? filters.units[0] 
                                : `${filters.units.length} selecionadas`}
                    </span>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isUnitDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
                </button>
                
                {isUnitDropdownOpen && (
                    <>
                    <div 
                        className="fixed inset-0 z-40 bg-transparent cursor-default" 
                        onClick={() => setIsUnitDropdownOpen(false)}
                    ></div>
                    
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div className="p-2 border-b border-gray-50 mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selecione as Unidades</span>
                        </div>
                        {availableUnits.map(u => {
                            const isSelected = filters.units.includes(u);
                            return (
                                <div 
                                    key={u} 
                                    onClick={() => {
                                        const newUnits = isSelected 
                                            ? filters.units.filter(unit => unit !== u)
                                            : [...filters.units, u];
                                        setFilters(prev => ({...prev, units: newUnits}));
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1
                                        ${isSelected ? 'bg-red-50 text-cbmmg-red' : 'hover:bg-gray-50 text-gray-600'}
                                    `}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                                        ${isSelected ? 'bg-cbmmg-red border-cbmmg-red' : 'border-gray-300 bg-white'}
                                    `}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-sm font-medium">{u}</span>
                                </div>
                            )
                        })}
                         <div className="pt-2 mt-1 border-t border-gray-50 flex justify-between px-1">
                            <button 
                                onClick={() => setFilters(prev => ({...prev, units: []}))}
                                className="text-xs text-gray-400 hover:text-gray-600 font-medium px-2 py-1"
                            >
                                Limpar
                            </button>
                            <button 
                                onClick={() => setIsUnitDropdownOpen(false)}
                                className="text-xs text-cbmmg-red font-bold hover:underline px-2 py-1"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [soldiers, setSoldiers] = useState<Military[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [selectedSoldierIds, setSelectedSoldierIds] = useState<Set<string>>(new Set());
  const [processingEmails, setProcessingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState<{current: number, total: number} | null>(null);
  
  const [emailReport, setEmailReport] = useState<{success: number, failed: number} | null>(null);

  // Auto-send state and logic completely removed as requested
  
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [hoveredSoldier, setHoveredSoldier] = useState<Military | null>(null);
  
  const [isHoveringWeeklyBtn, setIsHoveringWeeklyBtn] = useState(false);
  const [isHoveringMonthlyBtn, setIsHoveringMonthlyBtn] = useState(false);
  
  // Single capture soldier state
  const [captureSoldier, setCaptureSoldier] = useState<Military | null>(null);
  // Collective capture soldiers state
  const [captureSoldiers, setCaptureSoldiers] = useState<Military[]>([]);
  
  const captureRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    units: [], 
    month: new Date().getMonth()
  });

  const uniqueUnits = useMemo(() => {
    const units = new Set(soldiers.map(s => s.unit).filter(u => u && u.trim() !== ''));
    return Array.from(units).sort();
  }, [soldiers]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, month: selectedDate.getMonth() }));
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMilitaryData();
      const isMock = data.length > 0 && data[0].id === '1' && data[0].name === 'Carlos Eduardo Silva';
      setIsUsingMockData(isMock);
      setSoldiers(data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

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
    let list = getBirthdaysByMonth(soldiers, filters.month);
    
    // Sort by day (ascending)
    list.sort((a, b) => {
        const dayA = parseInt(a.birthDate.split('-')[2] || '0');
        const dayB = parseInt(b.birthDate.split('-')[2] || '0');
        return dayA - dayB;
    });

    return filterSoldiers(list, filters.search, filters.units);
  }, [soldiers, filters]);

  const handleSelectSoldier = (id: string) => {
    const newSet = new Set(selectedSoldierIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSoldierIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedSoldierIds.size === filteredSoldiersList.length) {
      setSelectedSoldierIds(new Set());
    } else {
      setSelectedSoldierIds(new Set(filteredSoldiersList.map(s => s.id)));
    }
  };

  const handleDownloadWeeklyCard = async () => {
      if (weekBirthdaysFiltered.length === 0) return;
      
      setCaptureSoldiers(weekBirthdaysFiltered);
      setCaptureSoldier(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (captureRef.current) {
          try {
             const canvas = await html2canvas(captureRef.current, {
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
                    y: 0
                });

             const link = document.createElement('a');
             link.download = `aniversariantes_semana_${selectedDate.toLocaleDateString('pt-BR').replace(/\//g,'-')}.jpg`;
             link.href = canvas.toDataURL('image/jpeg', 0.8);
             link.click();

          } catch (error) {
              console.error("Erro ao gerar cartão semanal", error);
              alert("Erro ao gerar a imagem do cartão semanal.");
          }
      }
      setCaptureSoldiers([]);
  }

  const handleDownloadMonthlyCard = async () => {
      if (monthBirthdaysFiltered.length === 0) return;
      
      setCaptureSoldiers(monthBirthdaysFiltered);
      setCaptureSoldier(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (captureRef.current) {
          try {
             const canvas = await html2canvas(captureRef.current, {
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
                    y: 0
                });

             const link = document.createElement('a');
             link.download = `aniversariantes_mes_${selectedDate.toLocaleDateString('pt-BR', {month: 'long'}).replace(/\//g,'-')}.jpg`;
             link.href = canvas.toDataURL('image/jpeg', 0.8);
             link.click();

          } catch (error) {
              console.error("Erro ao gerar cartão mensal", error);
              alert("Erro ao gerar a imagem do cartão mensal.");
          }
      }
      setCaptureSoldiers([]);
  }

  // New function to download single card properly
  const handleDownloadSingleCard = async (soldier: Military) => {
    setCaptureSoldier(soldier);
    setCaptureSoldiers([]); 
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500));

    if (captureRef.current) {
        try {
            const canvas = await html2canvas(captureRef.current, {
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
                y: 0
            });

            const link = document.createElement('a');
            link.download = `cartao_${soldier.name.replace(/\s+/g, '_')}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.8);
            link.click();
        } catch (error) {
            console.error("Erro ao gerar cartão individual", error);
            alert("Erro ao gerar o cartão.");
        }
    }
    setCaptureSoldier(null);
  };

  const handleSendEmails = async (specificIds?: string[]) => {
    const idsToSend = specificIds ? new Set(specificIds) : selectedSoldierIds;
    if (idsToSend.size === 0) return;

    const targets: Military[] = [];
    idsToSend.forEach(id => {
        const s = soldiers.find(soldier => soldier.id === id);
        if (s) targets.push(s);
    });

    if (targets.length === 0) return;

    setProcessingEmails(true);
    setEmailReport(null); 
    setEmailProgress({ current: 0, total: targets.length });

    // Ensure collective mode is off
    setCaptureSoldiers([]);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < targets.length; i++) {
        const soldier = targets[i];
        let sent = false;
        
        setCaptureSoldier(soldier);
        
        // Wait for React to render the new soldier into the hidden DOM
        await new Promise(resolve => setTimeout(resolve, 400));

        if (captureRef.current) {
            try {
                // Ensure the container has the correct dimensions for A4
                const canvas = await html2canvas(captureRef.current, {
                    scale: 2, // Higher quality for the image source
                    useCORS: true, 
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#F4F1EA',
                    width: 595,  // Exact width of A4 @ 72dpi
                    height: 842, // Exact height of A4 @ 72dpi
                    windowWidth: 1200, // Force desktop view context
                    scrollY: 0,
                    x: 0,
                    y: 0
                });

                // Convert to JPEG with reasonable compression
                const imgData = canvas.toDataURL('image/jpeg', 0.8);
                const emailPrefix = soldier.bmNumber.replace(/\D/g, '');
                const emailAddress = `${emailPrefix}@bombeiros.mg.gov.br`;
                
                const subject = `Feliz Aniversário - ${soldier.rank} ${soldier.name}`;
                
                // IMPORTANT: The cid:birthdayCard reference tells the email client to look
                // in the inlineImages object (which the new Google Script will handle)
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
                
            } catch (err) {
                console.error(`Falha ao processar e-mail para ${soldier.name}`, err);
                sent = false;
            }
        } else {
            sent = false;
        }

        if (sent) successCount++;
        else failureCount++;
        
        setEmailProgress({ current: i + 1, total: targets.length });
    }

    setCaptureSoldier(null);
    setProcessingEmails(false);
    setEmailProgress(null);
    setEmailReport({ success: successCount, failed: failureCount });
    
    if(!specificIds) {
        setSelectedSoldierIds(new Set());
    }
  };

  const handleSendTodayEmails = () => {
    const ids = todaysBirthdays.map(s => s.id);
    handleSendEmails(ids);
  };

  const handleViewCard = (soldier: Military) => {
    setSelectedSoldierIds(new Set([soldier.id]));
    setView(ViewMode.GENERATOR);
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      <header className="flex flex-col md:flex-row justify-between md:items-start mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Painel Operacional</h2>
          <p className="text-gray-500 font-medium">Gestão de efetivo e datas comemorativas</p>
          {/* Toggle Switch removed as requested */}
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200">
           <CalendarIcon className="text-cbmmg-red" size={20} />
           <span className="font-bold text-gray-700 capitalize text-lg">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      {isUsingMockData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r shadow-sm flex items-start gap-4">
            <div className="text-yellow-500 mt-1"><AlertTriangle size={24} /></div>
            <div className="flex-1">
                <h3 className="font-bold text-yellow-800">Modo de Demonstração Ativo</h3>
                <div className="text-yellow-700 text-sm mt-1">
                    <p>O sistema não conseguiu conectar à sua planilha. Verifique os pontos abaixo:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>O ID da planilha no arquivo <code>services/dataService.ts</code> está correto?</li>
                        <li>A planilha está compartilhada como <strong>"Qualquer pessoa com o link pode ler"</strong>?</li>
                        <li>O nome da aba é exatamente <strong>ANIVERSARIANTES</strong>?</li>
                    </ul>
                </div>
            </div>
            <button 
                onClick={loadData} 
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
                Tentar Novamente
            </button>
        </div>
      )}

      {todaysBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-cbmmg-orange/30 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
             <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-cbmmg-orange shadow-md animate-bounce-slow">
                     <Zap size={32} fill="currentColor" />
                 </div>
                 <div>
                     <h3 className="text-xl font-bold text-gray-800">Aniversariantes do Dia Detectados!</h3>
                     <p className="text-gray-600">Existem <strong className="text-cbmmg-red">{todaysBirthdays.length} militares</strong> fazendo aniversário hoje. Deseja iniciar o envio dos cartões?</p>
                 </div>
             </div>
             
             <div className="flex flex-col gap-2 w-full md:w-auto">
                 <button 
                    onClick={handleSendTodayEmails}
                    disabled={processingEmails}
                    className="flex items-center justify-center gap-2 bg-cbmmg-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform transform active:scale-95"
                 >
                    {processingEmails ? <RefreshCw className="animate-spin" /> : <Mail />}
                    Enviar para Todos ({todaysBirthdays.length})
                 </button>
             </div>
          </div>
      )}

      {processingEmails && emailProgress && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                <RefreshCw className="animate-spin text-cbmmg-orange mx-auto mb-4" size={48} />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Enviando E-mails...</h3>
                <p className="text-gray-600 mb-6">Processando cartão {emailProgress.current} de {emailProgress.total}</p>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                        className="bg-cbmmg-orange h-full transition-all duration-300"
                        style={{ width: `${(emailProgress.current / emailProgress.total) * 100}%` }}
                    ></div>
                </div>
                <p className="text-xs text-gray-400 mt-4">Por favor, não feche esta janela.</p>
            </div>
        </div>
      )}

      {emailReport && (
            <div className={`mb-6 border-l-4 p-4 rounded-r shadow-sm flex items-start gap-3 animate-fade-in
                ${emailReport.failed > 0 ? 'bg-red-50 border-red-500 text-red-900' : 'bg-green-50 border-green-500 text-green-900'}
            `}>
                <div className="mt-1">
                    {emailReport.failed > 0 ? <AlertCircle size={24} /> : <Check size={24} />}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-lg">Relatório de Envio</h4>
                    <p className="mt-1">
                        O processo foi finalizado. 
                        {emailReport.success > 0 && <span> <strong className="text-green-700">{emailReport.success} enviados com sucesso.</strong></span>}
                        {emailReport.failed > 0 && <span> <strong className="text-red-700">{emailReport.failed} falharam.</strong></span>}
                    </p>
                    {emailReport.failed > 0 && (
                        <p className="text-sm mt-2 opacity-80">Verifique se a URL do Script Google está correta ou se os e-mails dos militares são válidos.</p>
                    )}
                </div>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setEmailReport(null)}>
                    <X size={20} />
                </button>
            </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-sm border-l-4 border-cbmmg-red flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-xs text-gray-500 uppercase font-black tracking-wider">Aniversariantes Hoje</p>
                <p className="text-5xl font-black text-gray-800 mt-1">{todaysBirthdays.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full text-cbmmg-red flex items-center justify-center"><CalendarIcon size={24} /></div>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-sm border-l-4 border-cbmmg-orange flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-xs text-gray-500 uppercase font-black tracking-wider">Neste Mês</p>
                <p className="text-5xl font-black text-gray-800 mt-1">{monthBirthdaysFiltered.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full text-cbmmg-orange flex items-center justify-center"><Search size={24} /></div>
        </div>
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-sm border-l-4 border-cbmmg-gold flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-xs text-gray-500 uppercase font-black tracking-wider">Total Efetivo</p>
                <p className="text-5xl font-black text-gray-800 mt-1">{soldiers.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full text-cbmmg-gold flex items-center justify-center"><UsersIcon size={24} /></div>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} availableUnits={uniqueUnits} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
        <div className="xl:col-span-4 space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                    <CalendarIcon size={20} className="text-cbmmg-red"/> 
                    Calendário 
                    <span className="capitalize font-normal text-gray-500 text-base">
                        - {selectedDate.toLocaleDateString('pt-BR', { month: 'long' })}
                    </span>
                </h3>
                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                    {['D','S','T','Q','Q','S','S'].map((d,i) => <div key={i} className="font-black text-gray-300 py-2">{d}</div>)}
                    {Array.from({length: 35}, (_, i) => {
                        const day = i - new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() + 1;
                        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                        const isToday = day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth();
                        const isSelected = day === selectedDate.getDate();
                        const hasBirthday = getBirthdaysByDate(soldiers, date).length > 0;
                        
                        if (day <= 0 || day > 31) return <div key={i}></div>;
                        
                        return (
                            <button 
                                key={i} 
                                onClick={() => setSelectedDate(date)}
                                className={`h-10 w-full rounded-md flex flex-col items-center justify-center relative transition-all duration-200
                                    ${isSelected ? 'bg-cbmmg-red text-white shadow-lg scale-105 z-10' : 'hover:bg-red-50 text-gray-600'}
                                    ${isToday && !isSelected ? 'border border-cbmmg-red text-cbmmg-red font-bold' : ''}
                                `}
                            >
                                <span className="font-medium">{day}</span>
                                {hasBirthday && (
                                    <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-cbmmg-orange'}`}></span>
                                )}
                            </button>
                        )
                    })}
                </div>
                <div className="flex justify-between mt-4 px-2">
                    <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))} className="text-gray-400 hover:text-cbmmg-red text-sm font-medium">Anterior</button>
                    <button onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))} className="text-gray-400 hover:text-cbmmg-red text-sm font-medium">Próximo</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Dia {selectedDate.getDate()}</h3>
                <div className="space-y-3">
                    {selectedDateBirthdays.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4 italic">Sem aniversários selecionados.</p>
                    ) : (
                        selectedDateBirthdays.map(s => (
                            <BirthdayListItem key={s.id} soldier={s} minimal onClick={() => handleViewCard(s)} onHover={setHoveredSoldier} />
                        ))
                    )}
                </div>
            </div>
        </div>

        <div className="xl:col-span-8 space-y-8">
            <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-wrap gap-4">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-cbmmg-orange rounded-full"></span>
                        Aniversariantes da Semana
                    </h3>
                    <div className="flex items-center gap-2">
                         <span className="bg-orange-100 text-cbmmg-orange text-xs font-bold px-3 py-1 rounded-full">
                            {weekBirthdaysFiltered.length} militares
                        </span>
                        {weekBirthdaysFiltered.length > 0 && (
                            <button 
                                onClick={handleDownloadWeeklyCard}
                                onMouseEnter={() => setIsHoveringWeeklyBtn(true)}
                                onMouseLeave={() => setIsHoveringWeeklyBtn(false)}
                                className="flex items-center gap-1 bg-cbmmg-orange text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
                                title="Baixar Cartão Coletivo da Semana (Sem enviar e-mail)"
                            >
                                <Download size={16} />
                                Baixar Cartão Semanal
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weekBirthdaysFiltered.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-400">Nenhum militar encontrado nesta semana com os filtros atuais.</div>
                    ) : (
                        weekBirthdaysFiltered.map(s => <BirthdayListItem key={s.id} soldier={s} onClick={() => handleViewCard(s)} onHover={setHoveredSoldier} />)
                    )}
                </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-wrap gap-4">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-cbmmg-red rounded-full"></span>
                        Aniversariantes do Mês ({selectedDate.toLocaleDateString('pt-BR', {month: 'long'})})
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="bg-red-100 text-cbmmg-red text-xs font-bold px-3 py-1 rounded-full">
                            {monthBirthdaysFiltered.length} militares
                        </span>
                        {monthBirthdaysFiltered.length > 0 && (
                            <button 
                                onClick={handleDownloadMonthlyCard}
                                onMouseEnter={() => setIsHoveringMonthlyBtn(true)}
                                onMouseLeave={() => setIsHoveringMonthlyBtn(false)}
                                className="flex items-center gap-1 bg-cbmmg-red text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                                title="Baixar Cartão Coletivo do Mês (Sem enviar e-mail)"
                            >
                                <Download size={16} />
                                Baixar Cartão Mensal
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {monthBirthdaysFiltered.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-400">Nenhum militar encontrado neste mês com os filtros atuais.</div>
                        ) : (
                            monthBirthdaysFiltered.map(s => <BirthdayListItem key={s.id} soldier={s} onClick={() => handleViewCard(s)} onHover={setHoveredSoldier} />)
                        )}
                    </div>
                </div>
            </section>
        </div>
      </div>

      {(hoveredSoldier || ((isHoveringWeeklyBtn && weekBirthdaysFiltered.length > 0) || (isHoveringMonthlyBtn && monthBirthdaysFiltered.length > 0))) && (
         <div className="fixed bottom-6 right-6 z-[100] shadow-2xl rounded-xl overflow-hidden border-4 border-white ring-1 ring-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none hidden md:block">
            <div className="bg-slate-800 text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider flex items-center justify-center gap-2">
                <Eye size={12} />
                {isHoveringWeeklyBtn ? 'Pré-visualização Semanal' : isHoveringMonthlyBtn ? 'Pré-visualização Mensal' : 'Pré-visualização Individual'}
            </div>
            <div className="bg-white" style={{ width: '268px', height: '379px', overflow: 'hidden' }}>
                <div style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '595px', height: '842px' }}>
                    {isHoveringWeeklyBtn ? (
                        <BirthdayCard soldiers={weekBirthdaysFiltered} />
                    ) : isHoveringMonthlyBtn ? (
                         <BirthdayCard soldiers={monthBirthdaysFiltered} />
                    ) : (
                        <BirthdayCard soldier={hoveredSoldier!} />
                    )}
                </div>
            </div>
         </div>
       )}
    </div>
  );

  const renderList = () => (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
            <h2 className="text-3xl font-bold text-gray-800">Lista de Militares</h2>
            <p className="text-gray-500">Gerenciar envios em massa</p>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => handleSendEmails()}
                    disabled={selectedSoldierIds.size === 0 || processingEmails}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-lg transition-all
                        ${processingEmails ? 'bg-gray-400 cursor-wait' : 
                          selectedSoldierIds.size > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                 >
                    {processingEmails ? <RefreshCw className="animate-spin" /> : <Mail />}
                    {processingEmails ? 'Enviando...' : `Enviar E-mail (${selectedSoldierIds.size})`}
                 </button>
            </div>
        </header>

        <FilterBar filters={filters} setFilters={setFilters} availableUnits={uniqueUnits} />

        {processingEmails && emailProgress && (
             <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                    <RefreshCw className="animate-spin" size={18} />
                    <span>Enviando e-mails: {emailProgress.current} de {emailProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width: `${(emailProgress.current / emailProgress.total) * 100}%`}}></div>
                </div>
             </div>
        )}

        {emailReport && (
            <div className={`border-l-4 p-4 rounded-r shadow-sm flex items-start gap-3 animate-fade-in
                ${emailReport.failed > 0 ? 'bg-red-50 border-red-500 text-red-900' : 'bg-green-50 border-green-500 text-green-900'}
            `}>
                <div className="mt-1">
                    {emailReport.failed > 0 ? <AlertCircle size={24} /> : <Check size={24} />}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-lg">Relatório de Envio</h4>
                    <p className="mt-1">
                        O processo foi finalizado. 
                        {emailReport.success > 0 && <span> <strong className="text-green-700">{emailReport.success} enviados com sucesso.</strong></span>}
                        {emailReport.failed > 0 && <span> <strong className="text-red-700">{emailReport.failed} falharam.</strong></span>}
                    </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setEmailReport(null)}>
                    <X size={20} />
                </button>
            </div>
        )}

        {/* REPLACED CONTAINER: Added flex flex-col to parent, overflow-auto to child for scroll */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex-1 border border-gray-200 flex flex-col">
            <div className="overflow-auto flex-1 custom-scrollbar relative">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-12 bg-gray-50">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded text-cbmmg-red focus:ring-cbmmg-red"
                                    checked={filteredSoldiersList.length > 0 && selectedSoldierIds.size === filteredSoldiersList.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="p-4 font-bold text-gray-600 bg-gray-50">Militar</th>
                            <th className="p-4 font-bold text-gray-600 bg-gray-50">Lotação</th>
                            <th className="p-4 font-bold text-gray-600 bg-gray-50">Data Nasc.</th>
                            <th className="p-4 font-bold text-gray-600 bg-gray-50">E-mail</th>
                            <th className="p-4 font-bold text-gray-600 text-center bg-gray-50">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSoldiersList.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum militar encontrado.</td></tr>
                        ) : (
                            filteredSoldiersList.map(soldier => {
                                const isSelected = selectedSoldierIds.has(soldier.id);
                                const isToday = soldier.birthDate.endsWith(getDateForYear(new Date().getMonth()+1, new Date().getDate()).slice(5));
                                const email = `${soldier.bmNumber.replace(/\D/g, '')}@bombeiros.mg.gov.br`;

                                return (
                                    <tr key={soldier.id} className={`hover:bg-red-50 transition-colors ${isSelected ? 'bg-red-50' : ''}`}>
                                        <td className="p-4">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded text-cbmmg-red focus:ring-cbmmg-red"
                                                checked={isSelected}
                                                onChange={() => handleSelectSoldier(soldier.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{soldier.name}</div>
                                            <div className="text-sm text-gray-500">{soldier.rank}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 uppercase tracking-wide">{soldier.unit}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-gray-700">{soldier.birthDate.split('-').reverse().slice(0,2).join('/')}</span>
                                                {isToday && <span className="text-[10px] uppercase font-bold bg-cbmmg-orange text-white px-2 py-0.5 rounded-full animate-pulse">Hoje</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{email}</td>
                                        <td className="p-4 text-center">
                                            <button 
                                                className="text-cbmmg-red hover:text-red-800 text-sm font-bold hover:underline flex items-center gap-1 justify-center w-full"
                                                onClick={() => handleViewCard(soldier)}
                                            >
                                                <Eye size={16} /> Visualizar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  const renderGenerator = () => {
    const targetId = selectedSoldierIds.size > 0 ? Array.from(selectedSoldierIds)[0] : soldiers[0]?.id;
    const targetSoldier = soldiers.find(s => s.id === targetId);

    if (!targetSoldier) return <div className="p-8">Selecione um militar na lista.</div>;

    return (
        <div className="h-full flex flex-col md:flex-row gap-8 animate-fade-in">
            <div className="md:w-1/3 space-y-6">
                 <div>
                    <h2 className="text-3xl font-bold text-gray-800">Gerador de Cartão</h2>
                    <p className="text-gray-500">Visualização e impressão</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border border-gray-200">
                    <h3 className="font-bold border-b pb-2 text-gray-800">Detalhes do Militar</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="col-span-2">
                            <span className="text-gray-500 text-xs uppercase font-bold">Nome Completo</span>
                            <span className="font-bold text-lg block text-gray-900">{targetSoldier.name}</span>
                        </div>
                         <div>
                            <span className="text-gray-500 text-xs uppercase font-bold">Posto/Graduação</span>
                            <span className="font-bold block text-gray-900">{targetSoldier.rank}</span>
                        </div>
                         <div>
                            <span className="text-gray-500 text-xs uppercase font-bold">Unidade (OBM)</span>
                            <span className="font-bold block text-gray-900">{targetSoldier.unit}</span>
                        </div>
                         <div>
                            <span className="text-gray-500 text-xs uppercase font-bold">Aniversário</span>
                            <span className="font-bold block text-gray-900">{targetSoldier.birthDate.split('-').reverse().slice(0,2).join('/')}</span>
                        </div>
                    </div>

                    <div className="pt-6 space-y-3">
                        <button 
                            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white py-3.5 rounded-lg font-bold transition-all hover:shadow-lg"
                            onClick={() => handleDownloadSingleCard(targetSoldier)}
                        >
                            <Download size={18} />
                            Baixar Cartão (Imagem)
                        </button>
                        <button 
                            className="w-full flex items-center justify-center gap-2 bg-cbmmg-red hover:bg-red-700 text-white py-3.5 rounded-lg font-bold transition-all hover:shadow-lg"
                            onClick={() => {
                                setSelectedSoldierIds(new Set([targetSoldier.id]));
                                handleSendEmails();
                            }}
                            disabled={processingEmails}
                        >
                            <Mail size={18} />
                            {processingEmails ? 'Processando...' : 'Enviar por E-mail'}
                        </button>
                    </div>
                </div>

                {/* Report in Generator View */}
                {emailReport && (
                    <div className={`border-l-4 p-4 rounded-r shadow-sm flex items-start gap-3 animate-fade-in
                        ${emailReport.failed > 0 ? 'bg-red-50 border-red-500 text-red-900' : 'bg-green-50 border-green-500 text-green-900'}
                    `}>
                        <div className="mt-1">
                            {emailReport.failed > 0 ? <AlertCircle size={24} /> : <Check size={24} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">Status do Envio</h4>
                            <p className="text-sm mt-1">
                                {emailReport.success > 0 && <span> <strong className="text-green-700">{emailReport.success} enviados com sucesso.</strong></span>}
                                {emailReport.failed > 0 && <span> <strong className="text-red-700">{emailReport.failed} falha(s).</strong></span>}
                            </p>
                        </div>
                         <button className="text-gray-400 hover:text-gray-600" onClick={() => setEmailReport(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="md:w-2/3 bg-slate-200/50 rounded-xl p-8 overflow-auto flex items-start justify-center shadow-inner border border-slate-200">
                <div id="printable-card" className="transform scale-75 origin-top md:scale-90 transition-transform shadow-2xl">
                    <BirthdayCard soldier={targetSoldier} />
                </div>
            </div>
        </div>
    )
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar currentView={view} onChangeView={setView} />
      
      {/* HIDDEN CAPTURE AREA */}
      {/* Used to generate images for emails seamlessly without affecting UI */}
      {/* FIX: Use absolute position with explicit fixed dimensions instead of 'off-screen' only logic to ensure html2canvas captures full size */}
      <div 
          style={{ position: 'absolute', top: 0, left: '-2000px', width: '595px', height: '842px', zIndex: -10, overflow: 'hidden' }} 
          ref={captureRef}
      >
          {/* Conditional rendering for Single vs Collective Card Capture */}
          {captureSoldier && !captureSoldiers.length && (
              <BirthdayCard soldier={captureSoldier} className="bg-[#F4F1EA]" />
          )}
          
          {captureSoldiers.length > 0 && (
               <BirthdayCard soldiers={captureSoldiers} className="bg-[#F4F1EA]" />
          )}
      </div>
      
      <main className="ml-64 flex-1 p-8 h-screen overflow-y-auto custom-scrollbar">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <RefreshCw className="animate-spin mb-4 text-cbmmg-red" size={40} />
                <p className="font-medium animate-pulse">Sincronizando dados...</p>
            </div>
        ) : (
            <>
                {view === ViewMode.DASHBOARD && renderDashboard()}
                {view === ViewMode.LIST && renderList()}
                {view === ViewMode.GENERATOR && renderGenerator()}
            </>
        )}
      </main>
    </div>
  );
};

// Subcomponent for List Items (Same as before)
interface BirthdayListItemProps {
    soldier: Military;
    minimal?: boolean;
    onClick?: () => void;
    onHover?: (s: Military | null) => void;
}

const BirthdayListItem: React.FC<BirthdayListItemProps> = ({ soldier, minimal = false, onClick, onHover }) => {
    // FIX: Using _ to ignore variable usually works, but Typescript in strict mode on Vercel might complain. 
    // Using empty comma skip is safer.
    const [, month, day] = soldier.birthDate.split('-');
    
    return (
        <div 
            onClick={onClick}
            onMouseEnter={() => onHover && onHover(soldier)}
            onMouseLeave={() => onHover && onHover(null)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer group relative
            ${minimal ? 'bg-white border-gray-100' : 'bg-white border-l-4 border-l-cbmmg-red border-y-gray-100 border-r-gray-100'}
        `}>
            <div className={`rounded-lg flex flex-col items-center justify-center font-bold text-xs shrink-0
                ${minimal ? 'w-10 h-10 bg-gray-100 text-gray-600' : 'w-12 h-12 bg-red-50 text-cbmmg-red'}
            `}>
                <span className="text-lg leading-none">{day}</span>
                <span className="text-[9px] uppercase">{new Date(2000, parseInt(month)-1).toLocaleString('pt-BR', {month:'short'}).replace('.','')}</span>
            </div>
            
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate leading-tight group-hover:text-cbmmg-red transition-colors">{soldier.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-white bg-gray-600 px-1.5 py-0.5 rounded">{soldier.rank}</span>
                    <span className="text-xs text-gray-500 truncate">{soldier.unit}</span>
                </div>
            </div>
            {!minimal && <ChevronRight size={16} className="text-gray-300 group-hover:text-cbmmg-red" />}
        </div>
    )
}

const UsersIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

export default App;