
import React, { useState, useEffect } from 'react';
import { MessageSquare, Folder, Map, Bell, Menu, X, BookOpen, Scale, LogOut } from 'lucide-react';
import { User, Message, CaseStatus, DashboardTab, VaultFile } from '../types';
import { ChatInterface } from './ChatInterface';
import { Vault } from './Vault';
import { CaseTimeline } from './CaseTimeline';
import { CaseHistory } from './CaseHistory';
import { LegalFramework } from './LegalFramework';
import { Logo } from './Logo';

interface DashboardProps {
  user: User;
  messages: Message[];
  vaultFiles: VaultFile[];
  onNewMessage: (msg: Message) => void;
  onAddFile: (name: string, type: string, content: string, origin?: 'generated' | 'uploaded') => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  messages, 
  vaultFiles, 
  onNewMessage, 
  onAddFile, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('chat');
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('analyzing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Derive realistic status from actual progress if not explicitly closed
  useEffect(() => {
    const savedStatus = localStorage.getItem('justino_status') as CaseStatus | null;
    if (savedStatus === 'closed') {
      setCaseStatus('closed');
      return;
    }

    const hasUserSpoken = messages.some(m => m.sender === 'user');
    const hasGeneratedDocs = vaultFiles.some(f => f.origin === 'generated');

    if (hasGeneratedDocs) {
      setCaseStatus('ready');
    } else if (hasUserSpoken) {
      setCaseStatus('in_process');
    } else {
      setCaseStatus('analyzing');
    }
  }, [messages, vaultFiles]);

  const handleCaseClosed = () => {
    setCaseStatus('closed');
    localStorage.setItem('justino_status', 'closed');
  };

  const handleDataWipe = () => {
    localStorage.clear();
    window.location.reload();
  };

  const renderStatusBadge = () => {
    switch(caseStatus) {
      case 'analyzing':
        return <span className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> ANALIZANDO</span>;
      case 'in_process':
        return <span className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-blue-500"></span> EN PROCESO</span>;
      case 'ready':
        return <span className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> LISTO</span>;
      case 'closed':
        return <span className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-slate-500"></span> CERRADO</span>;
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: DashboardTab; icon: any; label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-navy-800 hover:text-white'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      <aside className={`
        fixed inset-0 z-40 bg-navy-900 text-white md:relative md:w-64 md:flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex justify-between items-center md:block">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-emerald-500" />
            <span className="font-bold text-xl tracking-tight">Justino</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem id="chat" icon={MessageSquare} label="Sala de Chat" />
          <NavItem id="history" icon={BookOpen} label="Historia del Caso" />
          <NavItem id="timeline" icon={Map} label="Mi Ruta Legal" />
          <NavItem id="vault" icon={Folder} label="Mi Bóveda" />
          <div className="pt-4 mt-4 border-t border-navy-800">
            <NavItem id="legal" icon={Scale} label="Marco Legal" />
          </div>
        </nav>

        <div className="p-4 border-t border-navy-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-white font-black text-sm shrink-0">
              {(user.preferredName || user.username || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user.preferredName || user.username || user.email.split('@')[0]}
              </p>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                @{user.username || user.email.split('@')[0]} · Expediente
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-white hover:bg-red-500/20 active:bg-red-500/30 rounded-xl transition-all border border-red-500/20 hover:border-red-500/50 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <header className="sticky top-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-navy-900">
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2 md:hidden">
              <Logo className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-lg tracking-tight text-navy-900">Justino</span>
            </div>

            <h2 className="text-lg font-bold text-navy-900 hidden md:block">
              {activeTab === 'chat' && 'Asesoría en Vivo'}
              {activeTab === 'history' && 'Memoria y Cierre'}
              {activeTab === 'vault' && 'Documentos Seguros'}
              {activeTab === 'timeline' && 'Progreso del Caso'}
              {activeTab === 'legal' && 'Bases Legales'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {renderStatusBadge()}
            <button className="relative p-2 text-slate-400 hover:text-navy-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatInterface 
              user={user} 
              messages={messages} 
              onNewMessage={onNewMessage} 
              onAddFile={onAddFile} 
            />
          )}
          {activeTab === 'history' && (
            <CaseHistory 
              messages={messages} 
              caseStatus={caseStatus} 
              onCloseCase={handleCaseClosed}
              onWipeData={handleDataWipe}
            />
          )}
          {activeTab === 'vault' && (
            <Vault files={vaultFiles} />
          )}
          {activeTab === 'timeline' && (
            <CaseTimeline 
              status={caseStatus} 
              user={user} 
              messages={messages} 
              vaultFiles={vaultFiles} 
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'legal' && <LegalFramework />}
        </div>
      </main>
    </div>
  );
};
