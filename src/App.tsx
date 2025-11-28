import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, signOut, 
  onAuthStateChanged, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, updateProfile 
} from 'firebase/auth';
import { 
  School, Calendar, Users, LogOut, PlusCircle, Trash2, 
  CreditCard, CheckCircle, Menu, X, Upload, FileText, 
  Download, Lock, Folder, LayoutDashboard, ChevronRight,
  Phone, Mail, Globe, Search, Bell, Home, ChevronDown,
  Eye, DollarSign, Printer, Shield, Key
} from 'lucide-react';

const CONFIG = {
  name: "CENTRAL INSTITUTE OF PETROCHEMICALS ENGINEERING & TECHNOLOGY",
  campus: "CIPET : IPT - AHMEDABAD",
  ministry: "Department of Chemicals & Petrochemicals, Ministry of Chemicals & Fertilizers, Govt. of India",
  contact: "+91-79-40103903",
  email: "ahmedabad@cipet.gov.in",
  branches: ["STC", "PGT-PPT", "DIPLOMA", "BE", "ME", "MSC", "OTHER"],
  currency: "₹"
};

// --- API SIMULATION LAYER ---
const api = async (endpoint: string, method='GET', body?:any) => {
  // Simulate Network Delay
  await new Promise(r => setTimeout(r, 600));

  // DATA STORE (Browser Storage)
  const get = (k:string) => JSON.parse(localStorage.getItem(k)||'[]');
  const set = (k:string,v:any) => localStorage.setItem(k, JSON.stringify(v));

  // --- MOCK LOGIC ---
  if(endpoint === '/events' && method === 'GET') return get('c_ev').sort((a:any,b:any)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  if(endpoint === '/events' && method === 'POST') { const n={...body, id:crypto.randomUUID(), created_at:Date.now()}; set('c_ev',[n,...get('c_ev')]); return n; }
  if(endpoint.includes('/reports/')) return get('c_reg').filter((r:any) => r.eventId === endpoint.split('/').pop());
  if(endpoint === '/register') { set('c_reg', [...get('c_reg'), {...body, id:crypto.randomUUID()}]); return {success:true}; }
  
  // --- ADMIN SECURITY MOCK ---
  if(endpoint === '/admin/request-otp') {
    // In real app, this sends email. Here, we simulate it.
    if(body.key === 'CIPET_ADMIN') return { success: true, debug_otp: '123456' }; 
    return { error: 'Invalid Faculty Key' };
  }
  if(endpoint === '/admin/verify-otp') {
    return body.code === '123456' ? { success: true } : { error: 'Invalid OTP' };
  }

  return null;
};

// --- FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- COMPONENTS ---

const Header = ({ setPage }: any) => (
  <>
    <div className="bg-[#2c3e50] text-white text-[11px] py-1 px-4 hidden md:flex justify-between items-center">
      <div className="flex gap-4 opacity-90 tracking-wide"><span>GOVERNMENT OF INDIA</span><span>MINISTRY OF CHEMICALS & FERTILIZERS</span></div>
      <div className="flex gap-4">
        <span className="flex items-center gap-1 hover:text-yellow-400 cursor-pointer"><Phone className="w-3 h-3"/> {CONFIG.contact}</span>
        <span className="flex items-center gap-1 hover:text-yellow-400 cursor-pointer"><Mail className="w-3 h-3"/> {CONFIG.email}</span>
      </div>
    </div>
    <div className="bg-white py-3 px-4 border-b-4 border-[#f39c12] shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setPage('home')}>
          <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center rounded"><School className="w-10 h-10 text-[#005b9f]" /></div>
          <div className="hidden md:block">
            <h2 className="text-[#005b9f] font-bold text-sm tracking-wide">{CONFIG.name}</h2>
            <h1 className="text-[#d35400] font-bold text-2xl">{CONFIG.campus}</h1>
          </div>
        </div>
        <div className="flex gap-3 text-[9px] font-bold text-center">
           <div className="h-12 w-12 bg-gray-100 rounded-full border flex items-center justify-center">Emblem</div>
           <div className="h-12 w-12 bg-gray-100 rounded-full border flex items-center justify-center">Swachh</div>
        </div>
      </div>
    </div>
  </>
);

const Navbar = ({ setPage, active }: any) => {
  const btn = (id: string, label: string) => (
    <button onClick={() => setPage(id)} className={`px-5 py-3 text-sm font-bold border-r border-[#004a80] hover:bg-[#004a80] transition-colors ${active===id ? 'bg-[#d35400] border-[#d35400]' : ''}`}>{label}</button>
  );
  return (
    <div className="bg-[#005b9f] text-white sticky top-0 z-40 shadow-xl overflow-x-auto">
      <div className="max-w-7xl mx-auto flex whitespace-nowrap">
        {btn('home', 'HOME')}{btn('about', 'ABOUT US')}{btn('academics', 'ACADEMICS')}{btn('notices', 'NOTICES & TENDERS')}{btn('student', 'STUDENT CORNER')}{btn('contact', 'CONTACT')}
      </div>
    </div>
  );
};

// --- AUTH MODAL ---
const AuthModal = ({ onClose, onSuccess }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', pass: '', name: '' });
  const [error, setError] = useState('');

  const handleAuth = async (e:any) => {
    e.preventDefault(); setError('');
    try {
      if(isLogin) await signInWithEmailAndPassword(auth, form.email, form.pass);
      else { const res = await createUserWithEmailAndPassword(auth, form.email, form.pass); await updateProfile(res.user, { displayName: form.name }); }
      onSuccess();
    } catch(e:any) { setError(e.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded shadow-lg overflow-hidden">
        <div className="flex border-b text-sm font-bold">
          <button onClick={()=>setIsLogin(true)} className={`flex-1 py-3 ${isLogin?'bg-[#005b9f] text-white':'bg-gray-50'}`}>LOGIN</button>
          <button onClick={()=>setIsLogin(false)} className={`flex-1 py-3 ${!isLogin?'bg-[#005b9f] text-white':'bg-gray-50'}`}>REGISTER</button>
        </div>
        <div className="p-6">
          <button onClick={() => signInWithPopup(auth, googleProvider).then(onSuccess)} className="w-full border py-2 rounded flex items-center justify-center gap-2 mb-4 hover:bg-gray-50 text-sm font-bold text-gray-700"><Globe className="w-4 h-4 text-blue-600"/> Google Login</button>
          <div className="relative text-center mb-4"><span className="bg-white px-2 text-xs text-gray-400 relative z-10">OR EMAIL</span><div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div></div>
          <form onSubmit={handleAuth} className="space-y-3">
            {!isLogin && <input required placeholder="Full Name" className="w-full border p-2 rounded text-sm" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>}
            <input required type="email" placeholder="Email" className="w-full border p-2 rounded text-sm" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <input required type="password" placeholder="Password" className="w-full border p-2 rounded text-sm" value={form.pass} onChange={e=>setForm({...form,pass:e.target.value})}/>
            {error && <div className="text-red-500 text-xs">{error}</div>}
            <button className="w-full bg-[#d35400] text-white font-bold py-2 rounded shadow hover:bg-[#a04000]">{isLogin?'Enter Portal':'Create Account'}</button>
          </form>
          <button onClick={onClose} className="mt-4 w-full text-xs text-gray-400 hover:underline">Close</button>
        </div>
      </div>
    </div>
  );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard = ({ events, setEvents }: any) => {
  const [view, setView] = useState('publish');
  const [form, setForm] = useState({ title: '', desc: '', date: '', type: 'Notice', price: 0 });
  const [reports, setReports] = useState<any[]>([]);
  const [selectedEv, setSelectedEv] = useState<any>(null);

  const publish = async () => {
    if(!form.title) return alert("Title Required");
    const ev = await api('/events', 'POST', form);
    setEvents([ev, ...events]);
    alert("Published!");
    setForm({ title: '', desc: '', date: '', type: 'Notice', price: 0 });
  };

  const loadReport = async (ev:any) => {
    setSelectedEv(ev);
    const data = await api(`/reports/${ev.id}`);
    setReports(data);
    setView('detail');
  };

  return (
    <div className="bg-white border rounded shadow min-h-[500px] flex flex-col">
      <div className="flex border-b bg-gray-50 font-bold text-sm">
        <button onClick={()=>setView('publish')} className={`px-6 py-3 border-r ${view==='publish'?'bg-[#005b9f] text-white':''}`}>Publish</button>
        <button onClick={()=>setView('reports')} className={`px-6 py-3 border-r ${view.includes('report')?'bg-[#005b9f] text-white':''}`}>Reports</button>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        {view === 'publish' && (
          <div className="max-w-xl space-y-4">
            <h3 className="text-[#005b9f] font-bold border-b pb-2">New Circular / Event</h3>
            <input className="w-full border p-2 rounded text-sm" placeholder="Subject / Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            <div className="grid grid-cols-2 gap-4">
              <select className="border p-2 rounded text-sm" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Notice','Event','Workshop','Tender'].map(t=><option key={t}>{t}</option>)}</select>
              <input type="number" className="border p-2 rounded text-sm" placeholder="Fee (₹)" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})}/>
            </div>
            <input type="date" className="w-full border p-2 rounded text-sm" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            <button onClick={publish} className="w-full bg-[#005b9f] text-white py-2 rounded font-bold">Publish to Website</button>
          </div>
        )}
        {view === 'reports' && (
          <div className="space-y-2">
            <h3 className="text-gray-700 font-bold mb-4">Select Event</h3>
            {events.map((e:any) => (
              <div key={e.id} className="flex justify-between p-3 border rounded hover:bg-gray-50 items-center">
                <span className="text-sm font-bold text-[#005b9f]">{e.title}</span>
                <button onClick={()=>loadReport(e)} className="bg-green-600 text-white text-xs px-3 py-1 rounded font-bold">View Data</button>
              </div>
            ))}
          </div>
        )}
        {view === 'detail' && (
          <div>
            <button onClick={()=>setView('reports')} className="text-xs text-blue-600 hover:underline mb-4">← Back</button>
            <h3 className="font-bold text-lg mb-4">{selectedEv.title}</h3>
            <table className="w-full text-xs text-left border"><thead className="bg-gray-100 font-bold"><tr><th className="p-2">Name</th><th className="p-2">Status</th><th className="p-2">Amount</th></tr></thead><tbody>{reports.map((r:any) => (<tr key={r.id} className="border-b"><td className="p-2">{r.userName}</td><td className="p-2">{r.status}</td><td className="p-2">{r.amount}</td></tr>))}</tbody></table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('student');
  const [page, setPage] = useState('home');
  const [events, setEvents] = useState<any[]>([]);
  const [modals, setModals] = useState({ auth: false, verify: false, pay: null as any });

  useEffect(() => {
    api('/events').then(setEvents);
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if(u) setRole(localStorage.getItem(`role_${u.uid}`) || 'student');
    });
  }, []);

  const handleRegister = async () => {
    if(!modals.pay) return;
    await api('/register', 'POST', {
      eventId: modals.pay.id, userId: user.uid, userName: user.displayName, userEmail: user.email,
      amount: modals.pay.price, status: modals.pay.price > 0 ? 'paid' : 'registered'
    });
    setModals({...modals, pay: null});
    alert("Registration Successful!");
  };

  const requestAdmin = async (key: string) => {
    const res = await api('/admin/request-otp', 'POST', { uid: user.uid, key });
    if(res.success) alert(`OTP Sent (Demo: ${res.debug_otp})`);
    else alert("Invalid Key");
  };

  const verifyAdmin = async (code: string) => {
    const res = await api('/admin/verify-otp', 'POST', { uid: user.uid, code });
    if(res.success) { localStorage.setItem(`role_${user.uid}`, 'admin'); setRole('admin'); setModals({...modals, verify: false}); alert("Success!"); } 
    else alert("Invalid OTP");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
      <Header setPage={setPage} />
      <Navbar setPage={setPage} active={page} />

      {page === 'home' && (
        <div className="flex-1">
          <div className="bg-gray-300 h-[350px] relative overflow-hidden flex items-center justify-center">
            <div className="text-center text-white px-4 z-10">
              <h2 className="text-4xl font-bold mb-2 text-shadow">CIPET : IPT AHMEDABAD</h2>
              <p className="text-lg">Excellence in Polymer Technology & Education</p>
            </div>
            <div className="absolute inset-0 bg-[#002147] opacity-80"></div>
          </div>
          <div className="bg-[#004a80] text-white h-10 flex items-center shadow-inner overflow-hidden">
            <div className="bg-[#d35400] h-full px-4 flex items-center font-bold text-xs z-10">NEWS</div>
            <div className="flex-1 relative h-full"><div className="absolute top-2 w-full whitespace-nowrap animate-marquee text-sm font-medium">{events.length?events.map(e=>` || ${e.title} `):" || Admissions Open 2025 || "}</div></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
            <div className="bg-white border-t-4 border-[#005b9f] shadow p-6 text-center">
              <h3 className="font-bold text-[#005b9f] border-b pb-2 mb-4">Quick Access</h3>
              <p className="text-sm text-gray-500 mb-4">Access dashboard for notices and payments.</p>
              <button onClick={()=>setPage('student')} className="w-full bg-[#005b9f] text-white py-2 rounded font-bold text-sm">Go to Student Corner</button>
            </div>
            <div className="md:col-span-2 bg-white border-t-4 border-[#d35400] shadow p-6">
              <h3 className="font-bold text-[#d35400] border-b pb-2 mb-4 flex justify-between"><span>Notices & Events</span><button onClick={()=>setPage('notices')} className="text-[10px] bg-[#d35400] text-white px-2 rounded">VIEW ALL</button></h3>
              <div className="divide-y">{events.slice(0,4).map((e:any) => (<div key={e.id} className="py-3 flex gap-3"><div className="bg-gray-100 p-2 text-center rounded min-w-[50px]"><div className="text-xs font-bold text-gray-500">{new Date(e.date).getDate()}</div></div><div><div className="text-sm font-bold text-[#005b9f]">{e.title}</div></div></div>))}</div>
            </div>
          </div>
        </div>
      )}

      {page === 'student' && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          {!user ? (
            <div className="flex justify-center py-20"><div className="bg-white p-8 rounded shadow text-center max-w-md w-full"><h3 className="font-bold mb-4 text-[#005b9f]">Student / Faculty Portal</h3><button onClick={()=>setModals({...modals, auth:true})} className="w-full bg-[#005b9f] text-white px-6 py-2 rounded font-bold">Login / Sign Up</button></div></div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white border rounded shadow p-4 mb-4">
                  <h3 className="font-bold text-[#005b9f] border-b pb-2 mb-2">Profile</h3>
                  <div className="text-sm font-medium">{user.displayName}</div>
                  <div className="text-xs text-gray-500 break-all">{user.email}</div>
                  <div className="mt-2 text-[10px] bg-orange-100 inline-block px-2 py-0.5 rounded font-bold">{role.toUpperCase()}</div>
                  {role === 'student' && <button onClick={()=>setModals({...modals, verify:true})} className="mt-4 w-full border text-xs py-1 hover:bg-gray-50 flex items-center justify-center gap-1"><Shield className="w-3 h-3"/> Faculty Access</button>}
                </div>
                <div className="bg-white border rounded shadow overflow-hidden text-sm font-medium text-gray-600"><button onClick={()=>signOut(auth)} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-500 border-t">Sign Out</button></div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{role==='admin' ? 'Admin Control' : 'Student Dashboard'}</h2>
                {role==='admin' ? <AdminDashboard events={events} setEvents={setEvents} /> : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded shadow border-l-4 border-green-500"><div className="text-xs font-bold text-gray-400 uppercase">Attendance</div><div className="text-3xl font-bold text-green-600 mt-1">89%</div></div>
                    <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500 cursor-pointer" onClick={()=>setPage('notices')}><div className="text-xs font-bold text-gray-400 uppercase">Active Notices</div><div className="text-3xl font-bold text-blue-600 mt-1">{events.length}</div></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {page === 'notices' && (
        <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
          <h2 className="text-2xl font-bold text-[#005b9f] mb-6 border-b pb-2">Notices Board</h2>
          <div className="bg-white border rounded shadow overflow-hidden">
            <div className="bg-gray-100 p-3 border-b grid grid-cols-12 text-xs font-bold text-gray-600 uppercase gap-4"><div className="col-span-2">Date</div><div className="col-span-6">Subject</div><div className="col-span-2">Type</div><div className="col-span-2 text-right">Action</div></div>
            {events.map((e:any) => (
              <div key={e.id} className="p-4 border-b hover:bg-blue-50 grid grid-cols-12 items-center text-sm gap-4">
                <div className="col-span-2 text-xs font-bold text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
                <div className="col-span-6 font-bold text-[#005b9f]">{e.title}</div>
                <div className="col-span-2"><span className="bg-gray-100 text-xs px-2 py-1 rounded">{e.type}</span></div>
                <div className="col-span-2 text-right">
                  <button onClick={()=>user?setModals({...modals, pay:e}):setModals({...modals, auth:true})} className={`text-white text-xs px-3 py-1 rounded font-bold ${e.price>0?'bg-[#d35400]':'bg-green-600'}`}>{e.price > 0 ? `Pay ₹${e.price}` : 'Register'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="bg-[#003366] text-white py-4 mt-auto text-center text-sm"><p>© 2024 {CONFIG.name}.</p></footer>

      {modals.auth && <AuthModal onClose={()=>setModals({...modals,auth:false})} onSuccess={()=>{setModals({...modals,auth:false});}} />}
      
      {modals.verify && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm rounded p-6 shadow-lg">
            <h3 className="font-bold text-[#005b9f] mb-4">Faculty Verification</h3>
            <div className="space-y-4">
              <input id="key_in" placeholder="Faculty Key (Demo: CIPET_ADMIN)" className="w-full border p-2 text-sm" />
              <button onClick={() => { 
                const k = (document.getElementById('key_in') as HTMLInputElement).value;
                requestAdmin(k); 
              }} className="w-full bg-[#005b9f] text-white py-2 rounded text-sm">Request OTP</button>
              
              <div className="border-t pt-4">
                <input id="otp_in" placeholder="Enter OTP" className="w-full border p-2 mb-2 text-sm" />
                <button onClick={()=>{
                  const o = (document.getElementById('otp_in') as HTMLInputElement).value;
                  verifyAdmin(o);
                }} className="w-full bg-green-600 text-white py-2 rounded text-sm">Verify & Access</button>
              </div>
            </div>
            <button onClick={()=>setModals({...modals,verify:false})} className="text-xs text-gray-400 mt-4 w-full text-center">Cancel</button>
          </div>
        </div>
      )}
      
      {modals.pay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded shadow-lg text-center max-w-sm w-full"><h3 className="font-bold mb-4">{modals.pay.title}</h3><p className="text-xl font-bold text-[#d35400] mb-4">{modals.pay.price > 0 ? `₹${modals.pay.price}` : 'Free'}</p><button onClick={handleRegister} className="w-full bg-green-600 text-white py-2 rounded font-bold">Confirm</button><button onClick={()=>setModals({...modals,pay:null})} className="mt-4 text-xs text-gray-400 underline">Cancel</button></div></div>
      )}
      <style>{`.animate-marquee { animation: marquee 20s linear infinite; } @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
    </div>
  );
}
