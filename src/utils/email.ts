import { ChangeRequest, CRStatus } from '../types';

export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
}

// Function to call the server API to send email
export async function sendStatusEmail(to: string, subject: string, htmlBody: string) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, htmlBody }),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in sendStatusEmail helper:', error);
    return { success: false, error };
  }
}

// Translate status to Thai for emails
const statusTh: Record<CRStatus, string> = {
  draft: 'ฉบับร่าง',
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสมบูรณ์',
  cancelled: 'ยกเลิก',
};

// Colors for status in emails
const statusColors: Record<CRStatus, string> = {
  draft: '#64748b',
  pending: '#eab308',
  approved: '#3b82f6',
  rejected: '#ef4444',
  in_progress: '#06b6d4',
  completed: '#10b981',
  cancelled: '#6b7280',
};

// Generate HTML email layout
const getEmailBaseLayout = (title: string, contentHtml: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 32px 24px; }
        .footer { background-color: #f1f5f9; color: #64748b; padding: 16px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase; color: #ffffff; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; padding: 10px 20px; text-decoration: none !important; border-radius: 6px; font-weight: 500; margin-top: 16px; font-size: 14px; }
        .detail-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .detail-table th, .detail-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
        .detail-table th { color: #64748b; width: 30%; font-weight: 500; }
        .comment-box { background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 12px; margin: 15px 0; border-radius: 0 4px 4px 0; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ระบบจัดการเอกสาร Change Request</h1>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
          <p>&copy; 2026 Change Request Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 1. Email: CR Created
export function sendCRCreatedEmail(cr: ChangeRequest, systemUrl: string) {
  const subject = `[สร้างใหม่] เอกสาร Change Request ${cr.crNumber}: ${cr.title}`;
  const statusColor = statusColors[cr.status];
  
  const content = `
    <h2 style="margin-top:0; color:#0f172a;">มีการแจ้งเอกสาร Change Request ใหม่เข้ามาในระบบ</h2>
    <p>สวัสดีทีมงาน,</p>
    <p>มีการยื่นเอกสารขอแก้ไข/เปลี่ยนแปลงงานระบบคอมพิวเตอร์ใหม่ รายละเอียดดังนี้:</p>
    
    <table class="detail-table">
      <tr>
        <th>เลขที่ CR</th>
        <td><strong>${cr.crNumber}</strong></td>
      </tr>
      <tr>
        <th>ชื่อเรื่อง</th>
        <td>${cr.title}</td>
      </tr>
      <tr>
        <th>ระบบที่แก้ไข</th>
        <td>${cr.systemName}</td>
      </tr>
      <tr>
        <th>ประเภท</th>
        <td>${cr.category.toUpperCase()}</td>
      </tr>
      <tr>
        <th>ความสำคัญ</th>
        <td><span style="color:${cr.priority === 'urgent' ? '#ef4444' : '#1e293b'}; font-weight:bold;">${cr.priority.toUpperCase()}</span></td>
      </tr>
      <tr>
        <th>ผู้ร้องขอ</th>
        <td>${cr.requesterName} (${cr.requesterEmail})</td>
      </tr>
      <tr>
        <th>สถานะเริ่มต้น</th>
        <td><span class="badge" style="background-color:${statusColor}">${statusTh[cr.status]}</span></td>
      </tr>
    </table>
    
    <p><strong>รายละเอียดความต้องการ:</strong><br>${cr.description}</p>
    <p><strong>เหตุผลความจำเป็น:</strong><br>${cr.reason}</p>
    
    <div style="text-align: center;">
      <a href="${systemUrl}" class="btn">เปิดเข้าดูระบบเพื่อตรวจสอบ</a>
    </div>
  `;
  
  return sendStatusEmail(cr.requesterEmail, subject, getEmailBaseLayout(subject, content));
}

// 2. Email: CR Status Changed
export function sendCRStatusChangedEmail(cr: ChangeRequest, oldStatus: CRStatus, updaterName: string, systemUrl: string) {
  const subject = `[อัปเดตสถานะ] เอกสาร CR ${cr.crNumber} เปลี่ยนเป็นสถานะ ${statusTh[cr.status]}`;
  const statusColor = statusColors[cr.status];
  
  const content = `
    <h2 style="margin-top:0; color:#0f172a;">สถานะเอกสาร Change Request ได้รับการอัปเดต</h2>
    <p>สวัสดีคุณ ${cr.requesterName},</p>
    <p>เอกสาร Change Request ของท่านได้รับการอัปเดตสถานะการดำเนินการโดย <strong>${updaterName}</strong>:</p>
    
    <table class="detail-table">
      <tr>
        <th>เลขที่ CR</th>
        <td><strong>${cr.crNumber}</strong></td>
      </tr>
      <tr>
        <th>ชื่อเรื่อง</th>
        <td>${cr.title}</td>
      </tr>
      <tr>
        <th>สถานะเดิม</th>
        <td style="text-decoration: line-through; color: #94a3b8;">${statusTh[oldStatus]}</td>
      </tr>
      <tr>
        <th>สถานะใหม่</th>
        <td><span class="badge" style="background-color:${statusColor}">${statusTh[cr.status]}</span></td>
      </tr>
      ${cr.assignedTo ? `<tr><th>ผู้รับผิดชอบ</th><td>${cr.assignedTo}</td></tr>` : ''}
    </table>
    
    ${cr.history.length > 0 ? `<p><strong>รายละเอียดการอัปเดต:</strong> ${cr.history[cr.history.length - 1].details}</p>` : ''}
    
    <div style="text-align: center;">
      <a href="${systemUrl}" class="btn">คลิกเพื่อดูรายละเอียดเอกสาร</a>
    </div>
  `;
  
  // Send email to both requester and assigned developer if present
  const recipients = [cr.requesterEmail];
  if (cr.assignedEmail && cr.assignedEmail !== cr.requesterEmail) {
    recipients.push(cr.assignedEmail);
  }
  
  return Promise.all(recipients.map(email => 
    sendStatusEmail(email, subject, getEmailBaseLayout(subject, content))
  ));
}

// 3. Email: New Comment Added
export function sendCRCommentEmail(cr: ChangeRequest, commenterName: string, commentContent: string, systemUrl: string) {
  const subject = `[ความคิดเห็นใหม่] เอกสาร CR ${cr.crNumber} มีการเขียนความเห็นเพิ่มเติม`;
  
  const content = `
    <h2 style="margin-top:0; color:#0f172a;">มีความคิดเห็นเพิ่มเติมในเอกสาร Change Request</h2>
    <p>สวัสดีผู้เกี่ยวข้อง,</p>
    <p><strong>${commenterName}</strong> ได้ระบุความคิดเห็น/ข้อมูลเพิ่มเติมในเอกสาร <strong>${cr.crNumber}: ${cr.title}</strong> ดังนี้:</p>
    
    <div class="comment-box">
      "${commentContent}"
    </div>
    
    <table class="detail-table">
      <tr>
        <th>เลขที่ CR</th>
        <td><strong>${cr.crNumber}</strong></td>
      </tr>
      <tr>
        <th>สถานะปัจจุบัน</th>
        <td><span class="badge" style="background-color:${statusColors[cr.status]}">${statusTh[cr.status]}</span></td>
      </tr>
    </table>
    
    <div style="text-align: center;">
      <a href="${systemUrl}" class="btn">ตอบกลับความคิดเห็นในระบบ</a>
    </div>
  `;
  
  const recipients = [cr.requesterEmail];
  if (cr.assignedEmail && cr.assignedEmail !== cr.requesterEmail) {
    recipients.push(cr.assignedEmail);
  }
  
  return Promise.all(recipients.map(email => 
    sendStatusEmail(email, subject, getEmailBaseLayout(subject, content))
  ));
}
