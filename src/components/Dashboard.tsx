import { useMemo, useState } from 'react';
import { ChangeRequest, CRPriority, CRCategory, CRStatus } from '../types';
import { 
  FileText, CheckCircle2, Clock, PlayCircle, AlertTriangle, 
  XCircle, BarChart3, PieChart, Tag, Download, Calendar, ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  changeRequests: ChangeRequest[];
  onSelectTab: (tab: string) => void;
  onSelectCR: (cr: ChangeRequest) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const statusLabels: Record<CRStatus, string> = {
  draft: 'ฉบับร่าง',
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธคำขอ',
  in_progress: 'กำลังแก้ไข',
  completed: 'เสร็จสมบูรณ์',
  cancelled: 'ยกเลิก',
};

const categoryLabels: Record<CRCategory, string> = {
  bugfix: 'แก้ไขบั๊ก (Bugfix)',
  feature: 'เพิ่มฟีเจอร์ (Feature)',
  improvement: 'ปรับปรุงระบบ (Improvement)',
  security: 'ความปลอดภัย (Security)',
  other: 'อื่นๆ (Other)',
};

const priorityLabels: Record<CRPriority, string> = {
  low: 'ต่ำ (Low)',
  medium: 'ปานกลาง (Medium)',
  high: 'สูง (High)',
  urgent: 'ด่วนที่สุด (Urgent)',
};

const statusColors: Record<CRStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  in_progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function Dashboard({ 
  changeRequests, 
  onSelectTab, 
  onSelectCR,
  onExportCSV,
  onExportPDF
}: DashboardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'category' | 'priority'>('category');

  // 1. Calculate general stats
  const stats = useMemo(() => {
    const total = changeRequests.length;
    let pending = 0;
    let approved = 0;
    let inProgress = 0;
    let completed = 0;
    let rejected = 0;

    changeRequests.forEach(cr => {
      if (cr.status === 'pending') pending++;
      else if (cr.status === 'approved') approved++;
      else if (cr.status === 'in_progress') inProgress++;
      else if (cr.status === 'completed') completed++;
      else if (cr.status === 'rejected') rejected++;
    });

    return { total, pending, approved, inProgress, completed, rejected };
  }, [changeRequests]);

  // 2. Group by category for charts
  const categoryData = useMemo(() => {
    const counts: Record<CRCategory, number> = {
      bugfix: 0,
      feature: 0,
      improvement: 0,
      security: 0,
      other: 0,
    };
    changeRequests.forEach(cr => {
      counts[cr.category]++;
    });
    return Object.entries(counts).map(([key, val]) => ({
      name: categoryLabels[key as CRCategory],
      value: val,
      key
    }));
  }, [changeRequests]);

  // 3. Group by priority
  const priorityData = useMemo(() => {
    const counts: Record<CRPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    changeRequests.forEach(cr => {
      counts[cr.priority]++;
    });
    return Object.entries(counts).map(([key, val]) => ({
      name: priorityLabels[key as CRPriority],
      value: val,
      key
    }));
  }, [changeRequests]);

  // 4. Group by status for circular graph
  const statusGraphData = useMemo(() => {
    const total = stats.total || 1;
    const slices = [
      { status: 'pending', count: stats.pending, color: '#f59e0b', label: 'รออนุมัติ' },
      { status: 'approved', count: stats.approved, color: '#3b82f6', label: 'อนุมัติแล้ว' },
      { status: 'in_progress', count: stats.inProgress, color: '#06b6d4', label: 'กำลังแก้ไข' },
      { status: 'completed', count: stats.completed, color: '#10b981', label: 'เสร็จสิ้น' },
      { status: 'rejected', count: stats.rejected, color: '#ef4444', label: 'ปฏิเสธ' },
    ].filter(s => s.count > 0);

    // Calculate percentages and drawing variables
    let accumulatedAngle = 0;
    return slices.map(s => {
      const percentage = (s.count / total) * 100;
      const angle = (s.count / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return { ...s, percentage, startAngle, angle };
    });
  }, [stats]);

  // Custom SVG donut renderer
  const renderDonutChart = () => {
    if (stats.total === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-52 text-slate-400">
          <PieChart className="w-12 h-12 mb-2 stroke-1" />
          <p className="text-sm font-sans">ยังไม่มีข้อมูลสำหรับการสรุปสถิติ</p>
        </div>
      );
    }

    const size = 200;
    const center = size / 2;
    const radius = 70;
    const strokeWidth = 20;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;

    return (
      <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
        <div className="relative w-[200px] h-[200px]">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
            {/* Background Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />
            {statusGraphData.map((slice, idx) => {
              const strokeDashoffset = circumference - (slice.percentage / 100) * circumference;
              const rotation = (accumulatedPercentage / 100) * 360;
              accumulatedPercentage += slice.percentage;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} ${center} ${center})`}
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease-out, opacity 0.2s',
                    cursor: 'pointer',
                    opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.6
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold text-slate-800">{stats.total}</span>
            <span className="text-[11px] font-sans text-slate-400 tracking-wider uppercase">รายการทั้งหมด</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          {statusGraphData.map((slice, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-4 px-3 py-1.5 rounded-lg transition-colors ${
                hoveredIndex === idx ? 'bg-slate-50' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <div className="flex-1 min-w-[100px]">
                <p className="text-xs font-medium text-slate-700">{slice.label}</p>
                <p className="text-[10px] text-slate-400">{slice.count} เอกสาร</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-semibold text-slate-800">
                  {slice.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Custom SVG Bar Chart Renderer
  const renderBarChart = () => {
    const data = chartType === 'category' ? categoryData : priorityData;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-sans text-slate-500 font-medium">สัดส่วนจำแนกตามความสำคัญและหมวดหมู่</span>
          <div className="flex rounded-md bg-slate-100 p-0.5" id="chart-toggle-btn">
            <button
              onClick={() => setChartType('category')}
              className={`px-3 py-1 text-xs font-sans rounded-md transition-all ${
                chartType === 'category'
                  ? 'bg-white shadow-sm text-slate-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ตามหมวดหมู่
            </button>
            <button
              onClick={() => setChartType('priority')}
              className={`px-3 py-1 text-xs font-sans rounded-md transition-all ${
                chartType === 'priority'
                  ? 'bg-white shadow-sm text-slate-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ตามระดับความด่วน
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, idx) => {
            const pct = (item.value / maxVal) * 100;
            const barColors = [
              'from-slate-700 to-slate-900',
              'from-indigo-500 to-indigo-700',
              'from-sky-500 to-sky-700',
              'from-emerald-500 to-emerald-700',
              'from-amber-500 to-amber-700',
            ];
            const colorClass = barColors[idx % barColors.length];

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {item.value} รายการ ({changeRequests.length ? ((item.value / changeRequests.length) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                    style={{ 
                      width: `${pct}%`,
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 5. Recent Change Requests
  const recentCRs = useMemo(() => {
    return [...changeRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [changeRequests]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            แผงควบคุมหลัก (Dashboard)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            สรุปข้อมูลสถิติ สถานะ และภาพรวมเอกสาร Change Request ทั้งหมดในระบบ
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="export-excel-btn"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            ส่งออก Excel (CSV)
          </button>
          
          <button
            id="export-pdf-btn"
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            ส่งออกรายงาน (PDF)
          </button>
        </div>
      </div>

      {/* Bento Grid Stats Card */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total CRs */}
        <div 
          onClick={() => onSelectTab('list')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          id="stat-total-card"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-slate-50 text-slate-700 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-800">{stats.total}</p>
            <p className="text-[11px] font-sans text-slate-500 font-medium">รายการทั้งหมด</p>
          </div>
        </div>

        {/* Pending CRs */}
        <div 
          onClick={() => onSelectTab('list')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          id="stat-pending-card"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-800">{stats.pending}</p>
            <p className="text-[11px] font-sans text-amber-600 font-medium">รอการอนุมัติ</p>
          </div>
        </div>

        {/* Approved CRs */}
        <div 
          onClick={() => onSelectTab('list')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          id="stat-approved-card"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-800">{stats.approved}</p>
            <p className="text-[11px] font-sans text-blue-600 font-medium">อนุมัติแล้ว</p>
          </div>
        </div>

        {/* In Progress CRs */}
        <div 
          onClick={() => onSelectTab('list')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          id="stat-progress-card"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <PlayCircle className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-800">{stats.inProgress}</p>
            <p className="text-[11px] font-sans text-cyan-600 font-medium">กำลังดำเนินการ</p>
          </div>
        </div>

        {/* Completed CRs */}
        <div 
          onClick={() => onSelectTab('list')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          id="stat-completed-card"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-800">{stats.completed}</p>
            <p className="text-[11px] font-sans text-emerald-600 font-medium">เสร็จสมบูรณ์</p>
          </div>
        </div>

        {/* Rejected CRs */}
        <div 
          onClick={() => onSelectTab('list')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
          id="stat-rejected-card"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-800">{stats.rejected}</p>
            <p className="text-[11px] font-sans text-rose-600 font-medium">ปฏิเสธคำขอ</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Status Donut Graph */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-slate-600" />
              ภาพรวมสถานะการทำงาน
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">แบ่งเปอร์เซ็นต์ตามกระบวนการทำงานหลัก</p>
          </div>
          
          <div className="my-auto">
            {renderDonutChart()}
          </div>
        </div>

        {/* Category / Priority Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-3 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-slate-600" />
              สถิติแยกตามประเภท / ความเร่งด่วน
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">ตรวจสอบปริมาณงานแยกตามกลุ่มคุณลักษณะ</p>
          </div>
          
          <div className="my-auto pt-4">
            {renderBarChart()}
          </div>
        </div>
      </div>

      {/* Recent Activity / CRs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-600" />
              เอกสารขอแก้ไขงานล่าสุด (Recent Activity)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">เอกสาร 5 รายการที่มีการยื่นคำขอหรือปรับปรุงล่าสุด</p>
          </div>
          <button
            onClick={() => onSelectTab('list')}
            className="text-xs font-sans font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
            id="view-all-cr-btn"
          >
            ดูทั้งหมด
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentCRs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-sans">
            ยังไม่มีข้อมูล Change Request ในระบบ กรุณาใช้เมนู "สร้างเอกสาร CR" เพื่อเพิ่มข้อมูล
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="recent-cr-table">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-sans text-[11px] uppercase tracking-wider">
                  <th className="py-2 pb-3 font-medium">เลขที่เอกสาร</th>
                  <th className="py-2 pb-3 font-medium">ชื่องาน / ระบบ</th>
                  <th className="py-2 pb-3 font-medium">ประเภท</th>
                  <th className="py-2 pb-3 font-medium">ผู้ร้องขอ</th>
                  <th className="py-2 pb-3 font-medium">ความสำคัญ</th>
                  <th className="py-2 pb-3 font-medium text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentCRs.map(cr => (
                  <tr 
                    key={cr.id} 
                    onClick={() => onSelectCR(cr)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 font-mono text-xs font-semibold text-slate-800 group-hover:text-indigo-600">
                      {cr.crNumber}
                    </td>
                    <td className="py-3">
                      <p className="text-xs font-sans font-semibold text-slate-800 line-clamp-1">{cr.title}</p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">{cr.systemName}</p>
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-sans text-slate-600">
                        {categoryLabels[cr.category]}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-sans text-slate-600">
                      <div>{cr.requesterName}</div>
                      <div className="text-[10px] text-slate-400">{new Date(cr.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${
                        cr.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                        cr.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        cr.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {priorityLabels[cr.priority]}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-[10px] font-sans font-semibold px-2.5 py-1 rounded-full border ${statusColors[cr.status]}`}>
                        {statusLabels[cr.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
