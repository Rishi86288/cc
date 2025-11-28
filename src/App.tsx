import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Upload, LogOut, ChevronRight, 
  Bell, MapPin, Phone, Mail, Lock, LayoutDashboard, UserCircle, 
  Menu, Settings, Folder, File, Trash2, Key, CheckCircle, CreditCard, ArrowRight, ShieldAlert, Plus
} from 'lucide-react';

// --- CONFIGURATION ---
const USE_MOCK_API = false; // Set to FALSE for production
const API_BASE_URL = "/api"; // Relative path for Cloudflare Pages Functions

// --- SERVICE LAYER ---
const api = {
    login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },
    googleLogin: async (email, name) => {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
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
    register: async (data) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
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

const Header = ({ user, setView, logout }) => (
    <div className="bg-white shadow-sm border-b-4 border-[#fcb900] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
                <div className="w-10 h-10 bg-[#003366] text-white flex items-center justify-center font-bold text-xl rounded shadow-sm">C</div>
                <div>
                    <h1 className="text-xl font-extrabold text-[#003366] leading-none uppercase">CIPET : IPT</h1>
                    <p className="text-xs text-gray-600 font-semibold">Ahmedabad</p>
                </div>
            </div>
            <div className="flex items-center gap-6 text-sm font-bold text-gray-700">
                <button onClick={() => setView('home')} className="hover:text-[#fcb900] transition">HOME</button>
                {user ? (
                    <div className="flex items-center gap-3 pl-4 border-l">
                        <div className="text-right hidden sm:block">
                            <p className="text-[#003366]">{user.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{user.role}</p>
                        </div>
                        <button onClick={() => setView('dashboard')} className="bg-[#003366] text-white px-3 py-1 rounded">DASHBOARD</button>
                        <button onClick={logout} className="text-red-500 hover:text-red-700"><LogOut size={18}/></button>
                    </div>
                ) : (
                    <button onClick={() => setView('login')} className="text-[#003366]">LOGIN</button>
                )}
            </div>
        </div>
    </div>
);

const Auth = ({ mode, setView, onAuth, otpSent }) => {
    const [data, setData] = useState({ email: '', password: '', role: 'student', branch: 'STC' });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onAuth(mode, data);
    };

    const handleGoogle = () => {
        // Mock Google Auth Trigger - In production, use Firebase/Supabase or real OAuth
        onAuth('google', { email: 'googleuser@gmail.com', name: 'Google User' });
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#003366]">
                <h2 className="text-2xl font-bold text-[#003366] text-center mb-6">
                    {otpSent ? 'Security Check' : (mode === 'signup' ? 'New Registration' : 'Portal Login')}
                </h2>

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
                        <button onClick={() => setView(mode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-blue-600 hover:underline uppercase">
                            {mode === 'login' ? 'Create New Account' : 'Back to Login'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard = ({ user, logout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [files, setFiles] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => { 
        if(activeTab === 'files') api.getFiles().then(setFiles); 
    }, [activeTab]);

    const handleUpload = async (e) => {
        if(e.target.files[0]) { await api.uploadFile(e.target.files[0]); api.getFiles().then(setFiles); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('isPaid', e.target.isPaid.checked);
        fd.append('userEmail', user.email);
        await api.createEvent(fd);
        alert("Event Published!");
        setShowCreate(false);
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
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h2 className="text-2xl font-bold text-gray-800">{activeTab === 'overview' ? 'Dashboard' : 'Management'}</h2>
                    {activeTab === 'events' && (
                        <button onClick={() => setShowCreate(true)} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold text-sm shadow flex items-center gap-2 hover:bg-yellow-400">
                            <Plus size={16}/> New Event
                        </button>
                    )}
                </div>

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
                        {files.map((f, i) => (
                            <div key={i} className="p-3 border-b text-sm flex justify-between">
                                <span className="flex gap-2"><FileText size={16}/> {f.name}</span>
                                <span className="text-gray-500">{f.size}</span>
                            </div>
                        ))}
                    </div>
                )}

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
            </div>
        </div>
    );
};

const App = () => {
    const [view, setView] = useState('home');
    const [user, setUser] = useState(null);
    const [otpSent, setOtpSent] = useState(false);
    const [events, setEvents] = useState([]);

    useEffect(() => { 
        api.getEvents().then(data => {
            if (Array.isArray(data)) setEvents(data);
        }).catch(() => setEvents([]));
    }, []);

    const handleAuth = async (mode, data) => {
        try {
            let res;
            if (mode === 'google') res = await api.googleLogin(data.email, data.name);
            else if (mode === 'login') {
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
        } catch(e) { alert(e.message); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f4f7f6]">
            <Header user={user} setView={setView} logout={() => setUser(null)} />
            
            {view === 'home' && (
                <div className="flex-grow">
                    <div className="relative h-[300px] bg-[#003366] flex items-center justify-center">
                        <div className="text-center text-white z-10 p-4">
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-2 uppercase">CIPET : IPT - Ahmedabad</h2>
                            <p className="text-yellow-400 font-bold uppercase tracking-wider">Department of Chemicals & Petrochemicals, Govt. of India</p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded shadow border-t-4 border-[#003366]">
                                <h3 className="text-xl font-bold text-[#003366] border-b pb-2 mb-4 flex items-center gap-2">
                                    <Calendar className="text-[#fcb900]"/> Upcoming Events
                                </h3>
                                <div className="space-y-4">
                                    {events.length > 0 ? events.map((ev) => (
                                        <div key={ev.id} className="flex gap-4 border-b pb-4 hover:bg-gray-50 p-2 transition">
                                            <div className="bg-[#003366] text-white text-center px-4 py-2 rounded min-w-[70px]">
                                                <div className="text-xl font-bold">{ev.date ? ev.date.split('-')[2] : '15'}</div>
                                                <div className="text-[10px] uppercase font-bold text-yellow-400">OCT</div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{ev.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{ev.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] bg-gray-200 px-2 rounded font-bold uppercase">{ev.branch}</span>
                                                    <span className={`text-[10px] px-2 rounded font-bold uppercase ${ev.is_paid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{ev.is_paid ? `FEES: ₹${ev.fee}` : 'FREE'}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => !user ? setView('login') : alert('Registered!')} className="self-center border border-[#003366] text-[#003366] text-xs font-bold px-3 py-1 rounded hover:bg-[#003366] hover:text-white transition">
                                                {ev.is_paid ? 'PAY' : 'REGISTER'}
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="text-center text-gray-500 py-4">No upcoming events found.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(view === 'login' || view === 'signup') && <Auth mode={view} setView={setView} onAuth={handleAuth} otpSent={otpSent} />}
            {view === 'dashboard' && user && <Dashboard user={user} logout={() => setUser(null)} />}
            
            <footer className="bg-[#003366] text-white py-6 text-center text-sm border-t-8 border-[#fcb900] mt-auto">
                © 2025 CIPET IPT Ahmedabad. All Rights Reserved.
            </footer>
        </div>
    );
};

export default App;
