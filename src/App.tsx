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
  const [googleClientId, setGoogleClientId] = useState<string>("1022623483654-3vhj3a028s8bhovk6eabnu7fm2uuql0v.apps.googleusercontent.com");
  const [showOauthHelp, setShowOauthHelp] = useState(false);

  // Seeding/State communication transitions
  const [activeChatTarget, setActiveChatTarget] = useState<string | undefined>(undefined);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
      
      const configRes = await fetch("/api/auth/google/config");
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.clientId) {
          setGoogleClientId(data.clientId);
        }
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

  // Google OAuth Popup-based and GIS integrations
  useEffect(() => {
    // 1. Dynamic Script Injection
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Register callback globally
    (window as any).handleGoogleCredentialResponse = async (response: any) => {
      try {
        const res = await fetch("/api/auth/google/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.credential })
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setShowSignup(false);
          // Reload notifications list
          fetchNotifications();
        }
      } catch (error) {
        console.error("Google authentication token verification failed:", error);
      }
    };

    // 2. Listening for Popup OAuth message triggers as per guidelines
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log('[POPUP OAUTH SUCCESS] Authorizing code callback...');
        await fetchSession();
        setShowSignup(false);
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  // Initialize and Render GIS Button programmatically when Modals are open
  useEffect(() => {
    if (showSignup && typeof window !== "undefined") {
      const interval = setInterval(() => {
        if ((window as any).google) {
          clearInterval(interval);
          try {
            (window as any).google.accounts.id.initialize({
              client_id: googleClientId,
              callback: (window as any).handleGoogleCredentialResponse,
            });
            const btnParent = document.getElementById("google-signin-btn");
            if (btnParent) {
              (window as any).google.accounts.id.renderButton(btnParent, {
                theme: "outline",
                size: "large",
                width: 320,
                text: "continue_with"
              });
            }
          } catch (e) {
            console.warn("GIS initialization delayed:", e);
          }
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showSignup, googleClientId]);

  // Method to open standard popup authorization page as fallback as per guidelines
  const handlePopupGoogleAuth = async () => {
    try {
      const res = await fetch("/api/auth/google/url");
      if (res.ok) {
        const { url } = await res.json();
        const width = 500;
        const height = 620;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          url,
          "NEXUS Authorize Node",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
        );
      }
    } catch (err) {
      console.error("Unable to initiate Popup OAuth Authorization:", err);
    }
  };

  const handleSimulateGoogleAuth = async () => {
    try {
      const mockPayload = {
        email: signupEmail || "mohammad.khyber@uop.edu.pk",
        name: signupName || "Mohammad Khyber",
        picture: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(signupName || "Mohammad Khyber")}`
      };
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify(mockPayload));
      const signature = "mock_google_signature";
      const mockToken = `${header}.${payload}.${signature}`;

      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mockToken })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        setShowSignup(false);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Google authentication simulation failed:", error);
    }
  };

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
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          role: signupRole,
          university: signupUniv,
          department: signupDept,
          studentIdNum: signupId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data);
        setShowSignup(false);
        if (signupRole === UserRole.STUDENT) {
          setActiveTab("profile");
        } else {
          setActiveTab("client-dash");
        }
      }
    } catch (error) {
      console.error(error);
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
            <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-950/20">
              <span className="font-extrabold text-white text-base font-mono">N</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-950 leading-none">NEXUS</h1>
              <span className="text-[9px] font-extrabold font-mono text-slate-600 tracking-wider leading-none block mt-1 uppercase">STUDENT ECOSYSTEM</span>
            </div>
          </div>

          {/* Core App Role Account switching (Vercel-like deployment bar) */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl" role="group" aria-label="Role Switcher">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-700 font-bold px-2">Inspect:</span>
            <button 
              onClick={() => handleSelectRole(UserRole.STUDENT)}
              disabled={roleSwitching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session?.role === UserRole.STUDENT 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
              }`}
              aria-pressed={session?.role === UserRole.STUDENT}
            >
              Student Workspace
            </button>
            <button 
              onClick={() => handleSelectRole(UserRole.CLIENT)}
              disabled={roleSwitching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session?.role === UserRole.CLIENT 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
              }`}
              aria-pressed={session?.role === UserRole.CLIENT}
            >
              Client / Buyer Workspace
            </button>
            <button 
              onClick={() => handleSelectRole(UserRole.ADMIN)}
              disabled={roleSwitching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session?.role === UserRole.ADMIN 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-250/50"
              }`}
              aria-pressed={session?.role === UserRole.ADMIN}
            >
              Provost Admin Office
            </button>
          </div>

          {/* Action Center (Account detail, notifications bell, signup) */}
          <div className="flex items-center gap-3">
            
            {/* Quick register trigger */}
            <button 
              onClick={() => setShowSignup(true)}
              className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl hover:bg-indigo-100/70 transition-colors flex items-center gap-1 shrink-0"
              aria-label="Process onboarding and sign up"
            >
              <UserPlus className="h-3.5 w-3.5" /> Sign up
            </button>

            {/* Notification alert */}
            {session && (
              <div className="relative">
                <button 
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

      {/* Account inspector toggle visual indicator on smaller viewports */}
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

      {/* Main Tab Navigation Header (Dashboard views selector) */}
      <nav className="bg-white border-b border-slate-200 shadow-sm select-none" role="tablist" aria-label="Workspace navigations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-x-auto h-12 scrollbar-none">
          <button 
            role="tab"
            aria-selected={activeTab === "marketplace"}
            aria-controls="nexus-app-root"
            tabIndex={0}
            onClick={() => setActiveTab("marketplace")}
            className={`h-full text-xs font-bold tracking-tight px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "marketplace" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingBag className="h-4 w-4" /> Gigs Marketplace
          </button>

          <button 
            role="tab"
            aria-selected={activeTab === "opportunities"}
            aria-controls="nexus-app-root"
            tabIndex={0}
            onClick={() => setActiveTab("opportunities")}
            className={`h-full text-xs font-bold tracking-tight px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "opportunities" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="h-4 w-4" /> Opportunities Board
          </button>

          <button 
            role="tab"
            aria-selected={activeTab === "messaging"}
            aria-controls="nexus-app-root"
            tabIndex={0}
            onClick={() => setActiveTab("messaging")}
            className={`h-full text-xs font-bold tracking-tight px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "messaging" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Messaging Inbox
          </button>

          {session?.role === UserRole.STUDENT && (
            <button 
              role="tab"
              aria-selected={activeTab === "profile"}
              aria-controls="nexus-app-root"
              tabIndex={0}
              onClick={() => setActiveTab("profile")}
              className={`h-full text-xs font-bold tracking-tight px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === "profile" 
                  ? "border-slate-900 text-slate-950" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="h-4 w-4" /> My Profile Portfolio
            </button>
          )}

          {session?.role === UserRole.CLIENT && (
            <button 
              role="tab"
              aria-selected={activeTab === "client-dash"}
              aria-controls="nexus-app-root"
              tabIndex={0}
              onClick={() => setActiveTab("client-dash")}
              className={`h-full text-xs font-bold tracking-tight px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === "client-dash" 
                  ? "border-slate-900 text-slate-950" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Client Workspace dashboard
            </button>
          )}

          {session?.role === UserRole.ADMIN && (
            <button 
              role="tab"
              aria-selected={activeTab === "admin"}
              aria-controls="nexus-app-root"
              tabIndex={0}
              onClick={() => setActiveTab("admin")}
              className={`h-full text-xs font-bold tracking-tight px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === "admin" 
                  ? "border-slate-900 text-slate-950" 
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
        
        {/* Onboarding Showcase visual element in main screen when search is empty */}
        {activeTab === "marketplace" && !activeChatTarget && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden backdrop-blur">
              <div className="max-w-xl space-y-4 relative z-10">
                <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Discover student talent. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-600">Build real experiences.</span>
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Connecting University of Peshawar students with local and provincial businesses. Show your skill cards, assemble portfolios with **Gemini AI optimizations**, offer services, and earn.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm font-mono">
                    <Cpu className="h-3.5 w-3.5 text-indigo-500" /> Server-side Gemini 3.5 Active
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm font-mono">
                    <Compass className="h-3.5 w-3.5 text-sky-500" /> Peshawar Pilot Division
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
              onClick={() => setShowSignup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Close onboarding modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5">
              <h3 id="signup-modal-title" className="text-xl font-extrabold text-slate-950 tracking-tight font-heading">Onboard NEXUS Account</h3>
              <p className="text-xs text-slate-600">Become part of Pakistan's premier student opportunity platform.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 text-left">
              <div className="space-y-1">
                <label htmlFor="signup-name" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">Full Name</label>
                <input 
                  id="signup-name"
                  type="text" 
                  required 
                  placeholder="e.g. Uzair Shinwari"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950"
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
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="signup-role" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700">Register As</label>
                  <select 
                    id="signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full text-sm px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950 font-medium"
                  >
                    <option value={UserRole.STUDENT}>Student Partner</option>
                    <option value={UserRole.CLIENT}>Client / Client</option>
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
                      className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-955 focus-visible:ring-2 focus-visible:ring-slate-950"
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
                      className="w-full text-sm px-2 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950"
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
                      className="w-full text-sm px-2 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-955 focus-visible:ring-2 focus-visible:ring-slate-950"
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
                className="w-full py-3 bg-slate-900 border border-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-990 focus-visible:ring-offset-2 transition-all shadow-md shadow-slate-350"
              >
                Assemble Profile Identity Account
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3.5 text-[10px] font-mono text-slate-500 font-bold tracking-wider">Or Register Instantly</span>
                </div>
              </div>

              {/* Programmatic Google accounts signin button */}
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]" aria-label="Google sign-in button" />
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handlePopupGoogleAuth}
                    className="text-[10px] font-semibold font-mono text-slate-600 hover:text-indigo-600 underline focus-visible:ring-2 focus-visible:ring-slate-900 p-1 rounded transition-colors"
                  >
                    Trouble with OneTap? Launch Google OAuth Popup
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOauthHelp(!showOauthHelp)}
                    className="text-[10px] font-bold font-mono text-indigo-600 hover:text-indigo-800 underline focus-visible:ring-2 focus-visible:ring-indigo-600 p-1 rounded transition-colors"
                  >
                    {showOauthHelp ? "Hide Google OAuth Guide" : "Solve matching origin mismatch issues?"}
                  </button>
                </div>

                {showOauthHelp && (
                  <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-[11px] text-slate-700 space-y-2 leading-relaxed animate-in slide-in-from-top-1 duration-200 font-sans">
                    <p className="font-bold text-slate-900 text-xs">🛠️ Google OAuth Mismatch Diagnostics</p>
                    <p>
                      Because standard Google credentials restrict login requests to specific whitelisted addresses, dynamic workspace runtimes will trigger <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-mono">origin_mismatch</code> errors unless the current domain is whitelisted.
                    </p>
                    <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[8px] tracking-wider">Authorized JavaScript Origin:</span>
                        <span className="text-slate-800 break-all select-all font-semibold font-mono block p-1 bg-slate-50 rounded mt-0.5">{window.location.origin}</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-slate-400 block uppercase font-bold text-[8px] tracking-wider">Authorized Redirect URI:</span>
                        <span className="text-slate-800 break-all select-all font-semibold font-mono block p-1 bg-slate-50 rounded mt-0.5">{window.location.origin}/api/auth/google/callback</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      <strong>To permanently fix:</strong> Open your Google Cloud Console Credentials page, update your custom Google Client ID configuration settings with the values shown above, and define <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">GOOGLE_CLIENT_ID</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">GOOGLE_CLIENT_SECRET</code> variables in the AI Studio environment settings.
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      💡 <strong>Or bypass instantly:</strong> For immediate developers testing without console integration, click the emerald "Quick Dev Bypass" button below to log in safely with simulated tokens!
                    </p>
                  </div>
                )}

                <div className="w-full border-t border-dashed border-slate-200 my-1" />

                <button
                  type="button"
                  onClick={handleSimulateGoogleAuth}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title="Bypass origin mismatch limitations on development containers"
                >
                  <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                  Quick Dev Bypass (Google Sign-In)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800/80 mt-16 select-none font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="font-extrabold text-white text-sm font-mono">N</span>
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
