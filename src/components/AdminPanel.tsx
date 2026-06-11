import React, { useState, useEffect } from "react";
import { VerificationRequest, SystemAnalytics, VerificationStatus } from "../types";
import { Check, X, ShieldAlert, Award, FileText, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";

export default function AdminPanel() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [reqRes, analyticRes] = await Promise.all([
        fetch("/api/verification-requests"),
        fetch("/api/analytics")
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (analyticRes.ok) setAnalytics(await analyticRes.json());
    } catch (err) {
      console.error("Error retrieving administrative statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      setActioningId(id);
      const res = await fetch(`/api/verification-requests/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action, 
          feedback: feedback[id] || "" 
        })
      });

      if (res.ok) {
        // Optimistic state updates
        setRequests(prev => prev.map(r => r.id === id ? {
          ...r,
          status: action === "APPROVE" ? VerificationStatus.APPROVED : VerificationStatus.REJECTED
        } : r));
        
        // Reload analytics to verify matching student badge states
        const analyticRes = await fetch("/api/analytics");
        if (analyticRes.ok) setAnalytics(await analyticRes.json());
      }
    } catch (e) {
      console.error("Administrative action execution failed:", e);
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-mono">Retrieving active moderations...</span>
      </div>
    );
  }

  return (
    <div id="admin-panel" className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">Verified Ratio</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900">
              {analytics ? Math.round((analytics.verifiedStudents / Math.max(1, analytics.totalStudents)) * 100) : 0}%
            </span>
            <span className="text-xs font-medium text-emerald-600 font-mono">
              ({analytics?.verifiedStudents} of {analytics?.totalStudents})
            </span>
          </div>
          <p className="text-xs text-slate-500">Awarded the official Verified Badge</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">Active Gigs</p>
          <span className="text-3xl font-bold text-slate-900">{analytics?.totalGigs}</span>
          <p className="text-xs text-slate-500">Active listings in Marketplace</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">Opportunity Index</p>
          <span className="text-3xl font-bold text-slate-900">{analytics?.totalOpportunities}</span>
          <p className="text-xs text-slate-500">Live positions advertised</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 bg-gradient-to-br from-indigo-50/20 to-sky-50/20 border-indigo-100">
          <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider font-mono">Financial Volume</p>
          <span className="text-3xl font-extrabold text-slate-900">PKR {analytics?.totalVolumePKR.toLocaleString()}</span>
          <p className="text-xs text-slate-500">Active contracts & closed proposals</p>
        </div>
      </div>

      {/* Moderation section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Student Identity Moderation Gate
            </h2>
            <p className="text-xs text-slate-500">Verify student cards before granting Pakistan national platform badges.</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 font-mono transition-colors"
          >
            Refresh Queue
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm">Excellent! No pending student verifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div key={req.id} className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-slate-50/50 transition-colors">
                {/* ID Card Visual */}
                <div className="w-full lg:w-72 shrink-0">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    <img 
                      src={req.idCardUrl} 
                      alt="Student ID card reference"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-white font-medium px-2.5 py-1.5 bg-black/70 rounded-md shadow-lg flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Inspect Identity Document
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-amber-50/50 border border-amber-100 rounded-lg text-[11px] text-amber-700 flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Confirm enrollment details match university criteria below.</span>
                  </div>
                </div>

                {/* Account details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={req.profileImageUrl} 
                        alt={req.fullName} 
                        className="w-10 h-10 rounded-full border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{req.fullName}</h4>
                        <p className="text-xs font-mono text-slate-500">Student ID Ref: {req.studentIdNum}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        req.status === VerificationStatus.APPROVED 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : req.status === VerificationStatus.REJECTED
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-slate-400">University</p>
                      <p className="font-semibold text-slate-800">{req.university}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Department</p>
                      <p className="font-semibold text-slate-900">{req.department}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Program</p>
                      <p className="font-semibold text-slate-900">{req.degreeProgram}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Date Logged</p>
                      <p className="font-semibold text-slate-700">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {req.status === VerificationStatus.PENDING && (
                    <div className="space-y-3 pt-2">
                      <input 
                        type="text" 
                        placeholder="Add internal feedback / reason for rejection if necessary..."
                        value={feedback[req.id] || ""}
                        onChange={(e) => setFeedback({ ...feedback, [req.id]: e.target.value })}
                        aria-label={`Internal feedback for student verification request from ${req.fullName}`}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-indigo-600 focus:outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleAction(req.id, "REJECT")}
                          disabled={actioningId === req.id}
                          className="px-3 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Reject Enrollment
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, "APPROVE")}
                          disabled={actioningId === req.id}
                          className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm shadow-emerald-200"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve & Award Verified Badge
                        </button>
                      </div>
                    </div>
                  )}

                  {req.status === VerificationStatus.APPROVED && (
                    <div className="text-xs text-slate-500 flex items-center gap-1 bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100">
                      <Award className="h-4 w-4 shrink-0" /> Verified badge credentials added successfully. Representative and portfolio indexed into campus reputation engine.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
