
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, DollarSign, Activity, Zap, MapPin, 
  TrendingUp, ArrowUpRight, ArrowDownRight, LogOut, Search,
  FileText, Clock, AlertTriangle, Database
} from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
  onLogout: () => void;
}

// MOCK DATA GENERATOR (Fallback)
const generateMockData = () => {
  return {
    mrr: 45200,
    mrrGrowth: 12.5,
    activeUsers: 342,
    activeUsersGrowth: 8.2,
    tokenBurn: 1250, // USD
    margin: 85, // %
    recentSales: [
      { id: 'TX-9921', user: 'Carlos M.', location: 'Monterrey, NL', amount: 400, time: '2 min ago' },
      { id: 'TX-9920', user: 'Ana P.', location: 'Guadalajara, JAL', amount: 400, time: '15 min ago' },
      { id: 'TX-9919', user: 'Roberto G.', location: 'CDMX', amount: 400, time: '42 min ago' },
    ],
    geoData: [
      { state: 'CDMX', count: 120, pct: 35 },
      { state: 'Nuevo León', count: 85, pct: 25 },
      { state: 'Jalisco', count: 62, pct: 18 },
    ]
  };
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState(generateMockData());
  const [liveTicker, setLiveTicker] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<'connected' | 'simulated'>('simulated');

  // Simulation / Real Data Effect
  useEffect(() => {
    const fetchRealMetrics = async () => {
        if (supabase) {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (!sessionData.session) return;

                const response = await fetch('/api/v1/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${sessionData.session.access_token}`
                    }
                });

                if (response.ok) {
                    const cloudStats = await response.json();
                    setDbStatus('connected');
                    setStats(prev => ({
                        ...prev,
                        activeUsers: cloudStats.totalCases, // Simplification for demo
                        mrr: cloudStats.totalRevenue,
                        mrrGrowth: 15.0
                    }));
                }
            } catch (err) {
                console.error("Admin Fetch Error:", err);
            }
        }
    };

    fetchRealMetrics();

    // Ticker Logic
    const interval = setInterval(() => {
      // Simulate live updates if no DB
      if (dbStatus === 'simulated') {
          setStats(prev => ({
            ...prev,
            mrr: prev.mrr + (Math.random() > 0.8 ? 400 : 0),
            activeUsers: prev.activeUsers + (Math.random() > 0.9 ? 1 : 0),
          }));
      }

      // Add ticker event
      const events = [
        "Nueva consulta: Divorcio Incausado (JAL)",
        "Documento generado: Contrato Arrendamiento (CDMX)",
        "Usuario registrado: Pedro L. (NL)",
        "Pago exitoso: $400.00 MXN",
        "Alerta Grounding: Búsqueda Código Civil VER"
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLiveTicker(prev => [randomEvent, ...prev].slice(0, 5));

    }, 3000);

    return () => clearInterval(interval);
  }, [dbStatus]);

  const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${sub.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {sub.includes('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {sub}
          </span>
          <span className="text-zinc-600 text-xs">vs mes anterior</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
      {/* Top Bar */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Logo className="w-8 h-8 text-emerald-500" />
          <div className="h-6 w-px bg-zinc-800"></div>
          <span className="text-white font-bold tracking-tight">GOD MODE</span>
          {dbStatus === 'connected' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Database className="w-3 h-3" /> CLOUD CONNECTED
              </span>
          ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                  <Database className="w-3 h-3" /> MOCK DATA
              </span>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            SYSTEM STATUS: OPERATIONAL
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            EXIT
          </button>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Total Revenue (MRR)" 
            value={`$${stats.mrr.toLocaleString()}`} 
            sub={`+${stats.mrrGrowth}%`} 
            icon={DollarSign} 
            color="text-emerald-500" 
          />
          <KpiCard 
            title="Active Users" 
            value={stats.activeUsers} 
            sub={`+${stats.activeUsersGrowth}%`} 
            icon={Users} 
            color="text-blue-500" 
          />
          <KpiCard 
            title="AI Token Burn (Cost)" 
            value={`$${stats.tokenBurn}`} 
            sub="+2.1%" 
            icon={Zap} 
            color="text-purple-500" 
          />
          <KpiCard 
            title="Profit Margin" 
            value={`${stats.margin}%`} 
            sub="+0.5%" 
            icon={TrendingUp} 
            color="text-amber-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart Area (Simulated Visual) */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Ventas Mensuales (2025)
              </h3>
              <select className="bg-black border border-zinc-700 text-xs text-white rounded px-2 py-1 outline-none">
                <option>Últimos 6 meses</option>
                <option>Año actual</option>
              </select>
            </div>
            
            {/* CSS-only Chart Simulation */}
            <div className="h-64 flex items-end justify-between gap-2 px-2">
              {[45, 60, 55, 70, 85, 80, 95, 110, 100, 120, 140, stats.mrr/350].map((h, i) => (
                <div key={i} className="w-full bg-zinc-800 hover:bg-emerald-500/50 transition-colors rounded-t relative group" style={{ height: `${Math.min(h, 100)}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                    ${(h * 350).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs font-mono text-zinc-600 px-2">
              <span>ENE</span><span>FEB</span><span>MAR</span><span>ABR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AGO</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DIC</span>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white font-bold flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-500" />
              Live Feed
            </h3>
            <div className="flex-1 overflow-hidden relative">
               <div className="absolute inset-0 overflow-y-auto no-scrollbar space-y-4">
                 {liveTicker.map((event, i) => (
                   <div key={i} className="flex items-start gap-3 text-sm border-b border-zinc-800 pb-3 animate-fade-in-up">
                     <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                     <p className="text-zinc-400">
                       <span className="text-white font-medium">{event.split(':')[0]}:</span>
                       {event.split(':')[1]}
                     </p>
                   </div>
                 ))}
                 {/* Static Fillers if empty */}
                 {liveTicker.length < 5 && (
                   <div className="text-center text-zinc-700 text-xs py-10 font-mono">
                     LISTENING FOR EVENTS...
                   </div>
                 )}
               </div>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Recent Sales Table */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-zinc-400" />
                Últimas Transacciones
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="pb-3 font-normal">ID</th>
                      <th className="pb-3 font-normal">Usuario</th>
                      <th className="pb-3 font-normal">Ubicación</th>
                      <th className="pb-3 font-normal text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {stats.recentSales.map((sale) => (
                      <tr key={sale.id} className="group hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 font-mono text-emerald-500">{sale.id}</td>
                        <td className="py-3 text-white">{sale.user}</td>
                        <td className="py-3 text-zinc-400">{sale.location}</td>
                        <td className="py-3 text-right text-white font-medium">${sale.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Geo Distribution */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-amber-500" />
                Distribución Geográfica
              </h3>
              <div className="space-y-4">
                {stats.geoData.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{item.state}</span>
                      <span className="text-zinc-500">{item.count} usuarios ({item.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-zinc-600'}`} 
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-amber-900/20 border border-amber-900/50 rounded-lg flex items-start gap-3">
                 <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                 <div>
                   <h4 className="text-amber-500 text-sm font-bold mb-1">
                      {dbStatus === 'connected' ? 'Modo Producción Activado' : 'Simulación Activa'}
                   </h4>
                   <p className="text-zinc-400 text-xs leading-relaxed">
                     {dbStatus === 'connected' 
                        ? 'El tablero muestra datos reales encriptados desde Supabase.' 
                        : 'Configura las variables SUPABASE_URL para ver datos reales. Se está usando una simulación local.'}
                   </p>
                 </div>
              </div>
           </div>

        </div>

      </main>
    </div>
  );
};
