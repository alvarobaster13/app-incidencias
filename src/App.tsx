/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MapPin, 
  Zap, 
  BarChart3, 
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Info,
  LayoutDashboard,
  Settings,
  History,
  Download,
  FileJson,
  FileDown,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Incident, IncidentType, DailyReport } from './types';
import { generateDailySummary } from './lib/gemini';

const ZONES = ['Barcelona Centro', 'Madrid Norte', 'Valencia Playa', 'Sevilla Casco Antiguo', 'Bilbao Puerto'];
const INCIDENT_TYPES: IncidentType[] = ['DELAYED_ORDER', 'FAILED_DELIVERY', 'CLAIM', 'SYSTEM_ERROR'];

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Simulation of real-time incidents
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newIncident: Incident = {
        id: Math.random().toString(36).substr(2, 9),
        type: INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)],
        zone: ZONES[Math.floor(Math.random() * ZONES.length)],
        description: `Incidencia detectada automáticamente.`,
        timestamp: Date.now(),
        status: 'PENDING',
        severity: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.3 ? 'MEDIUM' : 'LOW',
      };
      setIncidents(prev => [newIncident, ...prev].slice(0, 50));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const summary = await generateDailySummary(incidents);
    
    const incidentsByZone = incidents.reduce((acc, curr) => {
      acc[curr.zone] = (acc[curr.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setDailyReport({
      date: new Date().toLocaleDateString(),
      totalIncidents: incidents.length,
      incidentsByZone,
      summary,
      generatedAt: Date.now(),
    });
    setIsGeneratingReport(false);
  };

  const downloadJSON = () => {
    if (!dailyReport) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dailyReport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `reporte_incidencias_${dailyReport.date.replace(/\//g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadPDF = () => {
    if (!dailyReport) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(0, 160, 130); // Brand Green
    doc.text("Incidencias: Informe Diario", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(29, 29, 29); // Ink
    doc.text(`Fecha: ${dailyReport.date}`, 20, 35);
    doc.text(`Total Incidencias: ${dailyReport.totalIncidents}`, 20, 42);
    
    doc.setFontSize(14);
    doc.text("Resumen Inteligente:", 20, 55);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(dailyReport.summary, 170);
    doc.text(splitSummary, 20, 62);
    
    let yPos = 62 + (splitSummary.length * 5) + 10;
    doc.setFontSize(14);
    doc.text("Desglose por Zonas:", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    Object.entries(dailyReport.incidentsByZone).forEach(([zone, count]) => {
      doc.text(`${zone}: ${count} incidencias`, 20, yPos);
      yPos += 7;
    });
    
    doc.save(`reporte_incidencias_${dailyReport.date.replace(/\//g, '-')}.pdf`);
  };

  const incidentsByZone = useMemo(() => {
    return incidents.reduce((acc, curr) => {
      acc[curr.zone] = (acc[curr.zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [incidents]);

  return (
    <div className="flex min-h-screen bg-bg-gray relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-60 bg-white border-r border-border-gray flex flex-col p-6 shrink-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-10">
          <div className="text-2xl font-extrabold text-brand-green tracking-tighter">
            Incidencias
          </div>
          <button className="md:hidden p-1" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex flex-col gap-1">
          <div className="nav-item nav-item-active">
            <LayoutDashboard size={18} />
            <span>Dashboard Central</span>
          </div>
          <div className="nav-item">
            <Zap size={18} />
            <span>Incidencias "Hot"</span>
          </div>
          <div className="nav-item">
            <History size={18} />
            <span>Reportes Diarios</span>
          </div>
          <div className="nav-item">
            <Settings size={18} />
            <span>Configuración</span>
          </div>
        </nav>

        <div className="mt-auto pt-6 text-[11px] text-gray-400 font-mono">
          v4.2.0-STABLE
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto w-full">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 bg-white border border-border-gray rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg md:text-2xl font-bold tracking-tight line-clamp-1">Operaciones: Automatización</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="status-badge flex items-center gap-1 md:gap-2 whitespace-nowrap">
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-brand-green animate-pulse' : 'bg-red-500'}`} />
              <span className="hidden sm:inline italic">SISTEMA</span> ACTIVO
            </div>
            <button 
              onClick={() => setIsLive(!isLive)}
              className="p-2 bg-white border border-border-gray rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw size={18} className={`${isLive ? 'animate-spin-slow' : ''}`} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Hot Flow Card */}
          <div className="card flex flex-col h-[400px] md:h-[450px]">
            <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 border-b border-bg-gray">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-ink-light">A) Flujo en Caliente</span>
              <span className="text-[10px] md:text-[11px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">EVENT-BASED</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {incidents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2 text-center">
                    <Zap size={40} />
                    <p className="text-sm font-medium">Esperando incidencias...</p>
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center py-3 border-b border-gray-50 last:border-0 group"
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 md:mr-4 shrink-0 ${
                        incident.severity === 'HIGH' ? 'bg-risk-high' : 
                        incident.severity === 'MEDIUM' ? 'bg-risk-med' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] md:text-[13px] font-semibold truncate">{incident.type.replace('_', ' ')} #{incident.id.slice(0, 4)}</div>
                        <div className="text-[11px] md:text-[12px] text-ink-light flex items-center gap-1">
                          <MapPin size={10} /> <span className="truncate">{incident.zone}</span> • {new Date(incident.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="hidden sm:block text-[11px] font-bold text-gray-300 group-hover:text-ink-light transition-colors">WEBHOOK</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cold Flow Card */}
          <div className="card flex flex-col h-auto xl:h-[450px]">
            <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 border-b border-bg-gray">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-ink-light">B) Resumen Diario Consolidado</span>
              <span className="text-[10px] md:text-[11px] font-bold px-2 py-1 bg-[#E8F7F3] text-brand-green rounded">CRON JOB (00:00)</span>
            </div>

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                {ZONES.map(zone => {
                  const count = incidentsByZone[zone] || 0;
                  const counts = Object.values(incidentsByZone) as number[];
                  const maxCount = Math.max(...counts, 1);
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={zone} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate">{zone}</span>
                        <span className="text-ink-light text-right shrink-0 ml-2">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full bg-brand-green"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-bg-gray flex flex-col gap-3">
                <button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || incidents.length === 0}
                  className="w-full py-3 bg-brand-yellow text-ink font-bold text-xs uppercase tracking-widest rounded-lg hover:brightness-95 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {isGeneratingReport ? <RefreshCw className="animate-spin" size={16} /> : <FileText size={16} />}
                  Generar Informe Inteligente
                </button>

                {dailyReport && (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={downloadJSON}
                      className="py-2 px-2 md:px-4 bg-white border border-border-gray text-ink font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-1 md:gap-2 shadow-sm"
                    >
                      <FileJson size={14} />
                      JSON
                    </button>
                    <button 
                      onClick={downloadPDF}
                      className="py-2 px-2 md:px-4 bg-white border border-border-gray text-ink font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-1 md:gap-2 shadow-sm"
                    >
                      <FileDown size={14} />
                      PDF
                    </button>
                  </div>
                )}
              </div>

              {dailyReport && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 md:p-4 bg-gray-50 rounded-lg border border-border-gray text-[11px] md:text-xs leading-relaxed italic text-ink-light"
                >
                  "{dailyReport.summary}"
                </motion.div>
              )}
            </div>
          </div>

          {/* Decision Matrix Card */}
          <div className="card xl:col-span-2 overflow-hidden">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-bg-gray">
              <span className="text-sm font-bold uppercase tracking-wider text-ink-light">Matriz de Decisión y Gestión de Riesgos</span>
            </div>
            
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left text-[13px] min-w-[600px]">
                <thead>
                  <tr className="text-ink-light border-b-2 border-bg-gray">
                    <th className="pb-3 font-semibold">Flujo</th>
                    <th className="pb-3 font-semibold">Disparador</th>
                    <th className="pb-3 font-semibold">Lógica Operativa</th>
                    <th className="pb-3 font-semibold">Riesgo Principal</th>
                    <th className="pb-3 font-semibold">Nivel de Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-gray">
                  <tr>
                    <td className="py-4 font-bold">Incidencias "Hot"</td>
                    <td className="py-4">Webhook (Evento)</td>
                    <td className="py-4">Push inmediato a Slack/Ops Center</td>
                    <td className="py-4">Saturación de API en horas punta</td>
                    <td className="py-4"><span className="risk-pill bg-risk-high">ALTO</span></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold">Reporte Diario</td>
                    <td className="py-4">Cron (00:00 UTC)</td>
                    <td className="py-4">Agregación SQL y envío Email/PDF</td>
                    <td className="py-4">Latencia de datos (Staleness)</td>
                    <td className="py-4"><span className="risk-pill bg-risk-med">MEDIO</span></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold">Alertas de Zona</td>
                    <td className="py-4">Polling (5 min)</td>
                    <td className="py-4">Comparación vs Media Histórica</td>
                    <td className="py-4">Consumo excesivo de recursos DB</td>
                    <td className="py-4"><span className="risk-pill bg-risk-med">MEDIO</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
