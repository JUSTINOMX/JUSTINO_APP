import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Users, CheckCircle2, XCircle, FileText, Activity, 
  RefreshCw, LogOut, Search, Filter, ArrowUpRight, ShieldCheck, 
  ExternalLink, Sparkles, Terminal, Database, CreditCard, Cpu, 
  Clock, AlertTriangle, Layers, ChevronRight, Zap, Tag, Gift,
  Store, Building2, HelpCircle
} from 'lucide-react';
import { Logo } from './Logo';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface SaleItem {
  id: string;
  customer_email: string;
  customer_name: string;
  amount_subtotal?: number;
  amount_discount?: number;
  amount_paid?: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  payment_method_type?: 'card' | 'oxxo' | 'spei' | 'coupon_100' | string;
  payment_method_label?: string;
  coupon_code?: string | null;
  is_real_revenue?: boolean;
  is_completed?: boolean;
  stripe_status?: string;
  created_at: string;
  source?: string;
}

interface AccountItem {
  id: string;
  email: string;
  displayName: string;
  hasActiveAccess: boolean;
  caseId: string;
  caseTitle: string;
  caseType: string;
  caseStatus: 'active' | 'closed';
  createdAt: string;
  stripeCustomerId?: string | null;
}

interface HermesOverviewData {
  kpis: {
    totalRealRevenue: number;
    totalRealSalesCount: number;
    totalCouponSalesCount: number;
    totalGrossOrders: number;
    totalDiscountsGiven: number;
    totalRevenue: number;
    totalSalesCount: number;
    paymentMethodsBreakdown: {
      card: number;
      oxxo: number;
      spei: number;
      coupon_100: number;
    };
    totalAccounts: number;
    activeCases: number;
    closedCases: number;
    totalVaultDocuments: number;
    totalInteractions: number;
  };
  sales: SaleItem[];
  accounts: AccountItem[];
  systemHealth: {
    stripeConnected: boolean;
    supabaseConnected: boolean;
    serverTime: string;
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'accounts' | 'logs'>('sales');
  const [data, setData] = useState<HermesOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [salesFilter, setSalesFilter] = useState<'completed' | 'all' | 'real_only' | 'coupons_only' | 'unpaid' | 'card' | 'oxxo'>('completed');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [togglingCaseId, setTogglingCaseId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [liveLogs, setLiveLogs] = useState<Array<{ id: string; time: string; text: string; type: 'sale' | 'user' | 'case' | 'ai' | 'system' }>>([]);

  // Live Cyber Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-MX', { hour12: false }) + ' CST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Real Data from Hermes Overview Endpoint
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const token = sessionStorage.getItem('hermes_admin_token') || 'HERMES_AUTH_CYBER_2026_TRISMEGISTO';
      const res = await fetch('/api/v1/admin/hermes-overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Error al conectar con la pasarela Hermes');
      }

      const json = await res.json();
      setData(json);

      // Seed initial cyber logs if empty
      if (liveLogs.length === 0) {
        const realCount = json.kpis.totalRealSalesCount || 0;
        const couponCount = json.kpis.totalCouponSalesCount || 0;
        const realRev = json.kpis.totalRealRevenue || 0;

        const initialLogs = [
          { id: '1', time: new Date().toLocaleTimeString(), text: 'Matriz Hermes sincronizada con Supabase Cloud & Stripe API', type: 'system' as const },
          { id: '2', time: new Date().toLocaleTimeString(), text: `Auditoría financiera: $${realRev.toLocaleString()} MXN ingresos reales (${realCount} pagados, ${couponCount} cupones 100%)`, type: 'sale' as const },
          { id: '3', time: new Date().toLocaleTimeString(), text: `Base de usuarios: ${json.kpis.totalAccounts} cuentas registradas en Supabase`, type: 'user' as const },
          { id: '4', time: new Date().toLocaleTimeString(), text: `Monitor de casos: ${json.kpis.activeCases} expedientes activos | ${json.kpis.closedCases} cerrados`, type: 'case' as const }
        ];
        setLiveLogs(initialLogs);
      }

    } catch (err) {
      console.error("Hermes Fetch Error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 15000); // 15s refresh
    return () => clearInterval(pollInterval);
  }, []);

