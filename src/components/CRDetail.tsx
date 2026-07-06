import React, { useState } from 'react';
import { ChangeRequest, CRPriority, CRCategory, CRStatus, CRComment } from '../types';
import { 
  ArrowLeft, Calendar, FileText, CheckCircle2, PlayCircle, XCircle, 
  Clock, User, Mail, Send, AlertTriangle, Settings, RefreshCw, 
  MessageSquare, History, Check, ShieldAlert, Edit3, Printer
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface CRDetailProps {
  cr: ChangeRequest;
  currentUser: FirebaseUser | null;
  onBack: () => void;
  onUpdateStatus: (crId: string, newStatus: CRStatus, updaterName: string, actionDetails: string) => Promise<void>;
  onAddComment: (crId: string, commenterName: string, commenterEmail: string, content: string) => Promise<void>;
  onAssignDeveloper: (crId: string, devName: string, devEmail: string, updaterName: string) => Promise<void>;
  onEdit: () => void;
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
  security: 'ความมั่นคงปลอดภัย (Security)',
  other: 'อื่นๆ (Other)',
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

const timelineSteps: { status: CRStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'ยื่นคำขอ', desc: 'เสนอเรื่องรอผู้เกี่ยวข้องตรวจสอบ' },
  { status: 'approved', label: 'อนุมัติคำขอ', desc: 'ได้รับการพิจารณาและผ่านเกณฑ์' },
  { status: 'in_progress', label: 'กำลังดำเนินการ', desc: 'วิศวกรหรือผู้พัฒนากำลังแก้ไขงาน' },
  { status: 'completed', label: 'เสร็จสมบูรณ์', desc: 'ทดสอบผ่านและพร้อมเปิดบริการ' }
];

export default function CRDetail({ 
  cr, 
  currentUser, 
  onBack, 
  onUpdateStatus, 
  onAddComment, 
  onAssignDeveloper,
  onEdit
}: CRDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Assignee states
  const [assignName, setAssignName] = useState(cr.assignedTo || '');
  const [assignEmail, setAssignEmail] = useState(cr.assignedEmail || '');
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Status transition state
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState<CRStatus | null>(null);

  // Comments Handling
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    try {
      const commenterName = currentUser.displayName || currentUser.email || 'Anonymous Staff';
      const commenterEmail = currentUser.email || '';
      await onAddComment(cr.id, commenterName, commenterEmail, commentText.trim());
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Assignment Handling
  const handleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    if (!assignName.trim() || !assignEmail.trim()) {
      setAssignError('กรุณากรอกทั้งชื่อและอีเมลผู้ปฏิบัติงาน');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(assignEmail)) {
      setAssignError('รูปแบบอีเมลผู้รับผิดชอบไม่ถูกต้อง');
      return;
    }

    setIsUpdatingAssignee(true);
    try {
      const updaterName = currentUser?.displayName || currentUser?.email || 'Anonymous System';
      await onAssignDeveloper(cr.id, assignName.trim(), assignEmail.trim(), updaterName);
      alert('บันทึกการมอบหมายผู้ปฏิบัติงานสำเร็จ ระบบจัดส่งอีเมลแจ้งงานอัตโนมัติแล้ว!');
    } catch (err) {
      console.error('Failed to assign developer:', err);
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Status Shift Handling
  const handleStatusShift = async (targetStatus: CRStatus) => {
    if (!currentUser) return;
    const note = statusNote.trim();
    if (!note) {
      alert('กรุณากรอก "หมายเหตุการปรับปรุงสถานะ" ก่อนทำการอัปเดตเพื่อบันทึกประวัติการเปลี่ยนแปลง');
      return;
    }

    setStatusLoading(targetStatus);
    try {
      const updaterName = currentUser.displayName || currentUser.email || 'Anonymous Updater';
      const fullDetails = `เปลี่ยนสถานะเป็น [${statusLabels[targetStatus]}] - หมายเหตุ: ${note}`;
      await onUpdateStatus(cr.id, targetStatus, updaterName, fullDetails);
      setStatusNote('');
      alert(`อัปเดตสถานะเป็น ${statusLabels[targetStatus]} และส่งเมลแจ้งผลสำเร็จ!`);
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setStatusLoading(null);
    }
  };

  // Calculate current stage index in progress tracker
  const currentStepIndex = timelineSteps.findIndex(s => s.status === cr.status);
  
  // Custom print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Detail Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200 transition-colors"
            id="detail-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {cr.crNumber}
              </span>
              <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border ${statusColors[cr.status]}`}>
                {statusLabels[cr.status]}
              </span>
            </div>
            <h2 className="text-lg font-display font-semibold text-slate-800 mt-1 line-clamp-1">{cr.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cr.status === 'draft' && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              id="detail-edit-btn"
            >
              <Edit3 className="w-3.5 h-3.5" />
              แก้ไขข้อมูล (Edit)
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            id="detail-print-btn"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์ใบนำส่ง CR
          </button>
        </div>
      </div>

      {/* Progress Timeline Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm no-print" id="cr-timeline-panel">
        <h3 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-5">สถานะใบคำร้องแก้ไขงาน (Workflow Tracker)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {timelineSteps.map((step, idx) => {
            const isCompleted = cr.status === 'completed' || currentStepIndex >= idx;
            const isCurrent = cr.status === step.status;
            
            return (
              <div key={idx} className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 relative">
                {/* Horizontal Line on Desktop */}
                {idx < 3 && (
                  <div className="hidden md:block absolute left-8 top-4 w-full h-[2px] bg-slate-100 -z-0">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: currentStepIndex > idx ? '100%' : '0%' }}
                    />
                  </div>
                )}
                
                {/* Step Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50' 
                    : isCurrent 
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </div>

                {/* Step details */}
                <div className="md:mt-1">
                  <p className={`text-xs font-sans font-bold ${
                    isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5 line-clamp-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split details row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main column: Info detail */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="cr-printable-area">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-sans font-bold text-indigo-600 uppercase tracking-widest">ใบส่งมอบงานและเปลี่ยนแปลงระบบ</span>
              <h1 className="text-xl font-display font-bold text-slate-800 mt-1">{cr.title}</h1>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                ระบบ: <strong className="text-slate-600">{cr.systemName}</strong> | 
                สร้างเมื่อ: {new Date(cr.createdAt).toLocaleString('th-TH')}
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="font-mono text-sm font-bold text-slate-700">{cr.crNumber}</span>
              <span className="text-[10px] text-slate-400 font-sans mt-1">
                แก้ไขล่าสุด: {new Date(cr.updatedAt).toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
            <div>
              <p className="text-[10px] font-sans font-bold text-slate-400 uppercase">ประเภทการแก้ไข</p>
              <p className="text-xs font-sans text-slate-800 font-semibold mt-0.5">
                {categoryLabels[cr.category]}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-sans font-bold text-slate-400 uppercase">ระดับความสำคัญ</p>
              <p className="text-xs font-sans font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  cr.priority === 'urgent' ? 'bg-rose-500' :
                  cr.priority === 'high' ? 'bg-amber-500' :
                  cr.priority === 'medium' ? 'bg-blue-500' :
                  'bg-slate-400'
                }`} />
                {priorityLabels[cr.priority]}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-sans font-bold text-slate-400 uppercase">ผู้เสนอแก้ไข</p>
              <p className="text-xs font-sans text-slate-800 font-semibold mt-0.5">
                {cr.requesterName}
              </p>
            </div>
          </div>

          {/* Description Block */}
          <div className="space-y-2">
            <h3 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              รายละเอียดความต้องการ / รายการปัญหา (Problem / Requirement Description)
            </h3>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs font-sans leading-relaxed text-slate-800 whitespace-pre-wrap">
              {cr.description}
            </div>
          </div>

          {/* Reason Block */}
          <div className="space-y-2">
            <h3 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              เหตุผลความจำเป็นและประโยชน์ของการแก้ไข (Justification & Expected Benefits)
            </h3>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs font-sans leading-relaxed text-slate-800 whitespace-pre-wrap">
              {cr.reason}
            </div>
          </div>

          {/* Impact Block */}
          <div className="space-y-2">
            <h3 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              การวิเคราะห์ผลกระทบและความเชื่อมโยงระบบ (Impact Analysis)
            </h3>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs font-sans leading-relaxed text-slate-800 whitespace-pre-wrap">
              {cr.impactAnalysis || 'ไม่ได้ระบุวิเคราะห์ผลกระทบ / การแก้ไขอิสระไม่กระทบโมดูลอื่น'}
            </div>
          </div>

          {/* Requester Profile */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <User className="w-5 h-5" />
              </div>
              <div className="text-xs font-sans">
                <p className="text-slate-400">ผู้ยื่นคำร้อง (Requester)</p>
                <p className="font-semibold text-slate-800">{cr.requesterName}</p>
                <p className="text-slate-500 font-mono text-[10px]">{cr.requesterEmail}</p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <Settings className="w-5 h-5" />
              </div>
              <div className="text-xs font-sans">
                <p className="text-slate-400">วิศวกรผู้รับผิดชอบ (Assigned Developer)</p>
                <p className="font-semibold text-slate-800">{cr.assignedTo || 'ยังไม่ได้มอบหมายภาระงาน'}</p>
                {cr.assignedEmail && <p className="text-slate-500 font-mono text-[10px]">{cr.assignedEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Action Desk & Comments */}
        <div className="space-y-6 no-print">
          {/* Action Desk Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" id="cr-action-board-card">
            <div>
              <h3 className="text-xs font-display font-semibold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-600" />
                บอร์ดดำเนินการสั่งการ (Action Desk)
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">ส่วนควบคุมสิทธิ์ มอบหมายงาน และเปลี่ยนสถานะคำขอ</p>
            </div>

            {/* Mapped Action: Mgt Panel */}
            <div className="space-y-4 border-t border-slate-100 pt-3">
              {/* Assign Developer */}
              <form onSubmit={handleAssignment} className="space-y-2.5">
                <label className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wide">มอบหมายวิศวกรดูแลแก้ไข</label>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    id="input-assign-name"
                    type="text"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                    placeholder="ชื่อผู้รับผิดชอบงาน"
                    className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    id="input-assign-email"
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="อีเมลผู้รับผิดชอบ (แจ้งเตือน)"
                    className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {assignError && <p className="text-[10px] text-rose-500 font-sans">{assignError}</p>}
                <button
                  id="assign-submit-btn"
                  type="submit"
                  disabled={isUpdatingAssignee}
                  className="w-full py-1.5 text-xs font-sans font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingAssignee ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  บันทึกการมอบหมายงาน
                </button>
              </form>

              {/* Status Update Control */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <label className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wide flex flex-col">
                  ปรับปรุงสถานะเอกสาร
                  <span className="text-[9px] text-rose-500 font-normal mt-0.5">* จำเป็นต้องระบุหมายเหตุด้านล่าง</span>
                </label>
                
                {/* Note text field */}
                <input
                  id="input-status-note"
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="เช่น ตรวจสอบความสมบูรณ์เรียบร้อยแล้ว, เริ่มดำเนินการเขียนโปรแกรม..."
                  className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />

                {/* Workflow transition grid */}
                <div className="grid grid-cols-2 gap-2" id="status-shift-buttons">
                  {/* Approve */}
                  {cr.status === 'pending' && (
                    <button
                      onClick={() => handleStatusShift('approved')}
                      disabled={statusLoading !== null}
                      className="py-2 text-xs font-sans font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {statusLoading === 'approved' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      อนุมัติ (Approve)
                    </button>
                  )}

                  {/* Reject */}
                  {cr.status === 'pending' && (
                    <button
                      onClick={() => handleStatusShift('rejected')}
                      disabled={statusLoading !== null}
                      className="py-2 text-xs font-sans font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {statusLoading === 'rejected' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      ปฏิเสธคำขอ
                    </button>
                  )}

                  {/* Start In Progress */}
                  {(cr.status === 'approved' || cr.status === 'pending') && (
                    <button
                      onClick={() => handleStatusShift('in_progress')}
                      disabled={statusLoading !== null}
                      className="py-2 text-xs font-sans font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {statusLoading === 'in_progress' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                      เริ่มแก้ไขงาน
                    </button>
                  )}

                  {/* Complete */}
                  {cr.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusShift('completed')}
                      disabled={statusLoading !== null}
                      className="py-2 text-xs font-sans font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1 col-span-2 cursor-pointer"
                    >
                      {statusLoading === 'completed' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      เสร็จสมบูรณ์ (Complete)
                    </button>
                  )}

                  {/* Cancel */}
                  {cr.status !== 'completed' && cr.status !== 'cancelled' && cr.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusShift('cancelled')}
                      disabled={statusLoading !== null}
                      className="py-2 text-xs font-sans font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 col-span-2 cursor-pointer text-center"
                    >
                      {statusLoading === 'cancelled' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      ยกเลิกใบคำขอแก้ไขนี้
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col max-h-[350px] overflow-hidden" id="cr-comments-board">
            <h3 className="text-xs font-display font-semibold text-slate-800 flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              สนทนา / สอบถามข้อมูล ({cr.comments?.length || 0})
            </h3>

            {/* Scrollable Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1" id="comments-timeline-scroller">
              {!cr.comments || cr.comments.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-400 font-sans">
                  ยังไม่มีข้อความสนทนาในเอกสารนี้
                </div>
              ) : (
                cr.comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
                    <div className="flex justify-between items-center text-[10px] font-sans">
                      <span className="font-semibold text-slate-700">{comment.userName}</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-600 mt-1">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleCommentSubmit} className="relative mt-auto border-t border-slate-100 pt-2.5">
              <input
                id="comment-text-input"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับสอบถาม..."
                className="w-full text-xs font-sans pl-3 pr-10 py-2 bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 rounded-lg focus:outline-none transition-all"
              />
              <button
                id="comment-submit-btn"
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="absolute right-1 top-3.5 p-1 hover:text-indigo-600 text-slate-400 transition-colors disabled:opacity-40"
              >
                {isSubmittingComment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Audit Logs History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-h-[250px] overflow-hidden flex flex-col">
            <h3 className="text-xs font-display font-semibold text-slate-800 flex items-center gap-1.5 mb-3">
              <History className="w-4 h-4 text-slate-600" />
              ประวัติการทำงาน (History Audit Logs)
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1" id="audit-history-scroller">
              {!cr.history || cr.history.length === 0 ? (
                <div className="text-center py-4 text-[10px] text-slate-400 font-sans">
                  ไม่มีประวัติการบันทึกสถานะ
                </div>
              ) : (
                cr.history.map((log) => (
                  <div key={log.id} className="flex gap-2 text-xs font-sans relative pl-3 border-l border-slate-100">
                    <div className="absolute left-[-4.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-slate-700 font-medium mt-0.5 text-[11px] leading-relaxed">
                        <strong>{log.userName}</strong>: {log.details}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
