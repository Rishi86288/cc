import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Upload, LogOut, ChevronRight, 
  Bell, MapPin, Phone, Mail, Lock, LayoutDashboard, UserCircle, 
  Menu, Settings, Folder, Trash2, Key, CheckCircle, CreditCard, ArrowRight, ShieldAlert, Plus
} from 'lucide-react';

// --- CONFIGURATION ---
const USE_MOCK_API = false;
// Update this with your deployed Worker URL or keep /api if using proxy
const API_BASE_URL = "/api"; 

// --- SERVICE LAYER ---
const api = {
    // Google Auth Sync
    authSync: async (user: any) => {
        const res = await fetch(`${API_BASE_URL}/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                uid: user.id || crypto.randomUUID(), 
                email: user.email, 
                name: user.name,
                branch: user.branch || 'General'
            })
        });
        return res.json();
    },
    // Request Admin OTP
    requestAdminOtp: async (uid: string, key: string) => {
        // Implementation for requesting admin OTP goes here
        // This might need a dedicated endpoint in worker.ts if not covered by existing auth
        // For now, let's assume it uses the login flow or similar mechanism
        console.log("Requesting admin OTP for", uid);
        return { success: false, error: "Feature pending implementation in worker" };
    },
    // Verify OTP (for admin upgrade, etc.)
    verifyAdminOtp: async (uid: string, code: string) => {
         // Implementation for verifying admin OTP goes here
         console.log("Verifying admin OTP for", uid);
         return { success: false, error: "Feature pending implementation in worker" };
    },
    login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },
    googleLogin: async (email, name) => {
         // This seems to duplicate authSync, potentially consolidate
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
        });
        return res.json();
    },
    register: async (data) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    verifyOtp: async (email, otp) => {
        const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        return res.json();
    },
    getEvents: async () => {
        const res = await fetch(`${API_BASE_URL}/events`);
        return res.json();
    },
    createEvent: async (fd) => {
        const res = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            body: fd
        });
        return res.json();
    },
    getFiles: async () => {
        const res = await fetch(`${API_BASE_URL}/files`);
        return res.json();
    },
    uploadFile: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/files`, {
            method: 'PUT',
            body: fd
        });
        return res.json();
    },
    deleteFile: async (name) => {
        const res = await fetch(`${API_BASE_URL}/files/${name}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// --- COMPONENTS ---

const Header = ({ user, setView, logout }: any) => (
    <div className="bg-white shadow-sm border-b-4 border-[#fcb900] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
                <div className="w-10 h-10 bg-[#003366] text-white flex items-center justify-center font-bold text-xl rounded shadow-sm">C</div>
                <div><h1 className="text-xl font-extrabold text-[#003366] leading-none uppercase">CIPET : IPT</h1><p className="text-xs text-gray-600">Ahmedabad</p></div>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                <button onClick={() => setView('home')} className="hover:text-[#fcb900] transition">HOME</button>
                {user ? (
                    <div className="flex items-center gap-3 pl-4 border-l">
                        <div className="text-right hidden sm:block">
                            <p className="text-[#003366]">{user.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{user.role}</p>
                        </div>
                        <button onClick={() => setView('dashboard')} className="bg-[#003366] text-white px-3 py-1 rounded">DASHBOARD</button>
                        <button onClick={logout} className="text-red-500"><LogOut size={18}/></button>
                    </div>
                ) : <button onClick={() => setView('login')} className="text-[#003366]">LOGIN</button>}
            </div>
        </div>
    </div>
);

const Auth = ({ setView, setUser }: any) => {
    const [data, setData] = useState({ email: '', password: '', role: 'student', branch: 'STC' });
    const [mode, setMode] = useState('login');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
             if (mode === 'login') {
                if (otpSent) res = await api.verifyOtp(data.email, data.otp);
                else res = await api.login(data.email, data.password);
            } else {
                res = await api.register(data);
            }

            if (res.status === 'OTP_REQUIRED') { 
                setOtpSent(true); 
                alert("OTP sent to Super Admin email."); 
            } else if (res.user) { 
                setUser(res.user); 
                setView('dashboard'); 
                setOtpSent(false); 
            } else {
                alert(res.error || "Failed");
            }
        } catch (e) {
             alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        // Mock Google Auth Trigger - In production, use Firebase/Supabase or real OAuth
         // Logic to initiate Google OAuth would go here, followed by api.authSync or api.googleLogin
        alert("Google Login logic needs to be integrated");
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#003366] text-center">
                <h2 className="text-2xl font-bold text-[#003366] mb-6">{otpSent ? 'Security Check' : (mode === 'signup' ? 'New Registration' : 'Portal Login')}</h2>
                
                {!otpSent && (
                    <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-2.5 rounded-lg mb-6 hover:bg-gray-50 font-bold text-gray-700 text-sm shadow-sm transition">
                        <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs">G</span> 
                        {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                    </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {otpSent ? (
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-2">Enter OTP sent to your secure email</p>
                            <input className="w-full border-2 border-blue-100 p-2 rounded text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-[#003366]" onChange={e => setData({...data, otp: e.target.value})} maxLength={6} autoFocus />
                        </div>
                    ) : (
                        <>
                            {mode === 'signup' && (
                                <>
                                    <input className="w-full border p-2 rounded" placeholder="Full Name" onChange={e => setData({...data, name: e.target.value})} required />
                                    <div className="flex gap-2">
                                        <select className="w-full border p-2 rounded bg-white" onChange={e => setData({...data, branch: e.target.value})}>
                                            <option value="STC">STC</option><option value="DIPLOMA">DIPLOMA</option><option value="BE">BE</option>
                                        </select>
                                        <select className="w-full border p-2 rounded bg-white" onChange={e => setData({...data, role: e.target.value})}>
                                            <option value="student">Student</option><option value="event_admin">Admin</option>
                                        </select>
                                    </div>
                                    {(data.role === 'event_admin' || data.role === 'super_admin') && (
                                        <input type="password" placeholder="Admin Secret Code" className="w-full border border-red-300 p-2 rounded bg-red-50" onChange={e => setData({...data, secretCode: e.target.value})} />
                                    )}
                                </>
                            )}
                            <input className="w-full border p-2 rounded" type="email" placeholder="Email Address" onChange={e => setData({...data, email: e.target.value})} required />
                            <input className="w-full border p-2 rounded" type="password" placeholder="Password" onChange={e => setData({...data, password: e.target.value})} required />
                        </>
                    )}
                    <button className="w-full bg-[#003366] text-white py-2.5 rounded font-bold hover:bg-blue-900 transition shadow-lg mt-4">
                        {otpSent ? 'VERIFY OTP' : 'SUBMIT'}
                    </button>
                </form>
                
                {!otpSent && (
                    <div className="mt-6 text-center">
                        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-blue-600 hover:underline uppercase">
                            {mode === 'login' ? 'Create New Account' : 'Back to Login'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = ({ user, logout }: any) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [files, setFiles] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => { 
        if(activeTab === 'files') api.getFiles().then(setFiles); 
    }, [activeTab]);

    const handleUpload = async (e: any) => {
        if(e.target.files[0]) { await api.uploadFile(e.target.files[0]); api.getFiles().then(setFiles); }
    };

    const handleCreate = async (e: any) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('isPaid', e.target.isPaid.checked);
        fd.append('userEmail', user.email);
        await api.createEvent(fd);
        alert("Event Published!");
        setShowCreate(false);
    };

    const handleUpgrade = () => {
         // Placeholder for upgrade logic
         alert("Upgrade request feature pending implementation");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-[60vh]">
            <div className="w-full md:w-64 bg-white rounded shadow h-fit pb-4 border border-gray-200">
                <div className="p-6 bg-[#003366] text-center text-white mb-2">
                    <div className="w-16 h-16 bg-white text-[#003366] rounded-full mx-auto flex items-center justify-center font-bold text-2xl mb-2">{user.name[0]}</div>
                    <h3 className="font-bold truncate">{user.name}</h3>
                    <p className="text-xs uppercase opacity-75">{user.role.replace('_',' ')}</p>
                </div>
                <nav className="px-2 space-y-1">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='overview'?'bg-blue-50 text-[#003366]':'text-gray-600'}`}><LayoutDashboard size={16}/> Overview</button>
                    {(user.role === 'super_admin' || user.role === 'event_admin') && (
                        <button onClick={() => setActiveTab('events')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='events'?'bg-blue-50 text-[#003366]':'text-gray-600'}`}><Calendar size={16}/> Manage Events</button>
                    )}
                    {(user.role === 'super_admin') && (
                        <button onClick={() => setActiveTab('files')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='files'?'bg-blue-50 text-[#003366]':'text-gray-600'}`}><Folder size={16}/> File Manager</button>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-red-600 hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
                </nav>
            </div>

            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Dashboard</h2>
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded shadow border-l-4 border-[#003366]">
                            <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                            <p className="text-2xl font-bold text-[#003366]">Active</p>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="bg-white rounded shadow overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <h3 className="font-bold">Cloud Files</h3>
                            <label className="bg-[#003366] text-white px-3 py-1 rounded text-xs cursor-pointer flex gap-1 items-center"><Upload size={14}/> Upload <input type="file" className="hidden" onChange={handleUpload}/></label>
                        </div>
                        {files.map((f: any, i) => (
                            <div key={i} className="p-3 border-b text-sm flex justify-between">
                                <span className="flex gap-2"><FileText size={16}/> {f.name}</span>
                                <span className="text-gray-500">{f.size}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'events' && (
                    <>
                         <button onClick={() => setShowCreate(!showCreate)} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold mb-4 flex gap-2 items-center">
                            <Plus size={16}/> New Event
                        </button>
                         {showCreate && (
                            <div className="bg-white p-6 rounded shadow border mt-4">
                                <h3 className="font-bold text-lg mb-4 text-[#003366]">Post New Event</h3>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <input name="title" className="w-full border p-2 rounded text-sm" placeholder="Title" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="date" type="date" className="w-full border p-2 rounded text-sm" required />
                                        <input name="fee" type="number" className="w-full border p-2 rounded text-sm" placeholder="Fee (₹)" />
                                    </div>
                                    <textarea name="desc" className="w-full border p-2 rounded text-sm" placeholder="Description..."></textarea>
                                    <div className="flex gap-4 items-center">
                                        <label className="flex gap-2 text-sm"><input type="checkbox" name="isPaid" /> Paid Event?</label>
                                        <input type="file" name="attachment" className="text-xs"/>
                                    </div>
                                    <button className="bg-[#003366] text-white px-4 py-2 rounded text-sm font-bold">Publish Event</button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const App = () => {
    const [view, setView] = useState('home');
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => { 
        api.getEvents().then(data => {
            if (Array.isArray(data)) setEvents(data);
        }).catch(() => setEvents([]));
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#f4f7f6]">
            <Header user={user} setView={setView} logout={() => setUser(null)} />
            {view === 'home' && (
                <div className="flex-grow max-w-7xl mx-auto px-4 py-12">
                   <h1 className="text-4xl font-bold text-center mb-12 text-[#003366]">Upcoming Events</h1>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {events.map((ev: any) => (
                           <div key={ev.id} className="bg-white p-6 rounded shadow border-l-4 border-[#003366]">
                               <h3 className="font-bold text-lg">{ev.title}</h3>
                               <p className="text-sm text-gray-500">{ev.description}</p>
                           </div>
                       ))}
                   </div>
                </div>
            )}
            {view === 'login' && <Auth setView={setView} setUser={setUser} />}
            {view === 'dashboard' && user && <Dashboard user={user} logout={() => setUser(null)} />}
            <footer className="bg-[#003366] text-white py-6 text-center text-sm mt-auto">© 2025 CIPET IPT Ahmedabad</footer>
        </div>
    );
};

export default App;
