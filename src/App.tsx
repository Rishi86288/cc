import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Upload, LogOut, ChevronRight, 
  Bell, MapPin, Phone, Mail, Lock, LayoutDashboard, UserCircle, 
  Menu, Settings, Folder, File, Trash2, Key, CheckCircle, CreditCard, ArrowRight, ShieldAlert, Plus, Edit3
} from 'lucide-react';

// --- CONFIGURATION ---
const USE_MOCK_API = false; // Set to FALSE for production
const API_BASE_URL = "/api"; // Uses Cloudflare Pages Functions proxy

// --- SERVICE LAYER ---
const api = {
    // --- AUTHENTICATION ---
    login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password}) });
        return res.json();
    },
    googleLogin: async (email, name) => {
        // This maps to the Google Sync endpoint in your worker
        const res = await fetch(`${API_BASE_URL}/auth/sync`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({uid: crypto.randomUUID(), email, name}) });
        return res.json();
    },
    verifyOtp: async (email, otp) => {
        const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, otp}) });
        return res.json();
    },
    register: async (data) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return res.json();
    },

    // --- PROFILE & UPGRADES ---
    updateProfile: async (data) => {
        const res = await fetch(`${API_BASE_URL}/user/profile`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        return res.json();
    },
    requestUpgrade: async (id) => {
        const res = await fetch(`${API_BASE_URL}/user/upgrade`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) });
        return res.json();
    },
    getUpgrades: async () => {
        const res = await fetch(`${API_BASE_URL}/admin/upgrades`);
        return res.json();
    },
    approveUpgrade: async (userId, secret) => {
        const res = await fetch(`${API_BASE_URL}/admin/approve`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({userId, secret}) });
        return res.json();
    },

    // --- EVENTS ---
    getEvents: async () => {
        const res = await fetch(`${API_BASE_URL}/events`);
        return res.json();
    },
    createEvent: async (fd) => {
        const res = await fetch(`${API_BASE_URL}/events`, { method: 'POST', body: fd });
        return res.json();
    },

    // --- FILES ---
    getFiles: async () => {
        const res = await fetch(`${API_BASE_URL}/files`);
        return res.json();
    },
    uploadFile: async (file) => {
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/files`, { method: 'PUT', body: fd });
        return res.json();
    },
    deleteFile: async (name) => {
        const res = await fetch(`${API_BASE_URL}/files/${name}`, { method: 'DELETE' });
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

const ProfileEditor = ({ user, onUpdate }: any) => {
    const [data, setData] = useState({ ...user });
    
    const handleSave = async () => {
        await api.updateProfile(data);
        onUpdate(data);
        alert('Profile Updated!');
    };

    return (
        <div className="bg-white p-6 rounded shadow border">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCircle/> Edit Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="text-xs font-bold text-gray-500">Name</label><input className="w-full border p-2 rounded" value={data.name} onChange={e => setData({...data, name: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500">Phone</label><input className="w-full border p-2 rounded" value={data.phone || ''} onChange={e => setData({...data, phone: e.target.value})} placeholder="+91..." /></div>
                <div><label className="text-xs font-bold text-gray-500">Branch</label><select className="w-full border p-2 rounded" value={data.branch} onChange={e => setData({...data, branch: e.target.value})}><option>STC</option><option>DIPLOMA</option><option>BE</option></select></div>
            </div>
            <button onClick={handleSave} className="bg-[#003366] text-white px-4 py-2 rounded text-sm font-bold">Save Changes</button>
        </div>
    );
};

const AdminApprovals = () => {
    const [reqs, setReqs] = useState<any[]>([]);
    const [secret, setSecret] = useState('');

    useEffect(() => { api.getUpgrades().then(data => { if(Array.isArray(data)) setReqs(data); }); }, []);

    const handleApprove = async (id: number) => {
        const res = await api.approveUpgrade(id, secret);
        if(res.success) { alert("User Upgraded!"); api.getUpgrades().then(setReqs); }
        else alert(res.error);
    };

    return (
        <div className="bg-white p-6 rounded shadow border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><ShieldAlert className="text-red-500"/> Pending Requests</h3>
                <input type="password" placeholder="Admin Secret Key" className="border p-2 rounded text-xs w-48" onChange={e => setSecret(e.target.value)} />
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50"><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Action</th></tr></thead>
                <tbody>
                    {reqs.map((u: any) => (
                        <tr key={u.id} className="border-b">
                            <td className="p-2">{u.name}</td><td className="p-2">{u.email}</td>
                            <td className="p-2"><button onClick={() => handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Approve</button></td>
                        </tr>
                    ))}
                    {reqs.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">No pending requests.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const Dashboard = ({ user, setUser, logout }: any) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [files, setFiles] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => { if(activeTab === 'files') api.getFiles().then(setFiles); }, [activeTab]);

    const handleCreate = async (e: any) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('isPaid', e.target.isPaid.checked);
        fd.append('userEmail', user.email);
        await api.createEvent(fd);
        alert("Event Posted!");
        setShowCreate(false);
    };

    const handleUpload = async (e: any) => {
        if(e.target.files[0]) { await api.uploadFile(e.target.files[0]); api.getFiles().then(setFiles); }
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
                    <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='profile'?'bg-blue-50 text-[#003366]':'text-gray-600'}`}><UserCircle size={16}/> Profile</button>
                    {(user.role === 'super_admin' || user.role === 'event_admin') && <button onClick={() => setActiveTab('events')} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-gray-600"><Calendar size={16}/> Manage Events</button>}
                    {user.role === 'super_admin' && (
                        <>
                            <button onClick={() => setActiveTab('files')} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-gray-600"><Folder size={16}/> Files</button>
                            <button onClick={() => setActiveTab('approvals')} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-red-600"><ShieldAlert size={16}/> Approvals</button>
                        </>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-red-600 hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
                </nav>
            </div>

            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{activeTab === 'profile' ? 'Edit Profile' : 'Dashboard'}</h2>

                {activeTab === 'profile' && <ProfileEditor user={user} onUpdate={(u: any) => setUser({...user, ...u})} />}
                
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded shadow border-l-4 border-[#003366]"><p className="text-xs font-bold text-gray-500 uppercase">Status</p><p className="text-2xl font-bold text-[#003366]">Active</p></div>
                        </div>
                        {user.role === 'student' && (
                            <div className="bg-white p-6 rounded shadow border border-blue-100 flex justify-between items-center">
                                <div><h3 className="font-bold text-[#003366]">Become Event Admin</h3><p className="text-sm text-gray-600">Organize workshops and manage registrations.</p></div>
                                {user.upgrade_status === 'pending' ? <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-bold">Pending</span> : <button onClick={() => api.requestUpgrade(user.id).then(() => { alert("Request Sent!"); setUser({...user, upgrade_status: 'pending'}); })} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold shadow">Request Upgrade</button>}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'approvals' && user.role === 'super_admin' && <AdminApprovals />}

                {activeTab === 'events' && (
                    <div>
                        <button onClick={() => setShowCreate(!showCreate)} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold mb-4 flex gap-2 items-center"><Plus size={16}/> New Event</button>
                        {showCreate && (
                            <div className="bg-white p-6 rounded shadow border mb-6">
                                <h3 className="font-bold mb-4">Post Event</h3>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <input name="title" className="w-full border p-2 rounded" placeholder="Title" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="date" type="date" className="w-full border p-2 rounded" required />
                                        <input name="fee" type="number" className="w-full border p-2 rounded" placeholder="Fee (₹)" />
                                    </div>
                                    <textarea name="desc" className="w-full border p-2 rounded" placeholder="Details..."></textarea>
                                    <div className="flex gap-4 items-center"><label className="flex gap-2 text-sm"><input type="checkbox" name="isPaid" /> Paid?</label><input type="file" name="attachment" className="text-xs"/></div>
                                    <button className="bg-[#003366] text-white px-4 py-2 rounded font-bold">Publish</button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="bg-white rounded shadow overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <h3 className="font-bold">Cloud Files</h3>
                            <label className="bg-[#003366] text-white px-3 py-1 rounded text-xs cursor-pointer flex gap-1 items-center"><Upload size={14}/> Upload <input type="file" className="hidden" onChange={handleUpload}/></label>
                        </div>
                        {files.map((f:any, i:number) => (
                            <div key={i} className="p-3 border-b text-sm flex justify-between"><span className="flex gap-2"><FileText size={16}/> {f.name}</span><span className="text-gray-500">{f.size}</span></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Auth = ({ mode, setView, onAuth, otpSent }: any) => {
    const [data, setData] = useState({ email: '', password: '', role: 'student', branch: 'STC' });
    const submit = (e: any) => { e.preventDefault(); onAuth(mode, data); };
    const handleGoogle = () => onAuth('google', { email: 'googleuser@gmail.com', name: 'Google User' });

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#003366]">
                <h2 className="text-2xl font-bold text-[#003366] text-center mb-6">{otpSent ? 'Verify OTP' : (mode==='signup'?'Register':'Login')}</h2>
                {!otpSent && <button type="button" onClick={handleGoogle} className="w-full bg-white border border-gray-300 py-2 rounded mb-6 hover:bg-gray-50 font-bold text-gray-700 text-sm shadow-sm flex justify-center gap-2"><span className="text-red-500 font-bold">G</span> {mode==='signup'?'Sign up with Google':'Sign in with Google'}</button>}
                <form onSubmit={submit} className="space-y-4">
                    {otpSent ? (
                        <input className="w-full border p-2 rounded text-center text-2xl tracking-widest" onChange={(e: any) => setData({...data, otp: e.target.value})} placeholder="OTP" />
                    ) : (
                        <>
                            {mode === 'signup' && (
                                <>
                                    <input className="w-full border p-2 rounded" placeholder="Full Name" onChange={(e: any) => setData({...data, name: e.target.value})} required />
                                    <div className="flex gap-2">
                                        <select className="w-full border p-2 rounded bg-white" onChange={(e: any) => setData({...data, branch: e.target.value})}><option>STC</option><option>DIPLOMA</option></select>
                                        <select className="w-full border p-2 rounded bg-white" onChange={(e: any) => setData({...data, role: e.target.value})}><option value="student">Student</option><option value="event_admin">Admin</option></select>
                                    </div>
                                    {(data.role === 'event_admin' || data.role === 'super_admin') && <input type="password" placeholder="Admin Secret" className="w-full border border-red-300 p-2 rounded" onChange={(e: any) => setData({...data, secretCode: e.target.value})} />}
                                </>
                            )}
                            <input className="w-full border p-2 rounded" type="email" placeholder="Email Address" onChange={(e: any) => setData({...data, email: e.target.value})} required />
                            <input className="w-full border p-2 rounded" type="password" placeholder="Password" onChange={(e: any) => setData({...data, password: e.target.value})} required />
                        </>
                    )}
                    <button className="w-full bg-[#003366] text-white py-2 rounded font-bold">{otpSent ? 'Verify' : 'Submit'}</button>
                </form>
                {!otpSent && <div className="mt-4 text-center text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setView(mode==='login'?'signup':'login')}>{mode==='login'?'Create Account':'Back to Login'}</div>}
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

    const handleAuth = async (mode: string, data: any) => {
        try {
            let res;
            if (mode === 'google') res = await api.googleLogin(data.email, data.name);
            else if (mode === 'login') {
                if (otpSent) res = await api.verifyOtp(data.email, data.otp);
                else res = await api.login(data.email, data.password);
            } else res = await api.register(data);

            if (res.status === 'OTP_REQUIRED') { setOtpSent(true); alert("OTP sent to Super Admin email."); }
            else if (res.user) { setUser(res.user); setView('dashboard'); setOtpSent(false); }
            else alert(res.error || "Failed");
        } catch(e: any) { alert(e.message); }
    };

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
            {view === 'login' && <Auth mode={view} setView={setView} onAuth={handleAuth} otpSent={otpSent} />}
            {view === 'dashboard' && user && <Dashboard user={user} setUser={setUser} logout={() => setUser(null)} />}
            <footer className="bg-[#003366] text-white py-6 text-center text-sm mt-auto">© 2025 CIPET IPT Ahmedabad</footer>
        </div>
    );
};

export default App;
