import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, FileText, Upload, LogOut, ChevronRight, 
  Bell, MapPin, Phone, Mail, Lock, LayoutDashboard, UserCircle, 
  Menu, Settings, Folder, File, Trash2, Key, CheckCircle, CreditCard, ArrowRight, ShieldAlert, Plus, Edit3
} from 'lucide-react';

// --- FIREBASE IMPORTS (MODULAR SDK) ---
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    Auth, 
    UserCredential 
} from 'firebase/auth';

// --- CONFIGURATION ---
const API_BASE_URL = "/api"; // Proxy to Worker

// User's provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB97HQe_RVoR7L8qYah8fAsNOho5YijIWE", 
  authDomain: "savvy-fountain-372005.firebaseapp.com",
  databaseURL: "https://savvy-fountain-372005-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "savvy-fountain-372005",
  storageBucket: "savvy-fountain-372005.firebasestorage.app",
  messagingSenderId: "481989168469",
  appId: "1:481989168469:web:1811072ec0ee37fecc33dc",
  measurementId: "G-1RLVVBZ1YM" 
};

// Check if configuration has been updated
const isConfigured = !!firebaseConfig.apiKey;

// --- SERVICE LAYER ---
// (API functions remain outside, as they don't rely on React state)
const fetchJson = async (url: string, options: any = {}) => {
    try {
        const res = await fetch(url, options);
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Server Error");
            return json;
        } else {
            const text = await res.text(); 
            if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
            return {};
        }
    } catch (err: any) {
        console.error("API Error:", err);
        throw err;
    }
};