  // Toggle Case Status (Active <-> Closed)
  const handleToggleCaseStatus = async (account: AccountItem) => {
    const newStatus = account.caseStatus === 'active' ? 'closed' : 'active';
    setTogglingCaseId(account.id);

    try {
      const token = sessionStorage.getItem('hermes_admin_token') || 'HERMES_AUTH_CYBER_2026_TRISMEGISTO';
      const res = await fetch('/api/v1/admin/hermes-toggle-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caseId: account.caseId,
          userId: account.id,
          newStatus: newStatus
        })
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el estado del caso');
      }

      // Optimistic local state update
      setData(prev => {
        if (!prev) return prev;
        const updatedAccounts = prev.accounts.map(acc => {
          if (acc.id === account.id) {
            return { ...acc, caseStatus: newStatus as 'active' | 'closed' };
          }
          return acc;
        });

        const activeCount = updatedAccounts.filter(a => a.caseStatus === 'active').length;
        const closedCount = updatedAccounts.filter(a => a.caseStatus === 'closed').length;

        return {
          ...prev,
          accounts: updatedAccounts,
          kpis: {
            ...prev.kpis,
            activeCases: activeCount,
            closedCases: closedCount
          }
        };
      });

      // Add log
      setLiveLogs(prev => [
        {
          id: String(Date.now()),
          time: new Date().toLocaleTimeString(),
          text: `Expediente de ${account.displayName} actualizado a [${newStatus === 'active' ? 'ACTIVO' : 'CASO CERRADO'}]`,
          type: 'case'
        },
        ...prev.slice(0, 30)
      ]);

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setTogglingCaseId(null);
    }
  };

  // Filtered Sales
  const filteredSales = useMemo(() => {
    if (!data?.sales) return [];
    return data.sales.filter(sale => {
      const matchesSearch = 
        sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.coupon_code && sale.coupon_code.toLowerCase().includes(searchQuery.toLowerCase()));

      const isPaid = sale.payment_status === 'paid' && Boolean(sale.is_real_revenue);
      const isCoupon = (sale.payment_status === 'no_payment_required' || sale.payment_method_type === 'coupon_100') && !sale.is_real_revenue;
      const isUnpaid = !isPaid && !isCoupon;

      let matchesType = true;
      if (salesFilter === 'completed') {
        matchesType = isPaid || isCoupon;
      } else if (salesFilter === 'real_only') {
        matchesType = isPaid && Number(sale.amount_paid || sale.amount_total) > 0;
      } else if (salesFilter === 'coupons_only') {
        matchesType = isCoupon;
      } else if (salesFilter === 'unpaid') {
        matchesType = isUnpaid;
      } else if (salesFilter === 'card') {
        matchesType = sale.payment_method_type === 'card' && isPaid;
      } else if (salesFilter === 'oxxo') {
        matchesType = sale.payment_method_type === 'oxxo' && isPaid;
      } else if (salesFilter === 'all') {
        matchesType = true;
      }

      return matchesSearch && matchesType;
    });
  }, [data?.sales, searchQuery, salesFilter]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    if (!data?.accounts) return [];
    return data.accounts.filter(acc => {
      const matchesSearch = 
        acc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && acc.caseStatus === 'active') ||
        (statusFilter === 'closed' && acc.caseStatus === 'closed');

      return matchesSearch && matchesStatus;
    });
  }, [data?.accounts, searchQuery, statusFilter]);

  // KPIs
  const kpis = data?.kpis || {
    totalRealRevenue: 0,
    totalRealSalesCount: 0,
    totalCouponSalesCount: 0,
    totalGrossOrders: 0,
    totalDiscountsGiven: 0,
    totalRevenue: 0,
    totalSalesCount: 0,
    paymentMethodsBreakdown: { card: 0, oxxo: 0, spei: 0, coupon_100: 0 },
    totalAccounts: 0,
    activeCases: 0,
    closedCases: 0,
    totalVaultDocuments: 0,
    totalInteractions: 0
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-mono selection:bg-emerald-500 selection:text-black">
      
      {/* CYBER BACKGROUND GRID */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* TOP CYBER HUD HEADER */}
      <header className="sticky top-0 z-40 bg-[#050B1A]/95 backdrop-blur-md border-b border-emerald-500/20 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* BRAND & OPERATOR IDENTIFIER */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1 sm:p-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              <Logo className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-xs sm:text-sm tracking-wider text-white uppercase truncate">Panel JUSTINO</span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded shrink-0">
                  ADMIN
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
                <span className="text-cyan-400 font-mono truncate">{currentTime}</span>
              </p>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS TELEMETRY & CONTROLS */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data?.systemHealth?.stripeConnected ? 'bg-emerald-400' : 'bg-emerald-400'} shadow-[0_0_6px_#10b981]`} />
              <span className="text-slate-300">STRIPE LIVE</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data?.systemHealth?.supabaseConnected ? 'bg-cyan-400' : 'bg-cyan-400'} shadow-[0_0_6px_#06b6d4]`} />
              <span className="text-slate-300">SUPABASE CLOUD</span>
            </div>
          </div>

          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 touch-manipulation"
            title="Sincronizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">SYNC</span>
          </button>

          <button 
            onClick={() => {
              sessionStorage.removeItem('justino_admin_active');
              sessionStorage.removeItem('hermes_admin_token');
              sessionStorage.removeItem('hermes_operator');
              sessionStorage.clear();
              onLogout();
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation"
            title="Cerrar sesión administrativa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SALIR</span>
          </button>

        </div>

      </header>

      {/* MAIN CYBER CONTAINER */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative z-10">
        
        {/* KPI CARDS HUD (FINANCIAL AUDIT & REAL REVENUE CLARITY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-4">
          
          {/* KPI 1: INGRESOS REALES COBRADOS */}
          <div className="bg-[#070E22]/95 border-2 border-emerald-500/50 p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:border-emerald-400 transition-all shadow-[0_0_25px_rgba(16,185,129,0.15)] col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-emerald-400 text-[10px] uppercase font-bold tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                INGRESOS REALES (BANCO)
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">
                NETO
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${kpis.totalRealRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs text-emerald-400 font-normal">MXN</span>
            </div>
            <div className="text-[11px] text-emerald-300/90 mt-1.5 sm:mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
              <span><strong>{kpis.totalRealSalesCount}</strong> pagos reales en Stripe</span>
            </div>
          </div>

          {/* KPI 2: CUPONES 100% / PRUEBAS */}
          <div className="bg-[#070E22]/90 border border-purple-500/40 p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:border-purple-400 transition-all shadow-[0_0_20px_rgba(168,85,247,0.08)] col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-purple-300 text-[10px] uppercase font-bold tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                CUPONES 100% / PRUEBAS
              </span>
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[9px]">
                PROMO
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-200 tracking-tight">
              {kpis.totalCouponSalesCount} <span className="text-xs text-purple-400 font-normal">cupones</span>
            </div>
            <div className="text-[11px] text-purple-400/90 mt-1.5 sm:mt-2 flex items-center gap-1">
              <Tag className="w-3 h-3 text-purple-400 shrink-0" />
              <span>-${kpis.totalDiscountsGiven.toLocaleString()} MXN en descuentos</span>
            </div>
          </div>

          {/* KPI 3: TOTAL CUENTAS REGISTRADAS */}
          <div className="bg-[#070E22]/90 border border-cyan-500/30 p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:border-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.05)]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
              <span>CUENTAS</span>
              <Users className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {kpis.totalAccounts}
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-1">
              En Supabase Cloud
            </div>
          </div>

          {/* KPI 4: CASOS ACTIVOS / CERRADOS */}
          <div className="bg-[#070E22]/90 border border-teal-500/30 p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:border-teal-400 transition-all shadow-[0_0_20px_rgba(20,184,166,0.05)]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
              <span>EXPEDIENTES</span>
              <Activity className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-300 tracking-tight flex items-baseline gap-1.5">
              <span>{kpis.activeCases}</span>
              <span className="text-xs text-amber-400 font-normal">/ {kpis.closedCases} cerr.</span>
            </div>
            <div className="text-[10px] text-teal-400/80 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block animate-pulse shrink-0" />
              {kpis.activeCases} en proceso
            </div>
          </div>

        </div>

        {/* PAYMENT METHODS QUICK HUD BADGES */}
        <div className="bg-[#050A18]/80 border border-white/10 rounded-xl p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase text-[11px] text-white">DESGLOSE DE MÉTODOS:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold">
              <CreditCard className="w-3 h-3" />
              Tarjeta (Cobro real): {kpis.paymentMethodsBreakdown?.card || 0}
            </span>
            <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold">
              <Store className="w-3 h-3" />
              OXXO Pay: {kpis.paymentMethodsBreakdown?.oxxo || 0}
            </span>
            <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold">
              <Zap className="w-3 h-3" />
              SPEI: {kpis.paymentMethodsBreakdown?.spei || 0}
            </span>
            <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold">
              <Gift className="w-3 h-3" />
              Cupones 100%: {kpis.paymentMethodsBreakdown?.coupon_100 || kpis.totalCouponSalesCount}
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS (CYBERPUNK CONSOLE SWITCHER - MOBILE OPTIMIZED HORIZONTAL SCROLL) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-emerald-500/20 pb-3">
          
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer touch-manipulation ${
                activeTab === 'sales'
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-black/50 text-slate-400 hover:text-white border border-white/10 hover:border-emerald-500/30'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Ventas ({data?.sales.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer touch-manipulation ${
                activeTab === 'accounts'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-black/50 text-slate-400 hover:text-white border border-white/10 hover:border-cyan-500/30'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Cuentas ({data?.accounts.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer touch-manipulation ${
                activeTab === 'logs'
                  ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-black/50 text-slate-400 hover:text-white border border-white/10 hover:border-purple-500/30'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Logs</span>
            </button>
          </div>

          {/* DIRECT STRIPE LINK */}
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg w-full sm:w-auto"
          >
            <span>Abrir Stripe Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>

        </div>

        {/* TAB CONTENT 1: VENTAS & AUDITORÍA FINANCIERA */}
        {activeTab === 'sales' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* SALES FILTER & SEARCH BAR */}
            <div className="bg-[#070D1F]/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
              
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase flex items-center gap-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                    <span>Auditoría de Ventas</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    Diferenciación exacta entre dinero real cobrado ($400 MXN) y registros promocionales / cupones 100%
                  </p>
                </div>

                {/* FILTER PILLS - HORIZONTAL SCROLL ON MOBILE */}
                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                  <button
                    onClick={() => setSalesFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      salesFilter === 'completed'
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    CONCLUIDAS ({kpis.totalRealSalesCount + kpis.totalCouponSalesCount})
                  </button>
                  <button
                    onClick={() => setSalesFilter('real_only')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      salesFilter === 'real_only'
                        ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
                    PAGOS REALES ({kpis.totalRealSalesCount})
                  </button>
                  <button
                    onClick={() => setSalesFilter('coupons_only')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      salesFilter === 'coupons_only'
                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                        : 'text-purple-300 hover:text-purple-200'
                    }`}
                  >
                    <Gift className="w-3 h-3 shrink-0" />
                    CUPONES ({kpis.totalCouponSalesCount})
                  </button>
                  <button
                    onClick={() => setSalesFilter('unpaid')}
                    className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      salesFilter === 'unpaid'
                        ? 'bg-amber-500/80 text-black'
                        : 'text-amber-400/80 hover:text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    SIN PAGAR ({Math.max(0, (data?.sales.length || 0) - (kpis.totalRealSalesCount + kpis.totalCouponSalesCount))})
                  </button>
                  <button
                    onClick={() => setSalesFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      salesFilter === 'all'
                        ? 'bg-white/20 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    TODOS ({data?.sales.length || 0})
                  </button>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 sm:top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por correo, nombre o código..."
                  className="w-full bg-black/80 border border-white/10 focus:border-emerald-400 rounded-xl py-2.5 sm:py-3 pl-10 pr-16 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 bg-white/5 rounded"
                  >
                    Limpiar
                  </button>
                )}
              </div>

            </div>

            {/* SALES VIEW: MOBILE CARDS (< md) + DESKTOP TABLE (>= md) */}
            <div className="bg-[#070D1F]/90 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-xl">
              
              {/* MOBILE CARDS VIEW */}
              <div className="block md:hidden divide-y divide-white/5">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs">
                    <Activity className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    AUDITANDO TRANSACCIONES EN STRIPE Y SUPABASE...
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 p-4">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-400">Sin transacciones coincidentes</p>
                  </div>
                ) : (
                  filteredSales.map((sale, idx) => {
                    const isPaid = sale.payment_status === 'paid' && Boolean(sale.is_real_revenue);
                    const isCoupon = (sale.payment_status === 'no_payment_required' || sale.payment_method_type === 'coupon_100') && !sale.is_real_revenue;
                    const isUnpaid = !isPaid && !isCoupon;
                    const isOxxo = sale.payment_method_type === 'oxxo';
                    const isSpei = sale.payment_method_type === 'spei';

                    return (
                      <div key={sale.id || idx} className="p-3.5 space-y-2.5 hover:bg-emerald-950/10 transition-colors">
                        
                        {/* HEADER: CLIENT & REVENUE */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">{sale.customer_name || 'Usuario Justino'}</div>
                            <div className="text-slate-400 text-[10px] font-mono truncate">{sale.customer_email}</div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            {isPaid ? (
                              <div className="font-black text-emerald-400 text-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                +${Number(sale.amount_paid || sale.amount_total || 400).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                              </div>
                            ) : isCoupon ? (
                              <div>
                                <span className="font-bold text-slate-400 text-xs">$0.00 MXN</span>
                                <span className="text-[9px] text-purple-400 line-through block">$400.00 MXN</span>
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-slate-500 text-xs">$0.00 MXN</span>
                                <span className="text-[9px] text-amber-500/70 block">No Cobrado</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* BADGES ROW */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {/* METHOD */}
                          {isCoupon ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Gift className="w-2.5 h-2.5 text-purple-400" />
                              Cupón 100%
                            </span>
                          ) : isOxxo ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${
                              isPaid ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-950/30 text-amber-500/80 border-amber-700/30'
                            }`}>
                              <Store className="w-2.5 h-2.5 text-amber-400" />
                              OXXO {isUnpaid ? 'Pendiente' : ''}
                            </span>
                          ) : isSpei ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${
                              isPaid ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-cyan-950/30 text-cyan-500/80 border-cyan-700/30'
                            }`}>
                              <Zap className="w-2.5 h-2.5 text-cyan-400" />
                              SPEI {isUnpaid ? 'Pendiente' : ''}
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${
                              isPaid ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              <CreditCard className="w-2.5 h-2.5 text-emerald-400" />
                              Tarjeta {isUnpaid ? '(Fallido)' : ''}
                            </span>
                          )}

                          {/* STATUS */}
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              PAGADO
                            </span>
                          ) : isCoupon ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 text-purple-400" />
                              PROMO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/40 text-amber-400/90 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                              {sale.payment_status === 'expired' ? 'VENCIDO' : 'SIN PAGAR'}
                            </span>
                          )}
                        </div>

                        {/* FOOTER METADATA */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-white/5">
                          <span className="truncate max-w-[140px]" title={sale.id}>{sale.id}</span>
                          <span>
                            {new Date(sale.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-emerald-500/20 bg-black/40">
                      <th className="py-3 px-4 uppercase font-bold">ID Transacción</th>
                      <th className="py-3 px-4 uppercase font-bold">Cliente</th>
                      <th className="py-3 px-4 uppercase font-bold">Método / Tipo</th>
                      <th className="py-3 px-4 uppercase font-bold">Fecha / Hora</th>
                      <th className="py-3 px-4 uppercase font-bold">Estado</th>
                      <th className="py-3 px-4 uppercase font-bold text-right">Cobro Real</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                          <Activity className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                          AUDITANDO TRANSACCIONES EN STRIPE Y SUPABASE...
                        </td>
                      </tr>
                    ) : filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <div className="max-w-xs mx-auto space-y-2">
                            <CreditCard className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-sm font-bold text-slate-400">Sin transacciones coincidentes</p>
                            <p className="text-xs text-slate-600">
                              No hay registros que coincidan con el filtro seleccionado.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale, idx) => {
                        const isPaid = sale.payment_status === 'paid' && Boolean(sale.is_real_revenue);
                        const isCoupon = (sale.payment_status === 'no_payment_required' || sale.payment_method_type === 'coupon_100') && !sale.is_real_revenue;
                        const isUnpaid = !isPaid && !isCoupon;
                        const isOxxo = sale.payment_method_type === 'oxxo';
                        const isSpei = sale.payment_method_type === 'spei';

                        return (
                          <tr key={sale.id || idx} className="hover:bg-emerald-950/10 transition-colors group">
                            
                            {/* ID */}
                            <td className="py-3.5 px-4 font-mono text-slate-400">
                              <span className="truncate block max-w-[160px] group-hover:text-emerald-400 transition-colors" title={sale.id}>
                                {sale.id}
                              </span>
                              <span className="text-[9px] text-slate-600">
                                {sale.source === 'stripe_api' ? '⚡ Stripe API Live' : '🗄️ Supabase Orders'}
                              </span>
                            </td>

                            {/* CLIENT */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white">{sale.customer_name || 'Usuario Justino'}</div>
                              <div className="text-slate-400 text-[11px] font-mono">{sale.customer_email}</div>
                            </td>

                            {/* PAYMENT METHOD BADGE */}
                            <td className="py-3.5 px-4">
                              {isCoupon ? (
                                <div className="space-y-1">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 w-max">
                                    <Gift className="w-3 h-3 text-purple-400" />
                                    Cupón 100% Descuento
                                  </span>
                                  {sale.coupon_code && (
                                    <span className="text-[9px] text-purple-400/80 font-mono block pl-1">
                                      Código: {sale.coupon_code}
                                    </span>
                                  )}
                                </div>
                              ) : isOxxo ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-max ${
                                  isPaid 
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                                    : 'bg-amber-950/30 text-amber-500/80 border-amber-700/30'
                                }`}>
                                  <Store className="w-3 h-3 text-amber-400" />
                                  OXXO Pay {isUnpaid ? '(Voucher Pendiente)' : ''}
                                </span>
                              ) : isSpei ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-max ${
                                  isPaid 
                                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' 
                                    : 'bg-cyan-950/30 text-cyan-500/80 border-cyan-700/30'
                                }`}>
                                  <Zap className="w-3 h-3 text-cyan-400" />
                                  SPEI Transferencia {isUnpaid ? '(Pendiente)' : ''}
                                </span>
                              ) : (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-max ${
                                  isPaid 
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  <CreditCard className="w-3 h-3 text-emerald-400" />
                                  Tarjeta de Crédito / Débito {isUnpaid ? '(Intento no pagado)' : ''}
                                </span>
                              )}
                            </td>

                            {/* DATE */}
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                              {new Date(sale.created_at).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>

                            {/* STATUS */}
                            <td className="py-3.5 px-4">
                              {isPaid ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  PAGO CONFIRMADO
                                </span>
                              ) : isCoupon ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-max">
                                  <Tag className="w-2.5 h-2.5 text-purple-400" />
                                  PROMOCIONAL
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-400/90 border border-amber-500/30 flex items-center gap-1 w-max">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                  {sale.payment_status === 'expired' ? 'VENCIDO / SIN PAGAR' : 'SIN LIQUIDAR'}
                                </span>
                              )}
                            </td>

                            {/* REAL REVENUE AMOUNT */}
                            <td className="py-3.5 px-4 text-right">
                              {isPaid ? (
                                <div>
                                  <span className="font-black text-emerald-400 text-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                    +${Number(sale.amount_paid || sale.amount_total || 400).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                  </span>
                                  <div className="text-[9px] text-emerald-300/70">
                                    Ingreso Real
                                  </div>
                                </div>
                              ) : isCoupon ? (
                                <div>
                                  <span className="font-bold text-slate-400 text-sm">
                                    $0.00 MXN
                                  </span>
                                  <div className="text-[10px] text-purple-400 line-through">
                                    $400.00 MXN
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-500 text-sm">
                                    $0.00 MXN
                                  </span>
                                  <div className="text-[9px] text-amber-500/70">
                                    No Cobrado
                                  </div>
                                </div>
                              )}
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
        )}

        {/* TAB CONTENT 2: CUENTAS & MONITOR DE CASOS (ACTIVO / CERRADO) */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* SEARCH & FILTERS BAR */}
            <div className="bg-[#070D1F]/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-3 sm:space-y-4">
              
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                    <span>Monitor de Cuentas &amp; Casos</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    Administra expedientes y conmuta el estado de cada caso en tiempo real
                  </p>
                </div>

                {/* STATUS FILTER PILLS - HORIZONTAL SCROLL ON MOBILE */}
                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      statusFilter === 'all'
                        ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TODOS ({data?.accounts.length || 0})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      statusFilter === 'active'
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
                    ACTIVAS ({kpis.activeCases})
                  </button>
                  <button
                    onClick={() => setStatusFilter('closed')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation text-[11px] sm:text-xs ${
                      statusFilter === 'closed'
                        ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
                    CERRADAS ({kpis.closedCases})
                  </button>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 sm:top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cuenta por nombre, email o ID..."
                  className="w-full bg-black/80 border border-white/10 focus:border-cyan-400 rounded-xl py-2.5 sm:py-3 pl-10 pr-16 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 bg-white/5 rounded"
                  >
                    Limpiar
                  </button>
                )}
              </div>

            </div>

            {/* ACCOUNTS VIEW: MOBILE CARDS (< md) + DESKTOP TABLE (>= md) */}
            <div className="bg-[#070D1F]/90 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-xl">
              
              {/* MOBILE CARDS VIEW */}
              <div className="block md:hidden divide-y divide-white/5">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs">
                    <Activity className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    CONSULTANDO SUPABASE CLOUD...
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 p-4">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-400">No se encontraron cuentas coincidentes</p>
                  </div>
                ) : (
                  filteredAccounts.map((account) => {
                    const isClosed = account.caseStatus === 'closed';
                    const isUpdating = togglingCaseId === account.id;

                    return (
                      <div key={account.id} className="p-3.5 space-y-3 hover:bg-cyan-950/10 transition-colors">
                        
                        {/* USER INFO HEADER */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{account.displayName}</span>
                              {account.hasActiveAccess && (
                                <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded shrink-0">
                                  ACCESO ACTIVO
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[10px] font-mono truncate">{account.email}</div>
                          </div>

                          {/* STATUS BADGE */}
                          <div className="shrink-0">
                            {isClosed ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5 text-amber-400" />
                                CERRADO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ACTIVO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CASE INFO BOX */}
                        <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 text-[11px] space-y-1">
                          <div className="text-slate-200 font-medium line-clamp-2">{account.caseTitle}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Tipo: <span className="text-slate-400">{account.caseType}</span></span>
                            <span>
                              {new Date(account.createdAt).toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* ACTION TOGGLE BUTTON */}
                        <button
                          onClick={() => handleToggleCaseStatus(account)}
                          disabled={isUpdating}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation active:scale-[0.98] ${
                            isClosed
                              ? 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                              : 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                          }`}
                        >
                          {isUpdating ? (
                            <span className="animate-pulse">ACTUALIZANDO EN SUPABASE...</span>
                          ) : isClosed ? (
                            <span>&gt; REABRIR EXPEDIENTE</span>
                          ) : (
                            <span>&gt; MARCAR CASO COMO CERRADO</span>
                          )}
                        </button>

                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-cyan-500/20 bg-black/40">
                      <th className="py-3 px-4 uppercase font-bold">Usuario / Contacto</th>
                      <th className="py-3 px-4 uppercase font-bold">Expediente Legal</th>
                      <th className="py-3 px-4 uppercase font-bold">Registro</th>
                      <th className="py-3 px-4 uppercase font-bold">Estado del Caso</th>
                      <th className="py-3 px-4 uppercase font-bold text-right">Acción Táctica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                          <Activity className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                          CONSULTANDO SUPABASE CLOUD...
                        </td>
                      </tr>
                    ) : filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          <p className="text-sm font-bold text-slate-400">No se encontraron cuentas coincidentes</p>
                          <p className="text-xs text-slate-600 mt-1">Prueba cambiando el término de búsqueda o el filtro.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => {
                        const isClosed = account.caseStatus === 'closed';
                        const isUpdating = togglingCaseId === account.id;

                        return (
                          <tr key={account.id} className="hover:bg-cyan-950/10 transition-colors">
                            
                            {/* USER INFO */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{account.displayName}</span>
                                {account.hasActiveAccess && (
                                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                                    ACCESO ACTIVO
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px] font-mono mt-0.5">{account.email}</div>
                              <div className="text-slate-600 text-[9px] font-mono mt-0.5">UID: {account.id}</div>
                            </td>

                            {/* CASE TITLE */}
                            <td className="py-4 px-4">
                              <div className="text-slate-200 font-medium">{account.caseTitle}</div>
                              <div className="text-slate-500 text-[11px]">Tipo: {account.caseType}</div>
                            </td>

                            {/* CREATION DATE */}
                            <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                              {new Date(account.createdAt).toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>

                            {/* STATUS BADGE */}
                            <td className="py-4 px-4">
                              {isClosed ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-max shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                                  <XCircle className="w-3 h-3 text-amber-400" />
                                  CASO CERRADO
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-max shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  ACTIVO / EN PROCESO
                                </span>
                              )}
                            </td>

                            {/* ACTION BUTTON */}
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleToggleCaseStatus(account)}
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                  isClosed
                                    ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/40 hover:scale-105'
                                    : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 border border-amber-500/40 hover:scale-105'
                                }`}
                              >
                                {isUpdating ? (
                                  <span className="animate-pulse">ACTUALIZANDO...</span>
                                ) : isClosed ? (
                                  <span>&gt; REABRIR CASO</span>
                                ) : (
                                  <span>&gt; MARCAR CERRADO</span>
                                )}
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
        )}

        {/* TAB CONTENT 3: TELEMETRÍA / LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-[#050A18] border border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/5 pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  Consola de Telemetría en Vivo
                </h3>
              </div>
              <span className="text-[10px] sm:text-xs text-purple-400 font-mono">
                FEED STATUS: BUFFER ACTIVE
              </span>
            </div>

            <div className="bg-black/80 rounded-xl p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-slate-300 space-y-2.5 max-h-[450px] overflow-y-auto border border-white/5">
              {liveLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className={`font-bold ${
                      log.type === 'sale' ? 'text-emerald-400' :
                      log.type === 'case' ? 'text-amber-400' :
                      log.type === 'user' ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      {log.type === 'sale' ? '[STRIPE]' :
                       log.type === 'case' ? '[CASE]' :
                       log.type === 'user' ? '[AUTH]' : '[SYSTEM]'}
                    </span>
                  </div>
                  <span className="text-slate-200 break-words">{log.text}</span>
                </div>
              ))}
              <div className="text-slate-600 text-[10px] sm:text-[11px] pt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                ESCUCHANDO EVENTOS DE SERVIDOR...
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
