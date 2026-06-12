import React, { useState, useEffect } from "react";
import { UserSession, UserRole, SystemNotification, VerificationStatus } from "./types";
import ThreeParticleBg from "./components/ThreeParticleBg";
import AdminPanel from "./components/AdminPanel";
import ClientDashboard from "./components/ClientDashboard";
import StudentProfileView from "./components/StudentProfileView";
import Marketplace from "./components/Marketplace";
import OpportunitiesBoard from "./components/OpportunitiesBoard";
import MessagingPortal from "./components/MessagingPortal";
import { 
  Award, 
  Briefcase, 
  MessageSquare, 
  ShieldAlert, 
  ShoppingBag, 
  User, 
  LogOut, 
  Bell, 
  Compass, 
  Cpu, 
  HelpCircle, 
  RefreshCw, 
  Menu, 
  X, 
  Heart,
  UserPlus,
  Unlock,
  Sparkles
} from "lucide-react";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("marketplace");
  const [loading, setLoading] = useState(true);
  const [roleSwitching, setRoleSwitching] = useState(false);

  // Sign up Form modal
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>(UserRole.STUDENT);
  const [signupUniv, setSignupUniv] = useState("University of Peshawar");
  const [signupDept, setSignupDept] = useState("Computer Science");
  const [signupId, setSignupId] = useState("");
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const handleOpenSignup = () => {
    setSignupError(null);
    setSignupSuccess(null);
    setVerificationCode("");
    setShowCodeStep(false);
    setShowSignup(true);
  };

  // Seeding/State communication transitions
  const [activeChatTarget, setActiveChatTarget] = useState<string | undefined>(undefined);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error("Authentication session fetch failed:", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      await fetchSession();
      setLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.id]);

  const handleSelectRole = async (role: UserRole) => {
    try {
      setRoleSwitching(true);
      const res = await fetch("/api/auth/session/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        
        // Auto routing based on Swapped Role configuration to maximize logical transitions!
        if (role === UserRole.ADMIN) {
          setActiveTab("admin");
        } else if (role === UserRole.CLIENT) {
          setActiveTab("client-dash");
        } else {
          setActiveTab("marketplace");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRoleSwitching(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);
    try {
      const payload: any = {
        name: signupName,
        email: signupEmail,
        role: signupRole,
        university: signupUniv,
        department: signupDept,
        studentIdNum: signupId
      };
      
      if (showCodeStep) {
        payload.code = verificationCode;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.step === "verify") {
          setShowCodeStep(true);
          setSignupSuccess(data.message);
        } else {
          setSession(data);
          setShowSignup(false);
          setShowCodeStep(false);
          setVerificationCode("");
          setSignupSuccess(null);
          fetchNotifications();
          if (signupRole === UserRole.STUDENT) {
            setActiveTab("profile");
          } else {
            setActiveTab("client-dash");
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setSignupError(errData.error || "An unexpected error occurred during profile verification.");
      }
    } catch (error) {
      console.error(error);
      setSignupError("Connection to authentication server failed. Please check your local server or network.");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenChatWithUser = (userId: string) => {
    setActiveChatTarget(userId);
    setActiveTab("messaging");
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="h-10 w-10 animate-spin text-sky-400 mb-3" />
        <h2 className="text-sm font-bold font-mono tracking-widest text-slate-200">BOOTING NEXUS GATEWAYS...</h2>
        <p className="text-xs text-slate-500 mt-2">Connecting Pakistan Campus Opportunity Networks</p>
      </div>
    );
  }

  return (
    <div id="nexus-app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* Dynamic 3D Particle Canvas backdrop in the ambient hero section */}
      {activeTab === "marketplace" && <ThreeParticleBg />}

      {/* Global Top Banner Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded-xl p-1" 
            onClick={() => setActiveTab("marketplace")}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab("marketplace"); } }}
            aria-label="NEXUS Student Ecosystem, go to marketplace"
          >
            <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-950/20 overflow-hidden">
              <img src="/logo.webp" alt="NEXUS logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-955 leading-none">NEXUS</h1>
              <span className="text-[9px] font-extrabold font-mono text-slate-600 tracking-wider block mt-1 uppercase">STUDENT ECOSYSTEM</span>
            </div>
          </div>

          {/* Core App Role Account switching */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl" role="group" aria-label="Role Switcher">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-750 font-bold px-2">Inspect:</span>
            <button 
              type="button"
              onClick={() => handleSelectRole(UserRole.STUDENT)}
              disabled={roleSwitching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session?.role === UserRole.STUDENT 
                  ? "bg-white text-slate-955 shadow-sm border border-slate-250" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
              }`}
              aria-pressed={session?.role === UserRole.STUDENT}
            >
              Student Workspace
            </button>
            <button 
              type="button"
              onClick={() => handleSelectRole(UserRole.CLIENT)}
              disabled={roleSwitching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session?.role === UserRole.CLIENT 
                  ? "bg-white text-slate-955 shadow-sm border border-slate-250" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
              }`}
              aria-pressed={session?.role === UserRole.CLIENT}
            >
              Client / Buyer Workspace
            </button>
            <button 
              type="button"
              onClick={() => handleSelectRole(UserRole.ADMIN)}
              disabled={roleSwitching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session?.role === UserRole.ADMIN 
                  ? "bg-white text-slate-955 shadow-sm border border-slate-250" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
              }`}
              aria-pressed={session?.role === UserRole.ADMIN}
            >
              Provost Admin Office
            </button>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-3">
            
            {/* Quick register trigger */}
            <button 
              type="button"
              onClick={handleOpenSignup}
              className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl hover:bg-indigo-100/70 transition-colors flex items-center gap-1 shrink-0"
              aria-label="Process onboarding and sign up"
            >
              <UserPlus className="h-3.5 w-3.5" /> Sign up
            </button>

            {/* Notification alert */}
            {session && (
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-all relative"
                  aria-label={`System alerts. ${unreadNotificationsCount} unread`}
                  aria-expanded={showNotifications}
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 h-4.5 w-4.5 rounded-full bg-slate-950 text-white font-mono font-bold text-[8px] flex items-center justify-center scale-95 border-2 border-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown list overlay */}
                {showNotifications && (
                   <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-3 duration-200 select-none">
                    <div className="p-4 bg-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Notifications Desk</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] font-mono text-center text-slate-400 py-8">Your inbox is clear.</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleMarkRead(n.id)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? "bg-indigo-50/20" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-800 leading-tight block">{n.title}</span>
                              {!n.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-normal leading-relaxed">{n.content}</p>
                            <span className="text-[8px] font-mono text-slate-400 block mt-2">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Info display */}
            {session && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <img 
                  src={session.avatar} 
                  alt={session.name} 
                  className="w-8.5 h-8.5 rounded-full border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden md:block">
                  <p className="text-xs font-bold text-slate-950 leading-none">{session.name}</p>
                  <span className="text-[9px] font-mono text-slate-400 mt-1 block">{session.role} account</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Account inspector switcher */}
      <div className="lg:hidden bg-indigo-50/50 p-2.5 border-b border-indigo-100 flex items-center justify-center gap-2">
        <span className="text-[9px] font-bold font-mono text-indigo-700">Toggle Inspect Workspace:</span>
        <select 
          value={session?.role}
          onChange={(e) => handleSelectRole(e.target.value as UserRole)}
          className="text-xs bg-white border border-indigo-200 rounded p-1 font-semibold text-slate-800"
        >
          <option value={UserRole.STUDENT}>Student Workspace</option>
          <option value={UserRole.CLIENT}>Client / Buyer Workspace</option>
          <option value={UserRole.ADMIN}>Provost Admin office</option>
        </select>
      </div>

      {/* Main Tab Navigation Header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm select-none animate-slide-up" role="tablist" aria-label="Workspace navigations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-x-auto h-12 scrollbar-none">
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === "marketplace"}
            aria-controls="nexus-app-root"
            tabIndex={0}
            onClick={() => setActiveTab("marketplace")}
            className={`h-full text-xs font-bold px-3 border-b-2 flex items-center gap-1.5 transition-all outline-none ${
              activeTab === "marketplace" 
                ? "border-slate-900 text-slate-955" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingBag className="h-4 w-4" /> Gigs Marketplace
          </button>

          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === "opportunities"}
            aria-controls="nexus-app-root"
            tabIndex={0}
            onClick={() => setActiveTab("opportunities")}
            className={`h-full text-xs font-bold px-3 border-b-2 flex items-center gap-1.5 transition-all outline-none ${
              activeTab === "opportunities" 
                ? "border-slate-900 text-slate-955" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="h-4 w-4" /> Opportunities Board
          </button>

          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === "messaging"}
            aria-controls="nexus-app-root"
            tabIndex={0}
            onClick={() => setActiveTab("messaging")}
            className={`h-full text-xs font-bold px-3 border-b-2 flex items-center gap-1.5 transition-all outline-none ${
              activeTab === "messaging" 
                ? "border-slate-900 text-slate-955" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Messaging Inbox
          </button>

          {session?.role === UserRole.STUDENT && (
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === "profile"}
              aria-controls="nexus-app-root"
              tabIndex={0}
              onClick={() => setActiveTab("profile")}
              className={`h-full text-xs font-bold px-3 border-b-2 flex items-center gap-1.5 transition-all outline-none ${
                activeTab === "profile" 
                  ? "border-slate-900 text-slate-955" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="h-4 w-4" /> My Profile Portfolio
            </button>
          )}

          {session?.role === UserRole.CLIENT && (
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === "client-dash"}
              aria-controls="nexus-app-root"
              tabIndex={0}
              onClick={() => setActiveTab("client-dash")}
              className={`h-full text-xs font-bold px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === "client-dash" 
                  ? "border-slate-900 text-slate-955" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Client Workspace dashboard
            </button>
          )}

          {session?.role === UserRole.ADMIN && (
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === "admin"}
              aria-controls="nexus-app-root"
              tabIndex={0}
              onClick={() => setActiveTab("admin")}
              className={`h-full text-xs font-bold px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === "admin" 
                  ? "border-slate-900 text-slate-955" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldAlert className="h-4 w-4" /> Admin Identity Moderation
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-grow py-8 relative z-10">
        
        {/* Onboarding Showcase Banner */}
        {activeTab === "marketplace" && !activeChatTarget && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden backdrop-blur">
              <div className="max-w-xl space-y-4 relative z-10 font-sans">
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Discover student talent. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-600">Build real experiences.</span>
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Connecting University of Peshawar students with local and provincial businesses. Show your skill cards, assemble portfolios with **Gemini AI optimizations**, offer services, and earn.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm font-mono">
                    ✦ Server-side Gemini AI Active
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm font-mono">
                    ⟁ Peshawar Pilot Division
                  </div>
                </div>
              </div>
              <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden md:block">
                <div className="h-48 w-48 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Tab display switches */}
        {activeTab === "marketplace" && (
          <Marketplace 
            session={session!} 
            onOpenChat={handleOpenChatWithUser} 
            onPostSuccess={() => { setActiveTab("profile"); }} 
          />
        )}

        {activeTab === "opportunities" && (
          <OpportunitiesBoard 
            session={session!} 
            onApplySuccess={() => { setActiveTab("messaging"); }} 
          />
        )}

        {activeTab === "messaging" && (
          <MessagingPortal 
            session={session!} 
            activeTargetId={activeChatTarget} 
          />
        )}

        {activeTab === "profile" && session?.role === UserRole.STUDENT && (
          <StudentProfileView 
            session={session} 
            onUpdateSession={setSession} 
          />
        )}

        {activeTab === "client-dash" && session?.role === UserRole.CLIENT && (
          <ClientDashboard 
            session={session} 
            onOpenChat={handleOpenChatWithUser} 
          />
        )}

        {activeTab === "admin" && session?.role === UserRole.ADMIN && (
          <AdminPanel />
        )}
      </main>

      {/* Unified Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-labelledby="signup-modal-title">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative select-none uppercase-labels">
            <button 
              type="button"
              onClick={() => {
                setShowSignup(false);
                setShowCodeStep(false);
                setVerificationCode("");
                setSignupError(null);
                setSignupSuccess(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Close onboarding modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5 font-sans">
              <h3 id="signup-modal-title" className="text-xl font-extrabold text-slate-955 tracking-tight">
                {showCodeStep ? "Verify Your Email" : "Onboard NEXUS Account"}
              </h3>
              <p className="text-xs text-slate-600">
                {showCodeStep ? "An authorization PIN has been targeted to your inbox." : "Become part of Pakistan's premier student opportunity platform."}
              </p>
            </div>

            {showCodeStep ? (
              <form onSubmit={handleSignup} className="space-y-4 text-left">
                {signupSuccess && (
                  <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 text-left animate-in fade-in duration-250">
                    <div className="flex gap-2.5 flex-row">
                      <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-emerald-955 tracking-tight font-sans">Verification PIN Dispatched</h4>
                        <p className="text-[11px] text-emerald-800 leading-normal">{signupSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                {signupError && (
                  <div className="bg-red-50/90 border border-red-200/80 rounded-2xl p-4 text-left animate-in slide-in-from-top-2 duration-200 relative">
                    <div className="flex gap-2.5 flex-row">
                      <ShieldAlert className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-red-955 tracking-tight font-sans">Verification Error</h4>
                        <p className="text-[11px] text-red-850 leading-normal select-text">{signupError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1 font-sans">
                  <label htmlFor="verification-pin" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">6-Digit Email Code</label>
                  <input 
                    id="verification-pin"
                    type="text" 
                    required 
                    maxLength={6}
                    placeholder="e.g. 492837 or 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full text-center tracking-[0.25em] font-mono text-lg px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950"
                  />
                  <p className="text-[10px] text-slate-500 text-center pt-1 font-mono">
                    Can't find the email? Check spam, check dev logs, or verify with code: <strong>492837</strong>
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-slate-900 border border-slate-955 text-white rounded-xl text-xs font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-all shadow-md font-sans"
                >
                  Confirm Code & Verify Account
                </button>

                <div className="text-center pt-2 font-sans">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCodeStep(false);
                      setSignupSuccess(null);
                      setSignupError(null);
                    }}
                    className="text-[11px] font-bold font-mono text-indigo-650 hover:text-indigo-800 underline p-1 rounded"
                  >
                    ← Back to Account Attributes
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4 text-left font-sans">
                {signupError && (
                  <div className="bg-red-50/90 border border-red-200/80 rounded-2xl p-4 text-left animate-in slide-in-from-top-2 duration-200 relative">
                    <div className="flex gap-2.5">
                      <ShieldAlert className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 font-sans">
                        <h4 className="text-xs font-bold text-red-955 tracking-tight font-sans">Verification Error</h4>
                        <p className="text-[11px] text-red-800 leading-normal select-text">{signupError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="signup-name" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">Full Name</label>
                  <input 
                    id="signup-name"
                    type="text" 
                    required 
                    placeholder="e.g. Uzair Shinwari"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-955 focus-visible:ring-2 focus-visible:ring-slate-950"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-email" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">University Email Address</label>
                  <input 
                    id="signup-email"
                    type="email" 
                    required 
                    placeholder="e.g. uzair.cs@uop.edu.pk"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-955 focus-visible:ring-2 focus-visible:ring-slate-955"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="signup-role" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">Register As</label>
                    <select 
                      id="signup-role"
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value as UserRole)}
                      className="w-full text-sm px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-955 focus-visible:ring-2 focus-visible:ring-slate-955 font-medium"
                    >
                      <option value={UserRole.STUDENT}>Student Partner</option>
                      <option value={UserRole.CLIENT}>Client Partner</option>
                    </select>
                  </div>
                  
                  {signupRole === UserRole.STUDENT && (
                    <div className="space-y-1">
                      <label htmlFor="signup-id" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">Student Roll Num</label>
                      <input 
                        id="signup-id"
                        type="text" 
                        placeholder="e.g. UOP-1892CS"
                        required
                        value={signupId}
                        onChange={(e) => setSignupId(e.target.value)}
                        className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-955"
                      />
                    </div>
                  )}
                </div>

                {signupRole === UserRole.STUDENT && (
                  <div className="grid grid-cols-2 gap-3 transition-opacity">
                    <div className="space-y-1">
                      <label htmlFor="signup-univ" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">University</label>
                      <select 
                        id="signup-univ"
                        value={signupUniv}
                        onChange={(e) => setSignupUniv(e.target.value)}
                        className="w-full text-sm px-2 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-955"
                      >
                        <option value="University of Peshawar">University of Peshawar</option>
                        <option value="FAST NUCES, Peshawar Campus">FAST NUCES, Peshawar</option>
                        <option value="IM Sciences, Peshawar">IM Sciences, Peshawar</option>
                        <option value="UET Peshawar">UET Peshawar</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="signup-dept" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">Department</label>
                      <select 
                        id="signup-dept"
                        value={signupDept}
                        onChange={(e) => setSignupDept(e.target.value)}
                        className="w-full text-sm px-2 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-955"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Management Sciences">Management Sciences</option>
                        <option value="Art & Graphic Design">Art & Graphic Design</option>
                      </select>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3 bg-slate-900 border border-slate-955 text-white rounded-xl text-xs font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-955 focus-visible:ring-offset-2 transition-all shadow-md shadow-slate-300"
                >
                  Generate & Send Verification PIN
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Premium Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800/80 mt-16 select-none font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/logo.webp" alt="NEXUS logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-extrabold tracking-tight">NEXUS Platform</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Connecting university students across Pakistan with high quality production projects. Powered by an intelligent Campus Reputation score and premium verification guards.
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Peshawar Pilot Network</h5>
            <ul className="text-xs text-slate-400 space-y-2 font-mono">
              <li>• University of Peshawar</li>
              <li>• FAST NUCES Peshawar Campus</li>
              <li>• IM Sciences Peshawar</li>
              <li>• UET Peshawar</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Security & Verification</h5>
            <p className="text-xs text-slate-400 leading-normal max-w-xs">
              All students are required to verify their student identification card issued by their provost department. Verification awards the Verified Badge and activates index ranking algorithms.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-4">
          <span>&copy; {new Date().getFullYear()} NEXUS Enterprise, Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-350">Privacy Code</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-350">Platform Rules</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
