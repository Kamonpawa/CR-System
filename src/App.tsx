import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from './lib/firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { ChangeRequest, CRStatus, CRPriority, CRCategory, CRComment } from './types';
import Dashboard from './components/Dashboard';
import CRList from './components/CRList';
import CRForm from './components/CRForm';
import CRDetail from './components/CRDetail';
import PrintReport from './components/PrintReport';
import PrintAllReport from './components/PrintAllReport';
import { 
  sendCRCreatedEmail, 
  sendCRStatusChangedEmail, 
  sendCRCommentEmail 
} from './utils/email';
import { 
  FileText, LogOut, LayoutDashboard, Plus, ClipboardCheck, Mail, Shield, 
  Lock, RefreshCw, Layers, CheckCircle, ChevronRight, Download
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Layout tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // dashboard, list, form, detail
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [editingCR, setEditingCR] = useState<ChangeRequest | undefined>(undefined);

  // 1. Authenticate Listeners
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsLoadingData(true);
      } else {
        setChangeRequests([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(collection(db, 'change_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChangeRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          crNumber: data.crNumber || '',
          title: data.title || '',
          description: data.description || '',
          reason: data.reason || '',
          systemName: data.systemName || '',
          category: data.category || 'bugfix',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          requesterName: data.requesterName || '',
          requesterEmail: data.requesterEmail || '',
          impactAnalysis: data.impactAnalysis || '',
          assignedTo: data.assignedTo || '',
          assignedEmail: data.assignedEmail || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
          comments: data.comments || [],
          history: data.history || [],
        });
      });
      setChangeRequests(list);
      setIsLoadingData(false);
    }, (err) => {
      console.error('Firestore reading error:', err);
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      setIsAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Authentication Error:', err);
      alert('การเข้าสู่ระบบผ่าน Google Account ล้มเหลว โปรดตรวจสอบสิทธิ์การตั้งค่า iFrame หรือเครือข่าย');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบบริหารงาน Change Request ใช่หรือไม่?')) {
      await signOut(auth);
      setSelectedCR(null);
      setEditingCR(undefined);
      setActiveTab('dashboard');
    }
  };

  // Submit/Draft CR Form Handler
  const handleFormSubmit = async (
    crData: Omit<ChangeRequest, 'id' | 'crNumber' | 'createdAt' | 'updatedAt' | 'comments' | 'history'>,
    shouldSendEmail: boolean
  ) => {
    if (!currentUser) return;

    try {
      const timestamp = new Date().toISOString();
      
      if (editingCR) {
        // Mode A: EDITING
        const docRef = doc(db, 'change_requests', editingCR.id);
        
        const newHistory = [
          ...editingCR.history,
          {
            id: String(editingCR.history.length + 1),
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email || 'Staff',
            action: 'edit',
            details: `แก้ไขเนื้อหาในเอกสาร - หมวดหมู่: ${crData.category}, ระดับด่วน: ${crData.priority}`,
            createdAt: timestamp
          }
        ];

        const updatedObject = {
          ...crData,
          updatedAt: timestamp,
          history: newHistory
        };

        await updateDoc(docRef, updatedObject);
        alert('ปรับปรุงข้อมูลเอกสาร Change Request สำเร็จ!');
        
        // Find the newly updated cr object to reflect in detail view
        const newRef = { ...editingCR, ...updatedObject };
        setSelectedCR(newRef);
        setEditingCR(undefined);
        setActiveTab('detail');
      } else {
        // Mode B: CREATING NEW CR
        // 1. Determine CR serial code (format: CR-YYYY-XXXX)
        const year = new Date().getFullYear();
        const prefix = `CR-${year}-`;
        
        // Count existing elements with same prefix to get sequential number
        const count = changeRequests.filter(c => c.crNumber.startsWith(prefix)).length;
        const serialStr = String(count + 1).padStart(4, '0');
        const crNumber = `${prefix}${serialStr}`;

        const docPayload: Omit<ChangeRequest, 'id'> = {
          ...crData,
          crNumber,
          createdAt: timestamp,
          updatedAt: timestamp,
          comments: [],
          history: [
            {
              id: '1',
              userId: currentUser.uid,
              userName: currentUser.displayName || currentUser.email || 'Requester',
              action: 'create',
              details: 'ยื่นคำร้องเสนอ Change Request เข้าสู่ระบบ รอการพิจารณาตรวจสอบ',
              createdAt: timestamp
            }
          ]
        };

        const docRef = await addDoc(collection(db, 'change_requests'), docPayload);
        const fullNewCR: ChangeRequest = { id: docRef.id, ...docPayload };

        if (shouldSendEmail) {
          // Fire automatic email trigger asynchronously
          sendCRCreatedEmail(fullNewCR, window.location.origin).catch(e => {
            console.error('Trigger mail dispatch error:', e);
          });
        }

        alert(`สร้างใบเอกสาร ${crNumber} สำเร็จ และจัดส่งอีเมลแจ้งทีมงานแล้ว!`);
        setActiveTab('list');
      }
    } catch (err) {
      console.error('Error writing CR to database:', err);
      alert('ไม่สามารถจัดเก็บข้อมูลลงในระบบได้ โปรดตรวจสอบสิทธิ์เชื่อมต่อเครือข่าย');
    }
  };

  // Status Change handler
  const handleUpdateStatus = async (crId: string, newStatus: CRStatus, updaterName: string, actionDetails: string) => {
    if (!currentUser) return;
    try {
      const crObj = changeRequests.find(c => c.id === crId);
      if (!crObj) return;

      const timestamp = new Date().toISOString();
      const oldStatus = crObj.status;

      const newHistory = [
        ...crObj.history,
        {
          id: String(crObj.history.length + 1),
          userId: currentUser.uid,
          userName: updaterName,
          action: 'status_changed',
          details: actionDetails,
          createdAt: timestamp
        }
      ];

      const docRef = doc(db, 'change_requests', crId);
      const updatedObject = {
        status: newStatus,
        updatedAt: timestamp,
        history: newHistory
      };

      await updateDoc(docRef, updatedObject);

      // Trigger automatic status update email notification
      const fullyUpdatedCR = { ...crObj, ...updatedObject };
      setSelectedCR(fullyUpdatedCR);
      
      sendCRStatusChangedEmail(fullyUpdatedCR, oldStatus, updaterName, window.location.origin).catch(e => {
        console.error('Mail trigger failed:', e);
      });
    } catch (err) {
      console.error('Update status failed:', err);
      alert('ไม่สามารถอัปเดตสถานะการอนุมัติงานได้ในขณะนี้');
    }
  };

  // Assign Developer Handler
  const handleAssignDeveloper = async (crId: string, devName: string, devEmail: string, updaterName: string) => {
    if (!currentUser) return;
    try {
      const crObj = changeRequests.find(c => c.id === crId);
      if (!crObj) return;

      const timestamp = new Date().toISOString();
      const newHistory = [
        ...crObj.history,
        {
          id: String(crObj.history.length + 1),
          userId: currentUser.uid,
          userName: updaterName,
          action: 'assigned',
          details: `มอบหมายวิศวกรผู้ดูแลแก้ไข: คุณ ${devName} (${devEmail})`,
          createdAt: timestamp
        }
      ];

      const docRef = doc(db, 'change_requests', crId);
      const updatedObject = {
        assignedTo: devName,
        assignedEmail: devEmail,
        updatedAt: timestamp,
        history: newHistory
      };

      await updateDoc(docRef, updatedObject);

      const fullyUpdatedCR = { ...crObj, ...updatedObject };
      setSelectedCR(fullyUpdatedCR);

      // Notify the assigned engineer
      sendCRStatusChangedEmail(fullyUpdatedCR, crObj.status, updaterName, window.location.origin).catch(e => {
        console.error('Assignee notification failure:', e);
      });
    } catch (err) {
      console.error('Developer assignment failed:', err);
      alert('ไม่สามารถบันทึกข้อมูลมอบหมายงานได้');
    }
  };

  // Add Comment Handler
  const handleAddComment = async (crId: string, commenterName: string, commenterEmail: string, content: string) => {
    if (!currentUser) return;
    try {
      const crObj = changeRequests.find(c => c.id === crId);
      if (!crObj) return;

      const timestamp = new Date().toISOString();
      const newComment: CRComment = {
        id: String(Date.now()),
        userId: currentUser.uid,
        userName: commenterName,
        userEmail: commenterEmail,
        content,
        createdAt: timestamp
      };

      const newHistory = [
        ...crObj.history,
        {
          id: String(crObj.history.length + 1),
          userId: currentUser.uid,
          userName: commenterName,
          action: 'commented',
          details: `ระบุความคิดเห็นใหม่: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
          createdAt: timestamp
        }
      ];

      const docRef = doc(db, 'change_requests', crId);
      const updatedObject = {
        comments: [...crObj.comments, newComment],
        history: newHistory,
        updatedAt: timestamp
      };

      await updateDoc(docRef, updatedObject);

      const fullyUpdatedCR = { ...crObj, ...updatedObject };
      setSelectedCR(fullyUpdatedCR);

      // Trigger automatic mail alerting other members
      sendCRCommentEmail(fullyUpdatedCR, commenterName, content, window.location.origin).catch(e => {
        console.error('Failed to notify comments:', e);
      });
    } catch (err) {
      console.error('Comment adding failed:', err);
      alert('บันทึกความเห็นล้มเหลว');
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (changeRequests.length === 0) {
      alert('ไม่มีข้อมูล Change Request ในคลังสำหรับการสรุปรายงาน');
      return;
    }
    
    const headers = [
      'เลขที่เอกสาร', 'ชื่องานเสนอแก้ไข', 'ระบบงาน', 'ประเภทการแก้ไข', 
      'ความเร่งด่วน', 'สถานะปัจจุบัน', 'ชื่อผู้ร้องขอ', 'อีเมลผู้ร้องขอ', 
      'วิศวกรผู้ดูแล', 'อีเมลวิศวกร', 'รายละเอียดความต้องการ', 'เหตุผลความจำเป็น',
      'วันที่ยื่นคำขอ', 'อัปเดตล่าสุด'
    ];

    const rows = changeRequests.map(cr => [
      cr.crNumber,
      cr.title.replace(/"/g, '""'),
      cr.systemName.replace(/"/g, '""'),
      cr.category,
      cr.priority,
      cr.status,
      cr.requesterName.replace(/"/g, '""'),
      cr.requesterEmail,
      cr.assignedTo || '',
      cr.assignedEmail || '',
      cr.description.replace(/"/g, '""').replace(/\n/g, ' '),
      cr.reason.replace(/"/g, '""').replace(/\n/g, ' '),
      cr.createdAt,
      cr.updatedAt
    ]);

    // Add UTF-8 Byte Order Mark (BOM) to support Thai language correctly in MS Excel
    let csvContent = '\uFEFF'; 
    csvContent += [
      headers.join(','), 
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Change_Requests_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Screen/Tab directors
  const handleSelectCR = (cr: ChangeRequest) => {
    setSelectedCR(cr);
    setActiveTab('detail');
  };

  const handleEditCRDirectly = () => {
    if (selectedCR) {
      setEditingCR(selectedCR);
      setActiveTab('form');
    }
  };

  const renderActiveContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-sans gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-700 stroke-1" />
          <p className="text-sm font-medium">กำลังเตรียมการเชื่อมต่อฐานข้อมูลแบบเรียลไทม์...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            changeRequests={changeRequests} 
            onSelectTab={setActiveTab}
            onSelectCR={handleSelectCR}
            onExportCSV={handleExportCSV}
            onExportPDF={() => window.print()}
          />
        );
      case 'list':
        return (
          <CRList 
            changeRequests={changeRequests}
            onSelectCR={handleSelectCR}
            onAddNew={() => {
              setEditingCR(undefined);
              setActiveTab('form');
            }}
          />
        );
      case 'form':
        return (
          <CRForm
            currentUser={currentUser}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setEditingCR(undefined);
              setActiveTab(selectedCR ? 'detail' : 'list');
            }}
            editingCR={editingCR}
          />
        );
      case 'detail':
        return selectedCR ? (
          <CRDetail
            cr={selectedCR}
            currentUser={currentUser}
            onBack={() => {
              setSelectedCR(null);
              setActiveTab('list');
            }}
            onUpdateStatus={handleUpdateStatus}
            onAddComment={handleAddComment}
            onAssignDeveloper={handleAssignDeveloper}
            onEdit={handleEditCRDirectly}
          />
        ) : (
          <div className="text-center py-10 font-sans text-xs text-slate-500">
            เกิดข้อผิดพลาดในการโหลดเนื้อหาเอกสาร
          </div>
        );
      default:
        return null;
    }
  };

  // 1. Loading Frame for Auth Check
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-700 gap-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-900 stroke-1" />
        <p className="text-xs font-semibold tracking-wider">กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</p>
      </div>
    );
  }

  // 2. Unauthenticated View (Login Panel)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" id="auth-screen">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-50 rounded-full blur-3xl -z-10" />

        <div className="max-w-md w-full mx-auto space-y-8 bg-white border border-slate-200/80 p-8 sm:p-10 rounded-3xl shadow-xl relative z-10">
          <div className="text-center">
            <div className="inline-flex p-4 bg-slate-900 text-white rounded-2xl mb-4 shadow-md">
              <ClipboardCheck className="w-8 h-8 stroke-1" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              ระบบจัดการเอกสาร Change Request
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-2 max-w-sm mx-auto leading-relaxed">
              ขออนุมัติงาน อนุมัติการพิจารณาแก้ไข บันทึกสถิติมอบหมายงานวิศวกร และจัดส่งแจ้งเตือนการปฏิบัติงานผ่านทางอีเมลแบบอัตโนมัติ
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-t border-slate-100 pt-5 space-y-3 text-xs font-sans text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>ระบบลงชื่อด้วย Gmail:</strong> ลงทะเบียนร่วมกันผ่าน Google SSO ปลอดภัยและรวดเร็ว</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>แจ้งเตือนอัตโนมัติ:</strong> จัดส่งรายงานการยื่นใบคำร้องและความเห็นเพิ่มเติมเข้าอีเมลโดยตรง</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>เครื่องมือนำข้อมูลออก:</strong> รองรับการพิมพ์เอกสารใบปะหน้า PDF และรายงาน Excel ในคลิกเดียว</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                id="login-google-btn"
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.62 14.93 1 12 1 7.35 1 3.39 3.68 1.41 7.59l3.79 2.94C6.15 7.15 8.84 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58v2.98h3.89c2.28-2.1 3.56-5.19 3.56-8.71z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.2 14.47a7.2 7.2 0 0 1-.38-2.31c0-.81.14-1.59.38-2.31L1.41 6.91A11.953 11.953 0 0 0 0 12c0 1.83.41 3.57 1.41 5.09l3.79-2.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.89-2.98c-1.08.72-2.47 1.15-4.07 1.15-3.16 0-5.85-2.11-6.8-5.49L1.41 15.4C3.39 19.32 7.35 23 12 23z"
                  />
                </svg>
                เข้าสู่ระบบด้วยบัญชี Gmail (Google SSO)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Workspace Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dynamic Native Print View Containers */}
      {selectedCR && <PrintReport cr={selectedCR} />}
      <PrintAllReport changeRequests={changeRequests} />

      {/* Persistent Screen Header */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50 no-print" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-slate-800 text-indigo-400 rounded-lg border border-slate-700">
                <ClipboardCheck className="w-5 h-5 stroke-[2]" />
              </span>
              <div>
                <h1 className="text-sm font-display font-semibold tracking-wide">Change Request System</h1>
                <p className="text-[10px] text-slate-400 font-sans tracking-wide">GoogleAI002 Firestore Database</p>
              </div>
            </div>

            {/* Main Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80" id="main-navigation">
              <button
                onClick={() => {
                  setSelectedCR(null);
                  setActiveTab('dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                แผงควบคุมหลัก
              </button>
              
              <button
                id="tab-list-btn"
                onClick={() => {
                  setSelectedCR(null);
                  setActiveTab('list');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'list' || activeTab === 'detail'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                รายการใบเอกสาร CR
              </button>

              <button
                id="tab-create-btn"
                onClick={() => {
                  setEditingCR(undefined);
                  setActiveTab('form');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'form' && !editingCR
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                สร้างเอกสาร CR
              </button>
            </nav>

            {/* Profile User Panel */}
            <div className="flex items-center gap-3" id="profile-user-panel">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-100">{currentUser.displayName || currentUser.email}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
              </div>

              <button
                id="logout-btn"
                onClick={handleLogout}
                className="p-2 hover:bg-slate-800 text-slate-300 hover:text-rose-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Subheader Navigation for Mobile */}
      <div className="bg-slate-950 border-b border-slate-800 text-slate-300 py-2 px-4 flex md:hidden items-center justify-around gap-2 no-print" id="sub-header-mobile">
        <button
          onClick={() => {
            setSelectedCR(null);
            setActiveTab('dashboard');
          }}
          className={`flex-1 text-center py-1 text-[11px] font-sans font-medium transition-all ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold border-b border-indigo-500' : 'text-slate-400'
          }`}
        >
          แผงควบคุม
        </button>
        <button
          onClick={() => {
            setSelectedCR(null);
            setActiveTab('list');
          }}
          className={`flex-1 text-center py-1 text-[11px] font-sans font-medium transition-all ${
            activeTab === 'list' || activeTab === 'detail' ? 'text-indigo-400 font-bold border-b border-indigo-500' : 'text-slate-400'
          }`}
        >
          รายการใบ CR
        </button>
        <button
          onClick={() => {
            setEditingCR(undefined);
            setActiveTab('form');
          }}
          className={`flex-1 text-center py-1 text-[11px] font-sans font-medium transition-all ${
            activeTab === 'form' ? 'text-indigo-400 font-bold border-b border-indigo-500' : 'text-slate-400'
          }`}
        >
          สร้างเอกสาร CR
        </button>
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print" id="main-app-viewport">
        {renderActiveContent()}
      </main>

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-sans no-print" id="app-footer">
        <p>ระบบบริหารจัดการเอกสารคำขออนุมัติแก้ไขและเปลี่ยนแปลงรายการ Change Request (CR) | ข้อมูลจัดเก็บลงฐานข้อมูล GoogleAI002 Firestore แบบเรียลไทม์</p>
      </footer>
    </div>
  );
}
