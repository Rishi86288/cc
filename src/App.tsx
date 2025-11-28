import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Upload, LogOut, ChevronRight, 
  Bell, MapPin, Phone, Mail, Lock, LayoutDashboard, UserCircle, 
  Menu, Settings, Folder, Trash2, Key, CheckCircle, CreditCard, ArrowRight, ShieldAlert, Plus
} from 'lucide-react';

// --- CONFIGURATION ---
const USE_MOCK_API = true; // CHANGE TO FALSE for Production
const API_BASE_URL = "https://cipet-backend.yourname.workers.dev"; // Replace with your Worker URL

// --- MOCK DATA (For Demo Purposes) ---
const MOCK_DATA = {
    events: [
        { id: 1, title: "Polymer Tech Conf 2025", date: "2025-10-15", branch: "ALL", fee: 500, is_paid: true, desc: "Annual conference." },
        { id: 2, title: "Placement Workshop", date: "2025-09-20", branch: "BE", fee: 0, is_paid: false, desc: "Resume building." }
    ],
    notices: ["Exam Schedule Released", "Hostel Fee Deadline Extended"]
};

// --- SERVICE LAYER ---
const api = {
    login: async (email, password) => {
        if(USE_MOCK_API) {
            if(email === 'rr8382658@gmail.com') return { status: 'OTP_REQUIRED' };
            return { status: 'SUCCESS', user: { id: 1, name: 'Student Demo', role: 'student', branch: 'STC' }};
        }
        return fetch(`${API_BASE_URL}/api/auth/login`, { method: 'POST', body: JSON.stringify({email, password}) }).then(r=>r.json());
    },
    googleLogin: async (email, name) => {
        if(USE_MOCK_API) return { status: 'SUCCESS', user: { id: 99, name, email, role: 'student' }};
        return fetch(`${API_BASE_URL}/api/auth/google`, { method: 'POST', body: JSON.stringify({email, name}) }).then(r=>r.json());
    },
    register: async (data) => {
        if(USE_MOCK_API) return { success: true };
        return fetch(`${API_BASE_URL}/api/auth/register`, { method: 'POST', body: JSON.stringify(data) }).then(r=>r.json());
    },
    verifyOtp: async (email, otp) => {
        if(USE_MOCK_API) return otp === '123456' ? { status: 'SUCCESS', user: { id: 999, name: 'Super Admin', role: 'super_admin' } } : { error: 'Invalid OTP' };
        return fetch(`${API_BASE_URL}/api/auth/verify-otp`, { method: 'POST', body: JSON.stringify({email, otp}) }).then(r=>r.json());
    },
    getEvents: async () => {
        if(USE_MOCK_API) return MOCK_DATA.events;
        return fetch(`${API_BASE_URL}/api/events`).then(r=>r.json());
    },
    createEvent: async (fd) => {
        if(USE_MOCK_API) { MOCK_DATA.events.push({ id: Date.now(), title: fd.get('title') }); return { success: true }; }
        return fetch(`${API_BASE_URL}/api/events`, { method: 'POST', body: fd }).then(r=>r.json());
    }
};

// --- COMPONENTS ---

