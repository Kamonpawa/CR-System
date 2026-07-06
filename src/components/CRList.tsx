import { useState, useMemo } from 'react';
import { ChangeRequest, CRPriority, CRCategory, CRStatus } from '../types';
import { 
  Search, Filter, ChevronRight, AlertTriangle, PlayCircle, CheckCircle2, 
  XCircle, Clock, FileText, Sparkles, FilterX, HelpCircle, ArrowUpRight,
  ChevronDown
} from 'lucide-react';

interface CRListProps {
  changeRequests: ChangeRequest[];
  onSelectCR: (cr: ChangeRequest) => void;
  onAddNew: () => void;
}

const statusLabels: Record<CRStatus, string> = {
  draft: 'ฉบับร่าง',
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธคำขอ',
  in_progress: 'กำลังดำเนินงาน',
  completed: 'เสร็จสมบูรณ์',
  cancelled: 'ยกเลิก',
};

const categoryLabels: Record<CRCategory, string> = {
  bugfix: 'แก้ไขบั๊ก (Bugfix)',
  feature: 'เพิ่มฟีเจอร์ (Feature)',
  improvement: 'ปรับปรุงคุณภาพ',
  security: 'ความปลอดภัย (Security)',
  other: 'อื่นๆ',
};

const priorityLabels: Record<CRPriority, string> = {
  low: 'ต่ำ (Low)',
  medium: 'ปกติ (Medium)',
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

export default function CRList({ changeRequests, onSelectCR, onAddNew }: CRListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
  };

  // Filter logic
  const filteredCRs = useMemo(() => {
    return changeRequests.filter(cr => {
      // 1. Search term match
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch = sTerm === '' || 
        cr.crNumber.toLowerCase().includes(sTerm) ||
        cr.title.toLowerCase().includes(sTerm) ||
        cr.systemName.toLowerCase().includes(sTerm) ||
        cr.requesterName.toLowerCase().includes(sTerm) ||
        cr.requesterEmail.toLowerCase().includes(sTerm);

      // 2. Status match
      const matchesStatus = statusFilter === 'all' || cr.status === statusFilter;

      // 3. Category match
      const matchesCategory = categoryFilter === 'all' || cr.category === categoryFilter;

      // 4. Priority match
      const matchesPriority = priorityFilter === 'all' || cr.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [changeRequests, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="cr-list-filters-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              id="search-cr-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาด้วยเลขที่ใบ CR, ชื่อเรื่อง, ระบบงาน หรือชื่อผู้ร้องขอ..."
              className="w-full text-xs font-sans pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <button
            id="create-new-cr-btn"
            onClick={onAddNew}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-sans font-semibold text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl transition-all shadow-sm"
          >
            สร้างเอกสาร CR
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filters dropdown grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2" id="filter-selectors-grid">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wide">สถานะการทำงาน</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="all">ทั้งหมด (ทุกสถานะ)</option>
              <option value="draft">ฉบับร่าง</option>
              <option value="pending">รอการอนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="in_progress">กำลังแก้ไข</option>
              <option value="completed">เสร็จสมบูรณ์</option>
              <option value="rejected">ปฏิเสธคำขอ</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wide">ประเภทงาน (Category)</label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="all">ทั้งหมด (ทุกประเภท)</option>
              <option value="bugfix">แก้ไขบั๊ก (Bugfix)</option>
              <option value="feature">เพิ่มฟีเจอร์ (Feature)</option>
              <option value="improvement">ปรับปรุงคุณภาพ</option>
              <option value="security">ความปลอดภัย (Security)</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wide">ระดับความเร่งด่วน</label>
            <select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            >
              <option value="all">ทั้งหมด (ทุกความเร่งด่วน)</option>
              <option value="low">ต่ำ (Low)</option>
              <option value="medium">ปกติ (Medium)</option>
              <option value="high">สูง (High)</option>
              <option value="urgent">ด่วนที่สุด (Urgent)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="w-full text-xs font-sans font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-transparent"
                id="clear-filters-btn"
              >
                <FilterX className="w-3.5 h-3.5" />
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-sans text-slate-500">
          ค้นพบทั้งหมด <strong className="text-slate-800 font-bold">{filteredCRs.length}</strong> รายการ 
          {changeRequests.length !== filteredCRs.length && ` (จากทั้งหมด ${changeRequests.length} รายการ)`}
        </span>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="cr-list-table-card">
        {filteredCRs.length === 0 ? (
          <div className="text-center py-12 px-4" id="empty-cr-state">
            <div className="inline-flex p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 mb-3">
              <FileText className="w-8 h-8 stroke-1" />
            </div>
            <p className="text-sm font-sans font-semibold text-slate-700">ไม่พบเอกสารตรงตามเงื่อนไขที่ค้นหา</p>
            <p className="text-xs text-slate-400 mt-1 font-sans">โปรดปรับเปลี่ยนคำค้นหา หรือใช้ปุ่มด่วนล้างตัวกรองเพื่อเรียกดูข้อมูลใหม่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="cr-main-datagrid">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/55 text-slate-400 font-sans text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-5 font-medium">เลขที่ CR</th>
                  <th className="py-3 px-4 font-medium">เรื่องที่ขอแก้ไข / ชื่อระบบ</th>
                  <th className="py-3 px-4 font-medium">ประเภท</th>
                  <th className="py-3 px-4 font-medium">ผู้ยื่นคำขอ</th>
                  <th className="py-3 px-4 font-medium">ผู้ดำเนินการ</th>
                  <th className="py-3 px-4 font-medium">ระดับความด่วน</th>
                  <th className="py-3 px-5 font-medium text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCRs.map(cr => (
                  <tr
                    key={cr.id}
                    onClick={() => onSelectCR(cr)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    {/* CR Number */}
                    <td className="py-4 px-5 font-mono text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {cr.crNumber}
                    </td>

                    {/* Title & System */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs font-sans font-semibold text-slate-800 line-clamp-1 group-hover:text-slate-900 transition-colors">
                        {cr.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5 font-medium">
                        {cr.systemName}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="text-xs font-sans text-slate-600">
                        {categoryLabels[cr.category]}
                      </span>
                    </td>

                    {/* Requester & Date */}
                    <td className="py-4 px-4 text-xs font-sans text-slate-600">
                      <div className="font-medium text-slate-700">{cr.requesterName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(cr.createdAt).toLocaleDateString('th-TH', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-4 px-4 text-xs font-sans text-slate-600">
                      {cr.assignedTo ? (
                        <div className="text-slate-700 font-medium">{cr.assignedTo}</div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">- ยังไม่ได้มอบหมาย -</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full ${
                        cr.priority === 'urgent' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        cr.priority === 'high' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        cr.priority === 'medium' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {priorityLabels[cr.priority]}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`text-[10px] font-sans font-semibold px-3 py-1 rounded-full border ${statusColors[cr.status]}`}>
                          {statusLabels[cr.status]}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-1.5 opacity-0 group-hover:opacity-100 group-hover:transform group-hover:translate-x-0.5 transition-all" />
                      </div>
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
