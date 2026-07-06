import React, { useState, useEffect } from 'react';
import { ChangeRequest, CRPriority, CRCategory, CRStatus } from '../types';
import { 
  FilePlus, ClipboardList, RefreshCw, Send, Save, Info, User, Mail, 
  Settings, AlertCircle, HelpCircle, ArrowLeft 
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface CRFormProps {
  currentUser: FirebaseUser | null;
  onSubmit: (crData: Omit<ChangeRequest, 'id' | 'crNumber' | 'createdAt' | 'updatedAt' | 'comments' | 'history'>, shouldSendEmail: boolean) => Promise<void>;
  onCancel: () => void;
  editingCR?: ChangeRequest;
}

export default function CRForm({ currentUser, onSubmit, onCancel, editingCR }: CRFormProps) {
  const [title, setTitle] = useState('');
  const [systemName, setSystemName] = useState('');
  const [category, setCategory] = useState<CRCategory>('bugfix');
  const [priority, setPriority] = useState<CRPriority>('medium');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [impactAnalysis, setImpactAnalysis] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-populate logged-in user info or editing CR info
  useEffect(() => {
    if (editingCR) {
      setTitle(editingCR.title);
      setSystemName(editingCR.systemName);
      setCategory(editingCR.category);
      setPriority(editingCR.priority);
      setDescription(editingCR.description);
      setReason(editingCR.reason);
      setImpactAnalysis(editingCR.impactAnalysis || '');
      setRequesterName(editingCR.requesterName);
      setRequesterEmail(editingCR.requesterEmail);
    } else if (currentUser) {
      setRequesterName(currentUser.displayName || 'ผู้ทดสอบระบบ (Demo User)');
      setRequesterEmail(currentUser.email || 'demo@example.com');
    }
  }, [currentUser, editingCR]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'กรุณาระบุหัวข้อเรื่องหรือชื่องานที่ต้องการแก้ไข';
    if (!systemName.trim()) errors.systemName = 'กรุณาระบุชื่อระบบงาน คอมพิวเตอร์ หรือชื่อโปรเจกต์';
    if (!description.trim()) errors.description = 'กรุณากรอกรายละเอียดปัญหาหรือสิ่งที่ต้องการให้ปรับปรุงแก้ไข';
    if (!reason.trim()) errors.reason = 'กรุณาระบุเหตุผลความจำเป็นและประโยชน์ของการแก้ไขในครั้งนี้';
    if (!requesterName.trim()) errors.requesterName = 'กรุณาระบุชื่อผู้ร้องขอแก้ไขงาน';
    if (!requesterEmail.trim()) {
      errors.requesterEmail = 'กรุณาระบุอีเมลผู้ร้องขอ';
    } else if (!/\S+@\S+\.\S+/.test(requesterEmail)) {
      errors.requesterEmail = 'กรุณาระบุรูปแบบอีเมลที่ถูกต้อง (e.g. name@domain.com)';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        systemName: systemName.trim(),
        category,
        priority,
        description: description.trim(),
        reason: reason.trim(),
        impactAnalysis: impactAnalysis.trim(),
        requesterName: requesterName.trim(),
        requesterEmail: requesterEmail.trim(),
        status: editingCR ? editingCR.status : 'pending', // Keeps status or sets default pending
      }, sendEmail);
    } catch (err) {
      console.error('Error submitting CR form:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm" id="cr-form-container">
      {/* Form Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-200 transition-colors"
            id="back-from-form-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-display font-semibold text-slate-800 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-indigo-600" />
              {editingCR ? `แก้ไขใบคำขอแก้ไขงาน (CR: ${editingCR.crNumber})` : 'สร้างเอกสาร Change Request (CR) ใหม่'}
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              ยื่นแบบคำร้องแก้ไขข้อผิดพลาดหรือเปลี่ยนแปลงคุณสมบัติของระบบงานสารสนเทศ
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Title & System Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
              หัวข้อเรื่อง / ชื่องานที่ขอแก้ไข
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แก้ไขปุ่มคำนวณภาษีทำงานผิดพลาด, เพิ่มหน้ารายงานสรุปยอดขายประจำสัปดาห์"
              className={`w-full text-xs font-sans px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                validationErrors.title ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
              }`}
            />
            {validationErrors.title && (
              <p className="text-[10px] text-rose-500 font-sans flex items-center gap-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.title}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
              ชื่อระบบคอมพิวเตอร์ / โครงการ
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-system-name"
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="เช่น ระบบขายสินค้าออนไลน์ E-Commerce, ระบบ HR Payroll, GoogleAI002"
              className={`w-full text-xs font-sans px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                validationErrors.systemName ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
              }`}
            />
            {validationErrors.systemName && (
              <p className="text-[10px] text-rose-500 font-sans flex items-center gap-0.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.systemName}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
              หมวดหมู่ / ประเภทการเปลี่ยนแปลง
            </label>
            <select
              id="select-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CRCategory)}
              className="w-full text-xs font-sans px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="bugfix">แก้ไขบั๊ก (Bugfix) - ระบบเดิมทำงานผิดพลาด</option>
              <option value="feature">เพิ่มฟีเจอร์ใหม่ (Feature) - สร้างความสามารถใหม่เพิ่มเติม</option>
              <option value="improvement">ปรับปรุงคุณภาพ (Improvement) - ปรับปรุงของเดิมให้ดีหรือเร็วขึ้น</option>
              <option value="security">ความมั่นคงปลอดภัย (Security) - ปรับปรุงสิทธิ์การเข้าถึง อุดรอยรั่ว</option>
              <option value="other">อื่นๆ (Other)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
              ระดับความเร่งด่วน (Priority)
            </label>
            <div className="grid grid-cols-4 gap-2" id="priority-options">
              {(['low', 'medium', 'high', 'urgent'] as CRPriority[]).map((p) => {
                const colors = {
                  low: 'hover:border-slate-300 border-slate-200 text-slate-600 peer-checked:bg-slate-50 peer-checked:border-slate-800 peer-checked:text-slate-900',
                  medium: 'hover:border-blue-300 border-slate-200 text-blue-600 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-900',
                  high: 'hover:border-amber-300 border-slate-200 text-amber-600 peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-900',
                  urgent: 'hover:border-rose-300 border-slate-200 text-rose-600 peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-900',
                };
                const labelMap = { low: 'ต่ำ', medium: 'ปกติ', high: 'สูง', urgent: 'ด่วนที่สุด' };
                
                return (
                  <label key={p} className="cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      className="sr-only peer"
                    />
                    <div className={`text-center py-2.5 text-xs font-sans font-semibold border rounded-lg transition-all ${colors[p]}`}>
                      {labelMap[p]}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
            รายละเอียดปัญหา หรือลักษณะความต้องการให้แก้ไขโดยละเอียด
            <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="input-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="โปรดอธิบายสถานการณ์ปัจจุบัน ปัญหาที่พบ หรือขั้นตอนความต้องการแก้ไข รวมถึงข้อมูลขั้นตอนที่สำคัญอย่างชัดเจน..."
            className={`w-full text-xs font-sans px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
              validationErrors.description ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
            }`}
          />
          {validationErrors.description && (
            <p className="text-[10px] text-rose-500 font-sans flex items-center gap-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationErrors.description}
            </p>
          )}
        </div>

        {/* Reasons & Expected Benefits */}
        <div className="space-y-1.5">
          <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
            เหตุผลความจำเป็นและประโยชน์ที่คาดว่าจะได้รับ
            <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="input-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เพื่ออะไร? ช่วยลดความเสี่ยงอะไร? ช่วยสนับสนุนกระบวนการทำงานใดให้ดีขึ้น? หรือตอบโจทย์ธุรกิจอย่างไร..."
            className={`w-full text-xs font-sans px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
              validationErrors.reason ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
            }`}
          />
          {validationErrors.reason && (
            <p className="text-[10px] text-rose-500 font-sans flex items-center gap-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationErrors.reason}
            </p>
          )}
        </div>

        {/* Impact Analysis (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1.5">
            วิเคราะห์ผลกระทบเบื้องต้น (ถ้ามี)
            <span className="text-slate-400 font-normal text-[10px]">(ระบุกระบวนการหรือระบบเชื่อมโยงที่อาจได้รับผลกระทบ)</span>
          </label>
          <textarea
            id="input-impact"
            rows={2}
            value={impactAnalysis}
            onChange={(e) => setImpactAnalysis(e.target.value)}
            placeholder="ระบุชื่อโมดูล หน้าจอ รายงาน หรือฐานข้อมูลอื่นที่ใช้ข้อมูลชุดเดียวกัน ซึ่งอาจได้รับผลกระทบจากการแก้ไขครั้งนี้"
            className="w-full text-xs font-sans px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Requester Information */}
        <div className="border-t border-slate-100 pt-5 mt-4">
          <h3 className="text-xs font-display font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-600" />
            ข้อมูลผู้ประสานงาน / ผู้ร้องขอ (Requester Information)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
                ชื่อผู้ยื่นคำขอ
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="input-requester-name"
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="เช่น สมชาย สุขสบาย"
                  className={`w-full text-xs font-sans pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                    validationErrors.requesterName ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
                  }`}
                />
              </div>
              {validationErrors.requesterName && (
                <p className="text-[10px] text-rose-500 font-sans flex items-center gap-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationErrors.requesterName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans font-semibold text-slate-700 flex items-center gap-1">
                อีเมลติดต่อ
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="input-requester-email"
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="เช่น somchai@company.com"
                  className={`w-full text-xs font-sans pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                    validationErrors.requesterEmail ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
                  }`}
                />
              </div>
              {validationErrors.requesterEmail && (
                <p className="text-[10px] text-rose-500 font-sans flex items-center gap-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationErrors.requesterEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email Alert Toggle */}
        <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl" id="email-toggle-container">
          <input
            id="checkbox-send-email"
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
          />
          <div className="flex-1">
            <label htmlFor="checkbox-send-email" className="text-xs font-sans font-semibold text-indigo-950 cursor-pointer">
              ส่งอีเมลแจ้งเตือนอัตโนมัติ (Automatic Email Notification)
            </label>
            <p className="text-[10px] text-indigo-700 font-sans mt-0.5">
              ระบบจะส่งอีเมลแจ้งเตือนไปยังผู้ร้องขอร่วมกับแจ้งเตือนในระบบเมื่อทำการสร้างหรือบันทึกข้อมูลสำเร็จ
            </p>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100" id="form-action-buttons">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-sans font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            ยกเลิก
          </button>
          
          <button
            id="submit-cr-form-btn"
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-sans font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 active:bg-slate-900 transition-colors shadow-sm disabled:opacity-55"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {editingCR ? 'บันทึกการแก้ไข' : 'ส่งเอกสาร (Submit CR)'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