const api = {
    syncUser: (data: any) => fetchJson(`${API_BASE_URL}/auth/sync`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
    getEvents: () => fetchJson(`${API_BASE_URL}/events`),
    createEvent: (fd: FormData) => fetchJson(`${API_BASE_URL}/events`, { method: 'POST', body: fd }),
    getFiles: () => fetchJson(`${API_BASE_URL}/files`),
    uploadFile: (file: File) => {
        const fd = new FormData(); fd.append('file', file);
        return fetchJson(`${API_BASE_URL}/files`, { method: 'PUT', body: fd });
    },
    deleteFile: (name: string) => fetchJson(`${API_BASE_URL}/files/${name}`, { method: 'DELETE' }),
    getUpgrades: () => fetchJson(`${API_BASE_URL}/admin/upgrades`),
    approveUpgrade: (userId: string, secret: string) => fetchJson(`${API_BASE_URL}/admin/approve`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({userId, secret}) }),
    verifyOtp: (email: string, otp: string) => fetchJson(`${API_BASE_URL}/auth/verify-otp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, otp}) }),
    requestUpgrade: (id: string) => fetchJson(`${API_BASE_URL}/user/upgrade`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id}) }),
    updateProfile: (data: any) => fetchJson(`${API_BASE_URL}/user/profile`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
};

// --- COMPONENTS (Omitted for brevity, logic remains the same) ---
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
                        <button onClick={logout} className="text-red-500 hover:text-red-700"><LogOut size={18}/></button>
                    </div>
                ) : <button onClick={() => setView('login')} className="text-[#003366]">LOGIN</button>}
            </div>
        </div>
    </div>
);

const Auth = ({ mode, setView, onAuth }: any) => {
    const [data, setData] = useState({ email: '', password: '', name: '', branch: 'STC', roleType: 'student', secretCode: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setLoading(true);
        setError('');
        try {
            await onAuth(mode, data);
        } catch(err: any) {
            let displayError = err.message;
            if (err.message.includes('auth/')) {
                displayError = err.message.replace('auth/', '').replace(/-/g, ' ').toUpperCase();
            }
            setError(displayError);
        } finally {
            setLoading(false);
        }
    };
    
    const handleGoogle = () => onAuth('google', data);

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#003366]">
                <h2 className="text-2xl font-bold text-[#003366] text-center mb-6">{mode==='signup'?'Register Account':'Portal Login'}</h2>
                
                {!isConfigured && <div className="bg-red-100 text-red-700 p-2 mb-4 text-sm rounded border border-red-200">ERROR: Firebase is not configured. Please ensure your apiKey is set in src/App.tsx.</div>}
                {error && <div className="bg-red-100 text-red-700 p-2 mb-4 text-sm rounded border border-red-200">{error}</div>}

                <button type="button" onClick={handleGoogle} disabled={!isConfigured || loading} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-2.5 rounded-lg mb-6 hover:bg-gray-50 font-bold text-gray-700 text-sm shadow-sm disabled:opacity-50">
                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs">G</span> 
                    {mode==='signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white text-gray-500">Or use email</span></div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {mode === 'signup' && (
                        <>
                            <input className="w-full border p-2 rounded" placeholder="Full Name" onChange={e => setData({...data, name: e.target.value})} required />
                            <div className="flex gap-2">
                                <select className="w-full border p-2 rounded bg-white" value={data.branch} onChange={e => setData({...data, branch: e.target.value})}><option>STC</option><option>DIPLOMA</option><option>BE</option></select>
                                <select className="w-full border p-2 rounded bg-white" value={data.roleType} onChange={e => setData({...data, roleType: e.target.value})}><option value="student">Student</option><option value="event_admin">Admin</option><option value="super_admin">Super Admin</option></select>
                            </div>
                            {(data.roleType === 'event_admin' || data.roleType === 'super_admin') && (
                                <input type="password" placeholder="Admin Secret Code" className="w-full border border-red-300 p-2 rounded bg-red-50" onChange={e => setData({...data, secretCode: e.target.value})} required />
                            )}
                        </>
                    )}
                    <input className="w-full border p-2 rounded" type="email" placeholder="Email Address" onChange={e => setData({...data, email: e.target.value})} required />
                    <input className="w-full border p-2 rounded" type="password" placeholder="Password" onChange={e => setData({...data, password: e.target.value})} required />
                    
                    <button disabled={loading || !isConfigured} className="w-full bg-[#003366] text-white py-2.5 rounded font-bold hover:bg-blue-900 transition shadow-lg disabled:opacity-50">
                        {loading ? 'Authenticating...' : (mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN')}
                    </button>
                </form>
                <div className="mt-4 text-center text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setView(mode==='login'?'signup':'login')}>
                    {mode==='login'?'Create Account':'Back to Login'}
                </div>
            </div>
        </div>
    );
};

const ProfileEditor = ({ user, onUpdate }: any) => {
    const [data, setData] = useState({ ...user });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            await api.updateProfile(data);
            onUpdate(data);
            setSaveMessage('Profile Updated Successfully!');
        } catch(e: any) { 
            setSaveMessage(`Error updating profile: ${e.message}`);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000); 
        }
    };
    
    return (
        <div className="bg-white p-6 rounded shadow border">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCircle/> Edit Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="text-xs font-bold text-gray-500">Name</label><input className="w-full border p-2 rounded" value={data.name || ''} onChange={e => setData({...data, name: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500">Email</label><input className="w-full border p-2 rounded bg-gray-100" value={data.email || ''} readOnly /></div>
                <div><label className="text-xs font-bold text-gray-500">Phone</label><input className="w-full border p-2 rounded" value={data.phone || ''} onChange={e => setData({...data, phone: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500">Branch</label><select className="w-full border p-2 rounded" value={data.branch} onChange={e => setData({...data, branch: e.target.value})}><option>STC</option><option>DIPLOMA</option><option>BE</option></select></div>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="bg-[#003366] text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveMessage && (
                <div className={`mt-4 p-2 text-sm rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {saveMessage}
                </div>
            )}
        </div>
    );
};

