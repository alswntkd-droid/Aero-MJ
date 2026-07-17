/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Download, 
  Upload, 
  Settings2,
  ChevronRight,
  FileText,
  BarChart3,
  Factory
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { ProductionData, DowntimeData, CapaVariables, ProcessCapa } from './types';
import { calculateAchievementRate, calculateYield, calculateEffectiveCapa, getParetoData, generateReportDraft } from './utils/calculations';
import { PerformanceChart, ParetoChart } from './components/Charts';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'report'>('dashboard');
  const [prodData, setProdData] = React.useState<ProductionData[]>([]);
  const [downtime, setDowntime] = React.useState<DowntimeData[]>([]);
  const [capaVars, setCapaVars] = React.useState<CapaVariables>({
    workingHours: 480,
    shiftCount: 2,
    breakTime: 60,
    oee: 0.85
  });

  // Mock data generation for initial view
  React.useEffect(() => {
    const mockProd: ProductionData[] = [
      { id: '1', date: '2024-05-20', productCode: 'HA-701', processName: 'Turbine Casting', equipmentId: 'HT-01', plannedQty: 120, inputQty: 125, goodQty: 118, defectQty: 7, achievementRate: 98.3, yieldRate: 94.4 },
      { id: '2', date: '2024-05-20', productCode: 'HA-701', processName: 'Precision Milling', equipmentId: 'HM-02', plannedQty: 118, inputQty: 118, goodQty: 102, defectQty: 16, achievementRate: 86.4, yieldRate: 86.4 },
      { id: '3', date: '2024-05-20', productCode: 'HA-701', processName: 'Heat Treatment', equipmentId: 'HH-03', plannedQty: 102, inputQty: 102, goodQty: 100, defectQty: 2, achievementRate: 98.0, yieldRate: 98.0 },
      { id: '4', date: '2024-05-20', productCode: 'HA-701', processName: 'Final Assembly', equipmentId: 'HA-04', plannedQty: 100, inputQty: 100, goodQty: 99, defectQty: 1, achievementRate: 99.0, yieldRate: 99.0 },
    ];
    const mockDown: DowntimeData[] = [
      { id: '1', date: '2024-05-20', equipmentId: 'HM-02', errorCode: 'C-102', reason: 'Coolant Leakage', durationMinutes: 55 },
      { id: '2', date: '2024-05-20', equipmentId: 'HM-02', errorCode: 'T-404', reason: 'Tool Replacement', durationMinutes: 45 },
      { id: '3', date: '2024-05-20', equipmentId: 'HT-01', errorCode: 'P-501', reason: 'Power Flux', durationMinutes: 20 },
      { id: '4', date: '2024-05-20', equipmentId: 'HH-03', errorCode: 'S-202', reason: 'Safety Interlock', durationMinutes: 15 },
    ];
    setProdData(mockProd);
    setDowntime(mockDown);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'prod' | 'down') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          // In real implementation, validate columns and map to types
          console.log('CSV Parsed:', results.data);
          alert('CSV 데이터가 업로드되었습니다. (MVP에서는 필수 컬럼 매핑이 필요합니다)');
        },
        header: true
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        console.log('Excel Parsed:', data);
        alert('Excel 데이터가 업로드되었습니다.');
      };
      reader.readAsBinaryString(file);
    }
  };

  const avgAchievement = prodData.reduce((acc, d) => acc + d.achievementRate, 0) / (prodData.length || 1);
  const avgYield = prodData.reduce((acc, d) => acc + d.yieldRate, 0) / (prodData.length || 1);
  const totalDowntime = downtime.reduce((acc, d) => acc + d.durationMinutes, 0);
  const paretoData = getParetoData(downtime);

  // Simple Bottleneck Detection based on Yield and Achievement
  const bottlenecks: ProcessCapa[] = prodData
    .filter(p => p.achievementRate < 90)
    .map(p => ({
      processName: p.processName,
      cycleTime: 45, // In a real app, this would be input or loaded
      equipmentCount: 1,
      effectiveCapa: calculateEffectiveCapa(capaVars, 45, 1),
      achievementRate: p.achievementRate
    }));

  const reportDraft = generateReportDraft(prodData, downtime, bottlenecks);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-hanwha-dark border-r border-slate-800 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-hanwha-orange rounded-lg">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-tight text-white leading-none">Hanwha</h1>
            <span className="text-[10px] font-bold text-hanwha-orange uppercase tracking-[0.2em]">Aerospace</span>
          </div>
        </div>

        <nav className="space-y-1 mb-8">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white font-semibold border-l-4 border-hanwha-orange' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 className="w-5 h-5" />
            대시보드
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'report' ? 'bg-white/10 text-white font-semibold border-l-4 border-hanwha-orange' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
            보고서 생성
          </button>
        </nav>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">데이터 관리</h2>
            <div className="px-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-300 block mb-1">실적 데이터 (ERP)</span>
                <div className="relative group">
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'prod')} id="prod-file" />
                  <label htmlFor="prod-file" className="flex items-center justify-center gap-2 w-full py-2 px-4 border-2 border-dashed border-slate-700 rounded-lg text-xs font-medium text-slate-400 cursor-pointer group-hover:border-hanwha-orange group-hover:text-white transition-all">
                    <Upload className="w-4 h-4" />
                    파일 업로드
                  </label>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300 block mb-1">비가동 로그</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'down')} id="down-file" />
                <label htmlFor="down-file" className="flex items-center justify-center gap-2 w-full py-2 px-4 border-2 border-dashed border-slate-700 rounded-lg text-xs font-medium text-slate-400 cursor-pointer hover:border-hanwha-orange hover:text-white transition-all">
                  <Upload className="w-4 h-4" />
                  파일 업로드
                </label>
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Capa 설정</h2>
            <div className="px-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>가동시간 (분)</span>
                  <span>{capaVars.workingHours}m</span>
                </div>
                <input 
                  type="range" min="300" max="600" step="10" 
                  value={capaVars.workingHours}
                  onChange={(e) => setCapaVars({...capaVars, workingHours: parseInt(e.target.value)})}
                  className="w-full accent-hanwha-orange"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>종합효율 (OEE)</span>
                  <span>{(capaVars.oee * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.5" max="1.0" step="0.01" 
                  value={capaVars.oee}
                  onChange={(e) => setCapaVars({...capaVars, oee: parseFloat(e.target.value)})}
                  className="w-full accent-hanwha-orange"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-sm font-medium">Hanwha Aerospace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm font-bold text-hanwha-dark uppercase tracking-tight">{activeTab === 'dashboard' ? 'Smart Factory Analysis' : 'Daily Tech Report'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-hanwha-orange transition-colors">
              <Settings2 className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-hanwha-dark flex items-center justify-center border-2 border-hanwha-orange">
              <span className="text-[10px] font-bold text-white">HA</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative">
          {/* Subtle Hero Background (only for dashboard) */}
          {activeTab === 'dashboard' && (
            <div className="absolute top-0 left-0 w-full h-64 bg-hanwha-dark overflow-hidden -z-10">
              <img 
                src="/src/assets/images/hanwha_aerospace_bg_1784253731569.jpg" 
                className="w-full h-full object-cover opacity-30 grayscale" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50"></div>
            </div>
          )}

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' ? (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 max-w-7xl mx-auto"
                >
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 text-hanwha-orange rounded-lg">
                          <Activity className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${avgAchievement >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {avgAchievement >= 90 ? 'OPTIMAL' : 'CRITICAL'}
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 tracking-tighter">{avgAchievement.toFixed(1)}%</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Prod. Achievement</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 text-hanwha-orange rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 tracking-tighter">{avgYield.toFixed(1)}%</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Average Yield</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 text-hanwha-orange rounded-lg">
                          <Clock className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 tracking-tighter">{totalDowntime}m</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Accum. Downtime</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 text-hanwha-orange rounded-lg">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 tracking-tighter">{bottlenecks.length}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Risk Factors</div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <PerformanceChart data={prodData} />
                    <ParetoChart data={paretoData} />
                  </div>

                  {/* Bottleneck Analysis Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                      <h3 className="font-bold text-slate-800 uppercase tracking-tight">Bottleneck & Capacity Analysis</h3>
                      <button className="text-xs font-bold text-hanwha-orange hover:text-orange-700 transition-colors uppercase tracking-widest">Detail View</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Process Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cycle Time</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Effective Capa</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Achievement</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bottlenecks.length > 0 ? bottlenecks.map((b, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-5 text-sm font-bold text-slate-900">{b.processName}</td>
                              <td className="px-6 py-5 text-sm text-slate-600 font-mono">{b.cycleTime}s</td>
                              <td className="px-6 py-5 text-sm text-slate-600 font-mono">{b.effectiveCapa.toLocaleString()} EA</td>
                              <td className="px-6 py-5 text-sm font-bold text-slate-900">{b.achievementRate.toFixed(1)}%</td>
                              <td className="px-6 py-5">
                                <span className="px-2 py-1 bg-hanwha-orange/10 text-hanwha-orange text-[9px] font-black rounded uppercase tracking-tighter border border-hanwha-orange/20">Critical Point</span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-medium italic">Uploading factory data will initiate bottleneck detection...</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="report"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <FileText className="w-7 h-7 text-hanwha-orange" />
                          Production Tech Report
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-10">Aerospace Division</p>
                      </div>
                      <button 
                        onClick={() => alert('Report has been exported to Excel format.')}
                        className="flex items-center gap-2 bg-hanwha-dark text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95 border-b-4 border-hanwha-orange"
                      >
                        <Download className="w-4 h-4" />
                        Export Excel
                      </button>
                    </div>
                    <textarea 
                      className="w-full h-[500px] p-8 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm text-slate-700 focus:ring-2 focus:ring-hanwha-orange focus:border-transparent outline-none transition-all shadow-inner"
                      value={reportDraft}
                      readOnly
                    />
                    <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Settings2 className="w-5 h-5 text-hanwha-orange" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-900 font-bold">Smart Guide</p>
                        <p className="text-xs text-orange-800/80 font-medium leading-relaxed mt-1">
                          The '[CONFIRMATION REQUIRED]' tags indicate areas where manual field inspection is recommended before final submission.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
