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
      { id: '1', date: '2024-05-20', productCode: 'P-001', processName: 'Pressing', equipmentId: 'EQ-01', plannedQty: 1000, inputQty: 1050, goodQty: 950, defectQty: 100, achievementRate: 95, yieldRate: 90.4 },
      { id: '2', date: '2024-05-20', productCode: 'P-001', processName: 'Welding', equipmentId: 'EQ-02', plannedQty: 950, inputQty: 950, goodQty: 820, defectQty: 130, achievementRate: 86.3, yieldRate: 86.3 },
      { id: '3', date: '2024-05-20', productCode: 'P-001', processName: 'Painting', equipmentId: 'EQ-03', plannedQty: 820, inputQty: 820, goodQty: 800, defectQty: 20, achievementRate: 97.5, yieldRate: 97.5 },
      { id: '4', date: '2024-05-20', productCode: 'P-001', processName: 'Assembly', equipmentId: 'EQ-04', plannedQty: 800, inputQty: 800, goodQty: 780, defectQty: 20, achievementRate: 97.5, yieldRate: 97.5 },
    ];
    const mockDown: DowntimeData[] = [
      { id: '1', date: '2024-05-20', equipmentId: 'EQ-02', errorCode: 'E-01', reason: 'Sensor Error', durationMinutes: 45 },
      { id: '2', date: '2024-05-20', equipmentId: 'EQ-02', errorCode: 'E-04', reason: 'Material Shortage', durationMinutes: 120 },
      { id: '3', date: '2024-05-20', equipmentId: 'EQ-01', errorCode: 'E-01', reason: 'Sensor Error', durationMinutes: 15 },
      { id: '4', date: '2024-05-20', equipmentId: 'EQ-03', errorCode: 'E-08', reason: 'Cleaning', durationMinutes: 30 },
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
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">PGM Dash<span className="text-blue-600">Pro</span></h1>
        </div>

        <nav className="space-y-1 mb-8">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <BarChart3 className="w-5 h-5" />
            대시보드
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'report' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText className="w-5 h-5" />
            보고서 생성
          </button>
        </nav>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">데이터 관리</h2>
            <div className="px-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 block mb-1">실적 데이터 (ERP)</span>
                <div className="relative group">
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'prod')} id="prod-file" />
                  <label htmlFor="prod-file" className="flex items-center justify-center gap-2 w-full py-2 px-4 border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-500 cursor-pointer group-hover:border-blue-300 group-hover:text-blue-600 transition-all">
                    <Upload className="w-4 h-4" />
                    파일 업로드
                  </label>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 block mb-1">비가동 로그</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'down')} id="down-file" />
                <label htmlFor="down-file" className="flex items-center justify-center gap-2 w-full py-2 px-4 border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-500 cursor-pointer hover:border-blue-300 hover:text-blue-600 transition-all">
                  <Upload className="w-4 h-4" />
                  파일 업로드
                </label>
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Capa 설정</h2>
            <div className="px-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>가동시간 (분)</span>
                  <span>{capaVars.workingHours}m</span>
                </div>
                <input 
                  type="range" min="300" max="600" step="10" 
                  value={capaVars.workingHours}
                  onChange={(e) => setCapaVars({...capaVars, workingHours: parseInt(e.target.value)})}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>종합효율 (OEE)</span>
                  <span>{(capaVars.oee * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.5" max="1.0" step="0.01" 
                  value={capaVars.oee}
                  onChange={(e) => setCapaVars({...capaVars, oee: parseFloat(e.target.value)})}
                  className="w-full accent-blue-600"
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
            <span className="text-sm font-medium">PGM 사업부</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-sm font-semibold text-slate-900">{activeTab === 'dashboard' ? '실적 및 Capa 분석' : '일일 보고서 생성'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings2 className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-600">PG</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
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
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${avgAchievement >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {avgAchievement >= 90 ? '정상' : '주의'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{avgAchievement.toFixed(1)}%</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">평균 생산 달성률</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{avgYield.toFixed(1)}%</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">공정 전체 수율</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{totalDowntime}분</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">총 비가동 시간</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{bottlenecks.length}건</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">병목 의심 공정</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <PerformanceChart data={prodData} />
                  <ParetoChart data={paretoData} />
                </div>

                {/* Bottleneck Analysis Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">병목 후보 및 Capa 분석</h3>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">전체보기</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">공정명</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Cycle Time</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">실효 Capa</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">달성률</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bottlenecks.length > 0 ? bottlenecks.map((b, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{b.processName}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{b.cycleTime}s</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{b.effectiveCapa.toLocaleString()} EA</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{b.achievementRate.toFixed(1)}%</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Bottleneck</span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">데이터를 업로드하면 병목 분석이 시작됩니다.</td>
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
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-blue-600" />
                      개조식 일일 생산보고서 초안
                    </h3>
                    <button 
                      onClick={() => alert('보고서가 엑셀로 다운로드되었습니다.')}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Excel 다운로드
                    </button>
                  </div>
                  <textarea 
                    className="w-full h-[500px] p-6 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={reportDraft}
                    readOnly
                  />
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">
                      💡 팁: '[확인 필요]'로 표시된 항목은 실제 현장 상황을 반영하여 직접 수정해 주세요.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
