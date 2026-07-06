import { ChangeRequest, CRPriority, CRCategory, CRStatus } from '../types';

interface PrintReportProps {
  cr: ChangeRequest;
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
  bugfix: 'แก้ไขข้อผิดพลาด (Bugfix)',
  feature: 'เพิ่มคุณสมบัติใหม่ (Feature)',
  improvement: 'ปรับปรุงประสิทธิภาพ (Improvement)',
  security: 'ความมั่นคงปลอดภัย (Security)',
  other: 'อื่นๆ (Other)',
};

const priorityLabels: Record<CRPriority, string> = {
  low: 'ต่ำ (Low)',
  medium: 'ปกติ (Medium)',
  high: 'สูง (High)',
  urgent: 'ด่วนที่สุด (Urgent)',
};

export default function PrintReport({ cr }: PrintReportProps) {
  return (
    <div className="hidden print:block p-8 max-w-[800px] mx-auto bg-white text-black font-sans text-xs border border-slate-300" id="official-print-report">
      {/* Document Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-lg font-bold uppercase tracking-wider">เอกสารขออนุมัติแก้ไขและเปลี่ยนแปลงระบบคอมพิวเตอร์</h1>
        <h2 className="text-sm font-semibold text-slate-800">IT Change Request & Approval Form (CR)</h2>
        <p className="text-[10px] text-slate-500 mt-1">ใบพิจารณาเลขที่: <strong>{cr.crNumber}</strong></p>
      </div>

      {/* Metadata block */}
      <table className="w-full border-collapse mb-6 text-xs">
        <tbody>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold bg-slate-100" style={{ width: '20%' }}>เลขที่เอกสาร (CR No.)</td>
            <td className="border border-slate-300 p-2 font-mono font-bold" style={{ width: '30%' }}>{cr.crNumber}</td>
            <td className="border border-slate-300 p-2 font-semibold bg-slate-100" style={{ width: '20%' }}>วันที่ยื่นคำขอ (Date)</td>
            <td className="border border-slate-300 p-2" style={{ width: '30%' }}>
              {new Date(cr.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold bg-slate-100">ชื่อระบบงาน (System)</td>
            <td className="border border-slate-300 p-2 font-bold">{cr.systemName}</td>
            <td className="border border-slate-300 p-2 font-semibold bg-slate-100">สถานะปัจจุบัน (Status)</td>
            <td className="border border-slate-300 p-2 font-bold">{statusLabels[cr.status]}</td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-semibold bg-slate-100">ประเภทงาน (Category)</td>
            <td className="border border-slate-300 p-2">{categoryLabels[cr.category]}</td>
            <td className="border border-slate-300 p-2 font-semibold bg-slate-100">ระดับความด่วน (Priority)</td>
            <td className="border border-slate-300 p-2 font-bold">{priorityLabels[cr.priority]}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 1: Requester Details */}
      <div className="mb-6">
        <h3 className="font-bold border-b border-black pb-1 mb-2">1. ข้อมูลผู้ยื่นเอกสารเสนอแก้ไขงาน (Requester Details)</h3>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2 font-semibold bg-slate-50" style={{ width: '25%' }}>ชื่อ-นามสกุล ผู้เสนอแก้ไข</td>
              <td className="border border-slate-300 p-2" style={{ width: '25%' }}>{cr.requesterName}</td>
              <td className="border border-slate-300 p-2 font-semibold bg-slate-50" style={{ width: '25%' }}>อีเมลติดต่อประสานงาน</td>
              <td className="border border-slate-300 p-2 font-mono" style={{ width: '25%' }}>{cr.requesterEmail}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Requirement Description */}
      <div className="mb-6">
        <h3 className="font-bold border-b border-black pb-1 mb-2">2. รายละเอียดปัญหา และความต้องการแก้ไขเปลี่ยนแปลง (Detailed Requirements)</h3>
        <div className="border border-slate-300 p-3 min-h-[100px] leading-relaxed whitespace-pre-wrap">
          {cr.description}
        </div>
      </div>

      {/* Section 3: Justification & Benefits */}
      <div className="mb-6">
        <h3 className="font-bold border-b border-black pb-1 mb-2">3. เหตุผลความจำเป็นและประโยชน์ที่ได้รับ (Justification & Benefits)</h3>
        <div className="border border-slate-300 p-3 min-h-[80px] leading-relaxed whitespace-pre-wrap">
          {cr.reason}
        </div>
      </div>

      {/* Section 4: Impact Analysis */}
      <div className="mb-6">
        <h3 className="font-bold border-b border-black pb-1 mb-2">4. ผลวิเคราะห์ผลกระทบและความเชื่อมโยงระบบ (Impact Analysis)</h3>
        <div className="border border-slate-300 p-3 min-h-[60px] leading-relaxed whitespace-pre-wrap">
          {cr.impactAnalysis || 'การวิเคราะห์ผลกระทบสมบูรณ์ ไม่มีการพาดพิงหรือส่งผลกระทบต่อโมดูลแวดล้อม'}
        </div>
      </div>

      {/* Section 5: Assignment Block */}
      <div className="mb-6">
        <h3 className="font-bold border-b border-black pb-1 mb-2">5. บันทึกผลผู้รับผิดชอบงานและผู้ปฏิบัติการ (IT Engineering Assignment)</h3>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2 font-semibold bg-slate-50" style={{ width: '25%' }}>วิศวกรผู้ได้รับมอบหมาย</td>
              <td className="border border-slate-300 p-2" style={{ width: '25%' }}>{cr.assignedTo || 'ยังไม่ได้ระบุมอบหมาย'}</td>
              <td className="border border-slate-300 p-2 font-semibold bg-slate-50" style={{ width: '25%' }}>อีเมลผู้ดำเนินการ</td>
              <td className="border border-slate-300 p-2 font-mono" style={{ width: '25%' }}>{cr.assignedEmail || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 6: History logs and comments */}
      <div className="mb-8">
        <h3 className="font-bold border-b border-black pb-1 mb-2">6. บันทึกการอนุมัติและประวัติการเปลี่ยนแปลง (Approval History Logs)</h3>
        <table className="w-full border border-slate-300 text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-1.5 text-left" style={{ width: '20%' }}>วัน-เวลาบันทึก</th>
              <th className="border border-slate-300 p-1.5 text-left" style={{ width: '25%' }}>ผู้ดำเนินการ</th>
              <th className="border border-slate-300 p-1.5 text-left">รายละเอียดการดำเนินการ / เหตุผลหมายเหตุประกอบการปรับปรุงสถานะ</th>
            </tr>
          </thead>
          <tbody>
            {cr.history && cr.history.length > 0 ? (
              cr.history.map((log) => (
                <tr key={log.id}>
                  <td className="border border-slate-300 p-1.5 font-mono">
                    {new Date(log.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-semibold">{log.userName}</td>
                  <td className="border border-slate-300 p-1.5">{log.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border border-slate-300 p-2 text-center text-slate-400">
                  ไม่มีประวัติการบันทึกสถานะ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signature boxes */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-400 mt-10">
        <div className="text-center space-y-12">
          <p className="font-semibold">ลงชื่อ .............................................................. ผู้จัดทำ/ผู้ประสานงาน</p>
          <p className="text-[11px] text-slate-600">
            ( {cr.requesterName} )<br />
            วันที่ ........ / ................ / ................
          </p>
        </div>
        
        <div className="text-center space-y-12">
          <p className="font-semibold">ลงชื่อ .............................................................. ผู้อนุมัติโครงการ</p>
          <p className="text-[11px] text-slate-600">
            ( ............................................................................ )<br />
            วันที่ ........ / ................ / ................
          </p>
        </div>
      </div>
    </div>
  );
}
