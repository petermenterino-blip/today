import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MOCK_TRANSACTIONS } from '../../constants';

const DATA = [
  { name: 'W1', revenue: 4200 },
  { name: 'W2', revenue: 3800 },
  { name: 'W3', revenue: 5600 },
  { name: 'W4', revenue: 7100 },
  { name: 'W5', revenue: 6400 },
  { name: 'W6', revenue: 8900 },
];

const Financials: React.FC = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(MOCK_TRANSACTIONS);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      XLSX.writeFile(workbook, "Financial_Report.xlsx");
    } catch (e: any) {
      console.error('Excel export failed:', e);
    }
    setIsExporting(false);
    setShowExportMenu(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');
      const doc = new jsPDF();
      doc.text("Financial Report", 14, 15);
      (doc as any).autoTable({
        head: [['ID', 'User Name', 'Amount', 'Date', 'Product', 'Status']],
        body: MOCK_TRANSACTIONS.map(t => [t.id, t.user_name, t.amount, t.date, t.product, t.status]),
      });
      doc.save("Financial_Report.pdf");
    } catch (e: any) {
      console.error('PDF export failed:', e);
    }
    setIsExporting(false);
    setShowExportMenu(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6 px-4 md:px-0 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center justify-center w-12 h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={20} className="text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">Financials.</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Revenue Analytics</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="btn-normal w-full md:w-auto bg-white border border-black/[0.03] shadow-sm hover:border-black/20"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Generating...' : 'Export Reports'}
          </button>
          {showExportMenu && (
            <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-2 w-full md:w-48 bg-white border border-black/[0.05] rounded-3xl shadow-xl z-50 overflow-hidden">
              <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                <FileText size={16} /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Net Revenue', value: '$24.8k', trend: '+18%', up: true, icon: DollarSign },
          { label: 'Avg Session', value: '$240', trend: '+4%', up: true, icon: TrendingUp },
          { label: 'Retention', value: '92%', trend: '-2%', up: false, icon: CreditCard },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-black/[0.03] shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-slate-50 text-black rounded-2xl group-hover:bg-black group-hover:text-white transition-all"><stat.icon size={20} /></div>
              <div className={`text-[10px] font-black ${stat.up ? 'text-emerald-500' : 'text-red-500'} bg-slate-50 px-3 py-1 rounded-full`}>{stat.trend}</div>
            </div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 md:p-14 rounded-[60px] border border-black/[0.03] shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 text-slate-400">Strategic Growth Trajectory</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }} 
                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={4} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Financials;