const AdminApprovals = () => {
    const [reqs, setReqs] = useState<any[]>([]);
    const [secret, setSecret] = useState('');
    const [message, setMessage] = useState('');

    const fetchUpgrades = () => {
        api.getUpgrades()
            .then(data => { 
                if(Array.isArray(data)) setReqs(data); 
                setMessage('');
            })
            .catch(e => setMessage(`Error fetching requests: ${e.message}`));
    };

    useEffect(() => { fetchUpgrades(); }, []);

    const handleApprove = async (id: string) => {
        setMessage('');
        if (!secret) {
            setMessage("Please enter the Admin Secret Key first.");
            return;
        }
        try {
            await api.approveUpgrade(id, secret);
            setMessage("User Upgraded Successfully!"); 
            fetchUpgrades();
        } catch(e: any) { 
            setMessage(`Error: ${e.message}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="font-bold text-lg flex items-center gap-2"><ShieldAlert className="text-red-500"/> Pending Upgrade Requests</h3>
                <input 
                    type="password" 
                    placeholder="Admin Secret Key" 
                    className="border p-2 rounded text-xs w-full sm:w-48 bg-red-50" 
                    onChange={e => setSecret(e.target.value)} 
                    value={secret}
                />
            </div>
            {message && (
                <div className={`mb-4 p-2 text-sm rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50"><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Branch</th><th className="p-2">Action</th></tr></thead>
                <tbody>
                    {reqs.map((u: any) => (
                        <tr key={u.id} className="border-b">
                            <td className="p-2">{u.name}</td>
                            <td className="p-2">{u.email}</td>
                            <td className="p-2">{u.branch}</td>
                            <td className="p-2"><button onClick={() => handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50" disabled={!secret}>Approve</button></td>
                        </tr>
                    ))}
                    {reqs.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">No pending requests.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const EventManager = ({ user }: any) => {
    const [showCreate, setShowCreate] = useState(false);
    const [message, setMessage] = useState('');
    const [events, setEvents] = useState<any[]>([]);

    const fetchEvents = () => {
        api.getEvents()
            .then(data => { if(Array.isArray(data)) setEvents(data); })
            .catch(e => setMessage(`Error fetching events: ${e.message}`));
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const form = e.target as HTMLFormElement;
        const fd = new FormData(form);
        
        // Ensure checkbox value is correctly set
        const isPaidInput = form.querySelector('input[name="isPaid"]') as HTMLInputElement;
        fd.append('isPaid', isPaidInput.checked ? 'true' : 'false');
        fd.append('userEmail', user.email);
        
        try {
            await api.createEvent(fd);
            setMessage("Event Posted Successfully!");
            setShowCreate(false);
            fetchEvents();
            form.reset();
        } catch(e: any) {
            setMessage(`Error posting event: ${e.message}`);
        }
    };

    return (
        <div>
            {message && (
                <div className={`mb-4 p-2 text-sm rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}
            <button onClick={() => setShowCreate(!showCreate)} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold mb-4 flex gap-2 items-center hover:bg-yellow-400 transition"><Plus size={16}/> {showCreate ? 'Hide Form' : 'New Event'}</button>
            {showCreate && (
                <div className="bg-white p-6 rounded shadow border mb-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Edit3 size={18} /> Post New Event</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <input name="title" className="w-full border p-2 rounded" placeholder="Event Title" required />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="date" type="date" className="w-full border p-2 rounded" required />
                            <input name="fee" type="number" className="w-full border p-2 rounded" placeholder="Fee (₹, 0 for free)" defaultValue={0} />
                            <select name="branch" className="w-full border p-2 rounded bg-white">
                                <option value="">All Branches</option><option>STC</option><option>DIPLOMA</option><option>BE</option>
                            </select>
                        </div>
                        <textarea name="desc" className="w-full border p-2 rounded" placeholder="Detailed Description..." rows={4}></textarea>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <label className="flex gap-2 text-sm font-medium items-center"><input type="checkbox" name="isPaid" className="h-4 w-4 text-[#003366] rounded" /> This is a Paid Event</label>
                            <label className="text-sm font-medium">Attachment (Optional): <input type="file" name="attachment" className="text-xs file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#003366] file:text-white"/></label>
                        </div>
                        <button type="submit" className="bg-[#003366] text-white px-4 py-2 rounded font-bold hover:bg-blue-900 transition">Publish Event</button>
                    </form>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((ev: any) => (
                    <div key={ev.id} className="bg-white p-4 rounded shadow border-l-4 border-[#fcb900]">
                        <h4 className="font-bold text-[#003366]">{ev.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{new Date(ev.date).toLocaleDateString()} | Fee: ₹{ev.fee || '0'} {ev.is_paid ? '(Paid)' : '(Free)'}</p>
                        <p className="text-sm line-clamp-2">{ev.description}</p>
                        {ev.attachment_url && <a href={`/api/files/${ev.attachment_url}`} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"><File size={14} /> Attachment</a>}
                    </div>
                ))}
            </div>
        </div>
    );
};

const FileManager = ({ files, setFiles }: { files: any[], setFiles: React.Dispatch<React.SetStateAction<any[]>> }) => {
    const [message, setMessage] = useState('');
    
    const fetchFiles = () => {
        api.getFiles()
            .then(data => { if(Array.isArray(data)) setFiles(data); })
            .catch(e => setMessage(`Error fetching files: ${e.message}`));
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage('');
        if(e.target.files && e.target.files[0]) { 
            try {
                await api.uploadFile(e.target.files[0]); 
                setMessage(`File ${e.target.files[0].name} uploaded successfully!`);
                fetchFiles();
            } catch(e: any) {
                setMessage(`Error uploading file: ${e.message}`);
            }
        }
    };

    const handleDeleteFile = async (name: string) => {
        // Using custom logic instead of confirm()
        if (window.prompt(`To confirm deletion of "${name}", type DELETE below:`) === 'DELETE') {
            try {
                await api.deleteFile(name);
                setMessage(`File ${name} deleted successfully!`);
                fetchFiles();
            } catch(e: any) {
                setMessage(`Error deleting file: ${e.message}`);
            }
        } else {
             setMessage(`Deletion of ${name} cancelled.`);
        }
    };

    return (
        <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Folder size={18} /> Cloud Files (R2)</h3>
                <label className="bg-[#003366] text-white px-3 py-1 rounded text-sm cursor-pointer flex gap-1 items-center hover:bg-blue-900 transition"><Upload size={14}/> Upload <input type="file" className="hidden" onChange={handleUpload}/></label>
            </div>
            {message && (
                <div className={`p-3 text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}
            <div className="divide-y divide-gray-100">
                {files.map((f:any) => (
                    <div key={f.name} className="p-3 text-sm flex justify-between items-center hover:bg-gray-50">
                        <span className="flex gap-2 items-center">
                            <FileText size={16} className="text-[#003366]"/> 
                            <a href={`/api/files/${f.name}`} target="_blank" className="text-blue-600 hover:underline">{f.name}</a>
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500 text-xs">{Math.round(f.size / 1024)} KB</span>
                            <button onClick={() => handleDeleteFile(f.name)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
                {files.length === 0 && <div className="p-4 text-center text-gray-400">No files uploaded.</div>}
            </div>
        </div>
    );
};

const Dashboard = ({ user, setUser, logout }: any) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [files, setFiles] = useState([]);
    
    // Fetch files only when the tab is active
    useEffect(() => { 
        if(activeTab === 'files') {
            api.getFiles().then(data => { if(Array.isArray(data)) setFiles(data); }); 
        } 
    }, [activeTab]);

    const handleUpgrade = async () => {
         // Using custom prompt instead of alert/confirm
         const confirmation = window.prompt("Type 'CONFIRM' to request an upgrade to Event Admin role:");
         if(confirmation === 'CONFIRM') {
             try {
                await api.requestUpgrade(user.id);
                setUser({...user, upgrade_status: 'pending'}); // Optimistically update local state
                window.alert("Upgrade Request Sent! An admin will review it soon.");
             } catch (e: any) { 
                window.alert(`Error sending upgrade request: ${e.message}`); 
             }
         } else if (confirmation !== null) {
             window.alert("Upgrade request cancelled.");
         }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-[60vh]">
            <div className="w-full md:w-64 bg-white rounded shadow h-fit pb-4 border border-gray-200">
                <div className="p-6 bg-[#003366] text-center text-white mb-2">
                    <div className="w-16 h-16 bg-white text-[#003366] rounded-full mx-auto flex items-center justify-center font-bold text-2xl mb-2">{user.name?.[0] || 'U'}</div>
                    <h3 className="font-bold truncate">{user.name}</h3>
                    <p className="text-xs uppercase opacity-75">{user.role}</p>
                    <p className="text-[10px] opacity-60 mt-1">ID: {user.id}</p>
                </div>
                <nav className="px-2 space-y-1">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='overview'?'bg-blue-50 text-[#003366]':'text-gray-600 hover:bg-gray-100'}`}><LayoutDashboard size={16}/> Overview</button>
                    <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='profile'?'bg-blue-50 text-[#003366]':'text-gray-600 hover:bg-gray-100'}`}><UserCircle size={16}/> Profile</button>
                    
                    {(user.role === 'super_admin' || user.role === 'event_admin') && (
                        <button onClick={() => setActiveTab('events')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='events'?'bg-blue-50 text-[#003366]':'text-gray-600 hover:bg-gray-100'}`}><Calendar size={16}/> Manage Events</button>
                    )}
                    
                    {user.role === 'super_admin' && (
                        <>
                            <button onClick={() => setActiveTab('files')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='files'?'bg-blue-50 text-[#003366]':'text-gray-600 hover:bg-gray-100'}`}><Folder size={16}/> File Manager</button>
                            <button onClick={() => setActiveTab('approvals')} className={`w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 ${activeTab==='approvals'?'bg-red-50 text-red-600':'text-red-600 hover:bg-gray-100'}`}><ShieldAlert size={16}/> Approvals</button>
                        </>
                    )}
                    <button onClick={logout} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-red-600 hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
                </nav>
            </div>

            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>

                {activeTab === 'profile' && <ProfileEditor user={user} onUpdate={(u: any) => setUser({...user, ...u})} />}
                
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded shadow border-l-4 border-[#003366]"><p className="text-xs font-bold text-gray-500 uppercase">Status</p><p className="text-2xl font-bold text-[#003366]">Active</p></div>
                             <div className="bg-white p-6 rounded shadow border-l-4 border-[#fcb900]"><p className="text-xs font-bold text-gray-500 uppercase">Role</p><p className="text-2xl font-bold text-[#fcb900] capitalize">{user.role.replace('_', ' ')}</p></div>
                             <div className="bg-white p-6 rounded shadow border-l-4 border-[#003366]"><p className="text-xs font-bold text-gray-500 uppercase">Branch</p><p className="text-2xl font-bold text-[#003366]">{user.branch}</p></div>
                        </div>
                        {user.role === 'student' && (
                            <div className="bg-white p-6 rounded shadow border border-blue-100 flex justify-between items-center">
                                <div><h3 className="font-bold text-[#003366]">Student Corner</h3><p className="text-sm text-gray-600">Request access to become an Event Admin.</p></div>
                                {user.upgrade_status === 'pending' ? <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-bold">Pending Approval</span> : <button onClick={handleUpgrade} className="bg-[#fcb900] text-[#003366] px-4 py-2 rounded font-bold shadow hover:bg-yellow-400">Request Upgrade</button>}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'approvals' && user.role === 'super_admin' && <AdminApprovals />}
                {activeTab === 'events' && (user.role === 'super_admin' || user.role === 'event_admin') && <EventManager user={user} />}
                {activeTab === 'files' && user.role === 'super_admin' && <FileManager files={files} setFiles={setFiles} />}
            </div>
        </div>
    );
};

const App = () => {
    const [view, setView] = useState('home');
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);

    // --- NEW: Firebase Initialization State and Logic ---
    const [authInitialized, setAuthInitialized] = useState(false);
    const [firebaseServices, setFirebaseServices] = useState<{ auth: Auth | null, provider: GoogleAuthProvider | null }>({ auth: null, provider: null });

    useEffect(() => {
        if (!isConfigured) {
            console.error("Firebase is not configured. Aborting initialization.");
            return;
        }

        try {
            // Modular initialization is robustly handled here inside the useEffect
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app); 
            const provider = new GoogleAuthProvider();
            
            setFirebaseServices({ auth, provider });
            setAuthInitialized(true);
        } catch (e) {
            console.error("FATAL: Firebase initialization failed.", e);
            setAuthInitialized(true); // Mark as complete, even on failure
        }
    }, []); 
    // --- END NEW FIREBASE LOGIC ---

    useEffect(() => { 
        api.getEvents().then(data => { if(Array.isArray(data)) setEvents(data); }).catch(e => console.error("Error fetching initial events:", e)); 
    }, []);

    // Use memoized values for ease of access and dependency tracking
    const authInstance = firebaseServices.auth;
    const googleProvider = firebaseServices.provider;

    const handleAuth = async (mode: string, data: any) => {
        if (!isConfigured) {
             throw new Error("Configuration Error: Firebase is not configured.");
        }
        
        // Check for initialization success
        if (!authInitialized || !authInstance || !googleProvider) {
             throw new Error("Initialization Error: Firebase SDK not available. Please wait and try again.");
        }

        try {
            let authResult: UserCredential | null = null;
            let res;
            
            if (mode === 'google') {
                authResult = await signInWithPopup(authInstance, googleProvider);
                res = await api.syncUser({ 
                    uid: authResult.user.uid, 
                    email: authResult.user.email, 
                    name: authResult.user.displayName,
                    branch: data.branch || 'General' 
                });
            }
            else if (mode === 'login') {
                authResult = await signInWithEmailAndPassword(authInstance, data.email, data.password);
                
                // For Super Admin login, trigger the Worker's OTP flow
                if (data.email.toLowerCase() === 'rr8382658@gmail.com') {
                    res = { status: 'OTP_REQUIRED' }; 
                } else {
                    res = await api.syncUser({ email: data.email }); 
                }
            }
            else { // signup
                authResult = await createUserWithEmailAndPassword(authInstance, data.email, data.password);
                res = await api.syncUser({ 
                    uid: authResult.user.uid, 
                    email: data.email, 
                    name: data.name, 
                    branch: data.branch, 
                    role: data.roleType,
                    secretCode: data.secretCode
                });
            }

            if (res.status === 'OTP_REQUIRED') { 
                const otp = window.prompt("Enter OTP sent to your email:"); 
                if(otp) {
                    const otpRes = await api.verifyOtp(data.email, otp);
                    if(otpRes.status === 'SUCCESS' && otpRes.user) { 
                        setUser(otpRes.user); 
                        setView('dashboard'); 
                    }
                    else {
                        window.alert(otpRes.error || "OTP verification failed.");
                        await signOut(authInstance);
                    }
                } else {
                     if (authInstance.currentUser) await signOut(authInstance);
                    throw new Error("OTP verification cancelled.");
                }
            } else if (res.user) { 
                setUser(res.user); 
                setView('dashboard'); 
            } else {
                throw new Error("Unknown authentication flow error.");
            }
        } catch(e: any) { 
            console.error("Auth Error:", e);
            let displayError = e.message;
            if (e.code && typeof e.code === 'string' && e.code.includes('auth/')) {
                displayError = e.code.replace('auth/', '').replace(/-/g, ' ').toUpperCase();
            }
            throw new Error(displayError); 
        }
    };

    const handleSignOut = () => {
        if (authInstance) {
            signOut(authInstance).then(() => {
                setUser(null);
                setView('home');
            }).catch(err => window.alert(err.message)); 
        } else {
            setUser(null);
            setView('home');
        }
    };

    // If authentication hasn't initialized yet, show a loading state
    if (!authInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl border-t-4 border-[#003366]">
                    <svg className="animate-spin h-8 w-8 text-[#003366] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="font-semibold text-gray-700">Loading essential services...</p>
                    <p className="text-xs text-gray-500 mt-1">Initializing Firebase Authentication</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f4f7f6] font-sans">
            <Header user={user} setView={setView} logout={handleSignOut} />
            {view === 'home' && (
                <div className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
                   <h1 className="text-4xl font-bold text-center mb-12 text-[#003366]">Upcoming Events</h1>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {events.length > 0 ? events.map((ev: any) => (
                           <div key={ev.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#003366] hover:shadow-xl transition duration-300">
                               <div className="flex items-center gap-3 mb-2">
                                    <Calendar size={18} className="text-[#fcb900]"/>
                                    <p className="text-sm font-semibold text-gray-600">{new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                               </div>
                               <h3 className="font-extrabold text-xl text-[#003366] mb-2">{ev.title}</h3>
                               <p className="text-sm text-gray-700 line-clamp-3">{ev.description}</p>
                               <div className="mt-3 flex justify-between items-center">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ev.is_paid ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {ev.is_paid ? `₹${ev.fee} Paid` : 'Free'}
                                    </span>
                                    {ev.branch && <span className="text-xs text-gray-500 font-medium">Branch: {ev.branch}</span>}
                               </div>
                           </div>
                       )) : (
                            <div className="md:col-span-3 text-center p-12 bg-white rounded-lg shadow-inner text-gray-500">
                                No upcoming events scheduled at the moment.
                            </div>
                       )}
                   </div>
                </div>
            )}
            {view === 'login' && <Auth mode='login' setView={setView} onAuth={handleAuth} />}
            {view === 'signup' && <Auth mode='signup' setView={setView} onAuth={handleAuth} />}
            {view === 'dashboard' && user && <Dashboard user={user} setUser={setUser} logout={handleSignOut} />}
            <footer className="bg-[#003366] text-white py-6 text-center text-sm mt-auto">© 2025 CIPET IPT Ahmedabad</footer>
        </div>
    );
};

export default App;
