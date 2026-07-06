import { ChangeRequest, CRPriority, CRCategory, CRStatus } from '../types';

interface PrintAllReportProps {
  changeRequests: ChangeRequest[];
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
  bugfix: 'Bugfix',
  feature: 'Feature',
  improvement: 'Improvement',
  security: 'Security',
  other: 'Other',
};

const priorityLabels: Record<CRPriority, string> = {
  low: 'ต่ำ',
  medium: 'ปกติ',
  high: 'สูง',
  urgent: 'ด่วนที่สุด',
};

export default function PrintAllReport({ changeRequests }: PrintAllReportProps) {
  const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="hidden print:block p-8 max-w-[1100px] mx-auto bg-white text-black font-sans text-[10px]" id="official-print-all-report">
      {/* Header */}
      <div className="text-center border-b border-black pb-3 mb-4">
        <h1 className="text-base font-bold uppercase tracking-wide">รายงานสรุปสถานะรายการแก้ไขและเปลี่ยนแปลงระบบคอมพิวเตอร์ (IT Change Requests Ledger)</h1>
        <p className="text-[10px] text-slate-500 mt-1">
          ข้อมูล ณ วันที่: <strong>{dateStr}</strong> | รายการทั้งหมด: <strong>{changeRequests.length} เอกสาร</strong>
        </p>
      </div>

      {/* Ledger Table */}
      <table className="w-full border-collapse border border-slate-400 text-[9px] mb-8">
        <thead>
          <tr className="bg-slate-100 font-semibold text-slate-800">
            <th className="border border-slate-300 p-2 text-left" style={{ width: '10%' }}>เลขที่ CR</th>
            <th className="border border-slate-300 p-2 text-left" style={{ width: '30%' }}>เรื่อง / ระบบงานที่แก้ไข</th>
            <th className="border border-slate-300 p-2 text-left" style={{ width: '10%' }}>ประเภทงาน</th>
            <th className="border border-slate-300 p-2 text-left" style={{ width: '15%' }}>ผู้ร้องขอ / สังกัด</th>
            <th className="border border-slate-300 p-2 text-left" style={{ width: '15%' }}>ผู้รับผิดชอบ</th>
            <th className="border border-slate-300 p-2 text-center" style={{ width: '10%' }}>ความเร่งด่วน</th>
            <th className="border border-slate-300 p-2 text-center" style={{ width: '10%' }}>สถานะ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {changeRequests.map((cr) => (
            <tr key={cr.id} className="hover:bg-slate-50">
              <td className="border border-slate-300 p-2 font-mono font-bold">{cr.crNumber}</td>
              <td className="border border-slate-300 p-2">
                <p className="font-semibold">{cr.title}</p>
                <p className="text-[8px] text-slate-500 font-medium">ระบบ: {cr.systemName}</p>
              </td>
              <td className="border border-slate-300 p-2">{categoryLabels[cr.category]}</td>
              <td className="border border-slate-300 p-2">
                <p className="font-medium">{cr.requesterName}</p>
                <p className="text-[8px] text-slate-500 font-mono">{cr.requesterEmail}</p>
              </td>
              <td className="border border-slate-300 p-2">
                {cr.assignedTo ? (
                  <p className="font-medium">{cr.assignedTo}</p>
                ) : (
                  <span className="text-slate-400 italic">- ยังไม่มอบหมาย -</span>
                )}
              </td>
              <td className="border border-slate-300 p-2 text-center font-semibold">{priorityLabels[cr.priority]}</td>
              <td className="border border-slate-300 p-2 text-center font-bold">{statusLabels[cr.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature Row */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-400 mt-12 text-center">
        <div className="space-y-12">
          <p className="font-semibold">ลงชื่อ .............................................................. ผู้จัดทำรายงานสรุป</p>
          <p className="text-[10px] text-slate-600">
            วันที่ ........ / ................ / ................
          </p>
        </div>
        
        <div className="space-y-12">
          <p className="font-semibold">ลงชื่อ .............................................................. ผู้อนุมัติรับทราบสถิติ</p>
          <p className="text-[10px] text-slate-600">
            วันที่ ........ / ................ / ................
          </p>
        </div>
      </div>
    </div>
  );
}
