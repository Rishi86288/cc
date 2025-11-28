import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Upload, LogOut, ChevronRight, 
  Bell, MapPin, Phone, Mail, Lock, LayoutDashboard, UserCircle, 
  Menu, Settings, Folder, Trash2, Key, CheckCircle, CreditCard, ArrowRight, ShieldAlert, Plus
} from 'lucide-react';

// --- CONFIGURATION ---
const USE_MOCK_API = false;
// Update this with your deployed Worker URL
const API_BASE_URL = "https://cipet-portal.rishiforrdp6055.workers.dev"; 

// --- SERVICE LAYER ---
const api = {
    // Google Auth Sync
    authSync: async (user: any) => {
        const res = await fetch(`${API_BASE_URL}/api/auth/sync`, {
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
        const res = await fetch(`${API_BASE_URL}/api/admin/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, key })
        });
        return res.json();
    },
    // Verify OTP
    verifyAdminOtp: async (uid: string, code: string) => {
        const res = await fetch(`${API_BASE_URL}/api/admin/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, code })
        });
        return res.json();
    },
    getEvents: async () => {
        const res = await fetch(`${API_BASE_URL}/api/events`);
        return res.json();
    },
    createEvent: async (eventData: any) => {
        const res = await fetch(`${API_BASE_URL}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
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
    // Simulated Google Login for this example
    // In production, replace with real Firebase/Google OAuth popup
    const handleGoogle = async () => {
        const mockGoogleUser = {
            email: 'rr8382658@gmail.com', // Test Admin Email
            name: 'Rishi Admin',
            branch: 'CSE'
        };
        const user = await api.authSync(mockGoogleUser);
        setUser(user);
        setView('dashboard');
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#003366] text-center">
                <h2 className="text-2xl font-bold text-[#003366] mb-6">Portal Login</h2>
                <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-bold text-gray-700 shadow-sm transition">
                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs">G</span> 
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

const Dashboard = ({ user, logout }: any) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [otpStep, setOtpStep] = useState(false);
    const [secret, setSecret] = useState('');
    const [otp, setOtp] = useState('');

    const handleUpgrade = async () => {
        if (otpStep) {
            const res = await api.verifyAdminOtp(user.id, otp);
            if (res.success) alert("Upgraded to Admin!");
            else alert("Invalid OTP");
        } else {
            const res = await api.requestAdminOtp(user.id, secret);
            if (res.success) {
                setOtpStep(true);
                alert("OTP sent to Super Admin Email!");
            } else {
                alert(res.error);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-[60vh]">
            <div className="w-full md:w-64 bg-white rounded shadow h-fit pb-4 border border-gray-200">
                <div className="p-6 bg-[#003366] text-center text-white mb-2">
                    <h3 className="font-bold">{user.name}</h3>
                    <p className="text-xs uppercase opacity-75">{user.role}</p>
                </div>
                <nav className="px-2 space-y-1">
                    <button onClick={() => setActiveTab('overview')} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 hover:bg-gray-100"><LayoutDashboard size={16}/> Overview</button>
                    <button onClick={() => setActiveTab('admin')} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 hover:bg-gray-100"><Lock size={16}/> Admin Access</button>
                    <button onClick={logout} className="w-full text-left px-4 py-2 rounded text-sm font-semibold flex gap-2 text-red-600 hover:bg-red-50"><LogOut size={16}/> Sign Out</button>
                </nav>
            </div>

            <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Dashboard</h2>
                {activeTab === 'overview' && <div className="bg-white p-6 rounded shadow"><h3 className="font-bold">Welcome, {user.name}</h3></div>}
                {activeTab === 'admin' && (
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold mb-4">Upgrade to Event Admin</h3>
                        {!otpStep ? (
                            <div className="flex gap-2">
                                <input className="border p-2 rounded w-full" placeholder="Enter Faculty Secret Key" onChange={e => setSecret(e.target.value)} />
                                <button onClick={handleUpgrade} className="bg-[#003366] text-white px-4 rounded font-bold">Request OTP</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input className="border p-2 rounded w-full" placeholder="Enter OTP from Email" onChange={e => setOtp(e.target.value)} />
                                <button onClick={handleUpgrade} className="bg-green-600 text-white px-4 rounded font-bold">Verify</button>
                            </div>
                        )}
                    </div>
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