const Header = ({ user, setView, logout }) => (
    <div className="bg-white shadow-sm border-b-4 border-[#fcb900] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
                <div className="w-12 h-12 bg-[#003366] text-white flex items-center justify-center font-bold text-xl rounded shadow-sm">C</div>
                <div>
                    <h1 className="text-xl font-extrabold text-[#003366] leading-none">CIPET : IPT</h1>
                    <p className="text-xs text-gray-600 font-bold mt-1">AHMEDABAD</p>
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-700">
                <button onClick={() => setView('home')} className="hover:text-[#fcb900] transition">HOME</button>
                {user ? (
                    <div className="flex items-center gap-3 pl-4 border-l">
                        <div className="text-right hidden sm:block">
                            <p className="text-[#003366]">{user.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{user.role}</p>
                        </div>
                        <button onClick={() => setView('dashboard')} className="bg-[#003366] text-white px-3 py-1 rounded hover:bg-blue-900">DASHBOARD</button>
                        <button onClick={logout} className="text-red-500"><LogOut size={18}/></button>
                    </div>
                ) : (
                    <button onClick={() => setView('login')} className="bg-[#fcb900] text-[#003366] px-4 py-1.5 rounded hover:bg-yellow-400 shadow-sm">LOGIN</button>
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
        // Mock Google Auth Trigger
        onAuth('google', { email: 'googleuser@gmail.com', name: 'Google User' });
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
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
    const [tab, setTab] = useState('overview');
    const [showCreate, setShowCreate] = useState(false);

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
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 bg-white rounded shadow h-fit pb-4 border border-gray-200">
                <div className="p-6 bg-[#003366] text-center text-white mb-2">
                    <div className="w-16 h-16 bg-white text-[#003366] rounded-full mx-auto flex items-center justify-center font-bold text-2xl mb-2">{user.name[0]}</div>
                    <h3 className="font-bold truncate">{user.name}</h3>
                    <p className="text-xs uppercase opacity-75">{user.role.replace('_',' ')}</p>
                </div>
                <nav className="px-2 space-y-1">
                    <button onClick={() => setTab('overview')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${tab==='overview'?'bg-blue-50 text-[#003366]':'text-gray-600'}`}><LayoutDashboard size={16}/> Overview</button>
                    {(user.role === 'super_admin' || user.role === 'event_admin') && (
                        <button onClick={() => setTab('events')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${tab==='events'?'bg-blue-50 text-[#003366]':'text-gray-600'}`}><Calendar size={16}/> Manage Events</button>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-red-600 hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
                </nav>
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h2 className="text-2xl font-bold text-gray-800">{tab === 'overview' ? 'Dashboard' : 'Event Management'}</h2>
                    {tab === 'events' && (
                        <button onClick={() => setShowCreate(true)} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold text-sm shadow flex items-center gap-2 hover:bg-yellow-400">
                            <Plus size={16}/> New Event
                        </button>
                    )}
                </div>

                {tab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded shadow border-l-4 border-[#003366]">
                            <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                            <p className="text-2xl font-bold text-[#003366]">Active</p>
                        </div>
                        {user.role === 'student' && (
                            <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                                <p className="text-xs font-bold text-gray-500 uppercase">Fees Paid</p>
                                <p className="text-2xl font-bold text-green-600">Yes</p>
                            </div>
                        )}
                    </div>
                )}

                {showCreate && (
                    <div className="bg-white p-6 rounded shadow border mt-4">
                        <h3 className="font-bold text-lg mb-4 text-[#003366]">Post New Event / Workshop</h3>
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

    useEffect(() => { api.getEvents().then(setEvents); }, []);

    const handleAuth = async (mode, data) => {
        try {
            let res;
            if(mode === 'google') res = await api.googleLogin(data.email, data.name);
            else if(mode === 'login') {
                if(otpSent) res = await api.verifyOtp(data.email, data.otp);
                else res = await api.login(data.email, data.password);
            } else {
                res = await api.register(data);
            }

            if(res.status === 'OTP_REQUIRED') { setOtpSent(true); alert("OTP sent to Super Admin email."); }
            else if(res.user) { setUser(res.user); setView('dashboard'); setOtpSent(false); }
            else alert(res.error || "Failed");
        } catch(e) { alert(e.message); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f4f7f6]">
            <Header user={user} setView={setView} logout={() => setUser(null)} />
            
            {view === 'home' && (
                <div className="flex-grow">
                    {/* Hero Section */}
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
                                    {events.map((ev) => (
                                        <div key={ev.id} className="flex gap-4 border-b pb-4 hover:bg-gray-50 p-2 transition">
                                            <div className="bg-[#003366] text-white text-center px-4 py-2 rounded min-w-[70px]">
                                                <div className="text-xl font-bold">{ev.date ? ev.date.split('-')[2] : '15'}</div>
                                                <div className="text-[10px] font-bold text-yellow-400 uppercase">OCT</div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{ev.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{ev.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] bg-gray-200 px-2 rounded font-bold uppercase">{ev.branch}</span>
                                                    <span className={`text-[10px] px-2 rounded font-bold uppercase ${ev.is_paid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{ev.is_paid ? `FEES: ₹${ev.fee}` : 'FREE'}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => !user ? setView('login') : alert('Processing Payment...')} className="self-center border border-[#003366] text-[#003366] text-xs font-bold px-3 py-1 rounded hover:bg-[#003366] hover:text-white transition">
                                                {ev.is_paid ? 'PAY' : 'REGISTER'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-5 rounded shadow border-t-4 border-red-600 h-fit">
                            <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2"><Bell size={18}/> Notices</h3>
                            <ul className="text-sm space-y-3">
                                {MOCK_DATA.notices.map((n, i) => (
                                    <li key={i} className="flex gap-2 items-start text-gray-700 hover:text-[#003366] cursor-pointer">
                                        <ChevronRight size={14} className="mt-1 text-gray-400 flex-shrink-0"/> {n} <sup className="text-red-500 font-bold text-[9px] animate-pulse">NEW</sup>
                                    </li>
                                ))}
                            </ul>
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
