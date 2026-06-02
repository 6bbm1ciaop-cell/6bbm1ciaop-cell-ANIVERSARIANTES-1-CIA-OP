import React from 'react';
import { LayoutDashboard, Users, CreditCard } from 'lucide-react';
import { ViewMode } from '../types';
import { LOGO_CBMMG } from '../types-logos';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Painel Geral', icon: LayoutDashboard },
    { id: ViewMode.LIST, label: 'Lista de Militares', icon: Users },
    { id: ViewMode.GENERATOR, label: 'Gerar Cartões', icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-cbmmg-red text-white flex flex-col shadow-2xl z-20 h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-red-800 bg-red-800">
        <img 
            src={LOGO_CBMMG} 
            alt="Brasão CBMMG" 
            className="w-12 h-12 drop-shadow-md"
        />
        <div>
            {/* Changed from SIS-NIVER to ANIVERSARIANTES, reduced text size slightly to fit */}
            <h1 className="font-bold text-base tracking-tight leading-tight">ANIVERSARIANTES</h1>
            <p className="text-xs text-red-200">1ª Cia Operacional</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 
                ${isActive 
                  ? 'bg-white text-cbmmg-red font-bold shadow-md transform scale-105' 
                  : 'text-red-100 hover:bg-red-700 hover:text-white'
                }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-red-800 bg-red-900 text-xs text-red-200 text-center">
        &copy; {new Date().getFullYear()} CBMMG
      </div>
    </aside>
  );
};

export default Sidebar;