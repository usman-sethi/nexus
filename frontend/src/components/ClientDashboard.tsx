import React, { useState, useEffect } from "react";
import { Opportunity, UserSession } from "../types";
import { PlusCircle, FileText, CheckCircle, XCircle, Send, Users, DollarSign, Award, RefreshCw } from "lucide-react";
import { CATEGORIES } from "../data";

interface ClientDashboardProps {
  session: UserSession;
  onOpenChat: (userId: string) => void;
}

export default function ClientDashboard({ session, onOpenChat }: ClientDashboardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Job Posting Form State
  const [showPostForm, setShowPostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState<"PROJECT" | "INTERNSHIP" | "PART_TIME">("PROJECT");
  const [budget, setBudget] = useState("");
  const [deliveryTimeDays, setDeliveryTimeDays] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [universityLimit, setUniversityLimit] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const oppsRes = await fetch("/api/opportunities");
        const allOpps: Opportunity[] = await oppsRes.json();
        const clientOpps = allOpps.filter(o => o.clientId === session.id);
        setOpportunities(clientOpps);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();

    // Pull periodic proposals
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/opportunities");
        if (res.ok) {
          const all: Opportunity[] = await res.json();
          setOpportunities(all.filter(o => o.clientId === session.id));
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [session.id]);

  // Handle Opportunity submission
  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget || !deliveryTimeDays) return;

    try {
      setIsPublishing(true);
      const skillsArray = skillsRequired.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          type,
          budget: Number(budget),
          deliveryTimeDays: Number(deliveryTimeDays),
          skillsRequired: skillsArray,
          universityLimit: universityLimit || undefined
        })
      });

      if (res.ok) {
        const newOpp = await res.json();
        setOpportunities(prev => [newOpp, ...prev]);
        setShowPostForm(false);
        // Reset state
        setTitle("");
        setDescription("");
        setBudget("");
        setDeliveryTimeDays("");
        setSkillsRequired("");
        setUniversityLimit("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-mono">Loading client space...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6">
      {/* Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-slate-200">
        <div className="space-y-2 relative z-10 font-sans">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white/10 rounded-full text-indigo-200">Client Workspace</span>
          <h2 className="text-2xl font-bold tracking-tight">Manage Campus Talent</h2>
          <p className="text-slate-400 text-sm max-w-lg">Post opportunities and connect with specialized students from regional colleges.</p>
        </div>
        <button 
          onClick={() => setShowPostForm(!showPostForm)}
          className="px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 relative z-10 shrink-0 shadow-lg"
        >
          <PlusCircle className="h-4 w-4" />
          {showPostForm ? "Close Form" : "Publish Opportunity"}
        </button>
        {/* Subtle background decoration */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* Post Opportunity Form */}
      {showPostForm && (
        <form onSubmit={handleSubmitJob} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Publish New Project / Internship position</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 font-sans">
              <label htmlFor="client-opp-title" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Opportunity Title</label>
              <input 
                id="client-opp-title"
                type="text" 
                placeholder="e.g. Peshawar Artisans Web Store Builder Needed"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 font-sans">
              <div className="space-y-1.5">
                <label htmlFor="client-opp-category" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Category</label>
                <select 
                  id="client-opp-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none font-medium"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="client-opp-type" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Contract Type</label>
                <select 
                  id="client-opp-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none font-medium"
                >
                  <option value="PROJECT">Fixed Project</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="PART_TIME">Part-Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <label htmlFor="client-opp-desc" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Work Scope & Specifications</label>
            <textarea 
              id="client-opp-desc"
              rows={4}
              placeholder="Incorporate required deliverables, technologies, milestones, and project goals fully..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
            <div className="space-y-1.5">
              <label htmlFor="client-opp-budget" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Budget (PKR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 font-bold">Rs.</span>
                <input 
                  id="client-opp-budget"
                  type="number" 
                  placeholder="30000"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-opp-duration" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Expected Duration (Days)</label>
              <input 
                id="client-opp-duration"
                type="number" 
                placeholder="14"
                required
                value={deliveryTimeDays}
                onChange={(e) => setDeliveryTimeDays(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-opp-univ" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Restricted University (Optional)</label>
              <input 
                id="client-opp-univ"
                type="text" 
                placeholder="e.g. University of Peshawar"
                value={universityLimit}
                onChange={(e) => setUniversityLimit(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="client-opp-skills" className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Key Skills (Comma separated)</label>
              <input 
                id="client-opp-skills"
                type="text" 
                placeholder="React, Tailwind, Node"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button 
              type="button" 
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPublishing}
              className="px-5 py-2.5 text-white bg-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
            >
              {isPublishing ? "Publishing Index..." : "Confirm & Advertise Position"}
            </button>
          </div>
        </form>
      )}

      {/* Published Positions & Applicant review */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Opportunities Index */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 self-start">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1 font-sans">
              <FileText className="h-4 w-4 text-slate-400" />
              Published Opportunities ({opportunities.length})
            </h3>
            <button 
              type="button"
              onClick={() => {}}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-sans">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              You haven't posted any positions yet.
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map(opp => (
                <div key={opp.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-white transition-all space-y-3 font-sans">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {opp.type}
                    </span>
                    <h5 className="text-sm font-semibold text-slate-900 mt-1.5">{opp.title}</h5>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-505">
                    <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" /> Rs.{opp.budget.toLocaleString()}</span>
                    <span>{opp.applicationsCount} proposals</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proposals review / applications center */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1 font-sans">
            <Users className="h-4 w-4 text-slate-400" />
            Proposals Review Division
          </h3>

          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 font-sans">
            <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
              <Award className="h-4 w-4 text-indigo-600" />
              How we evaluate students
            </p>
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              Choose students with robust Campus Reputation Scores (CRS). CRS is structured automatically: Completed projects (30%), Client Ratings (25%), Portfolios (20%), and Verification Badges (15%).
            </p>
          </div>

          {/* Render real-time interactive applications from students */}
          <div className="space-y-6 font-sans">
            {/* Seed / Dynamic Application Showcase */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" 
                    alt="Zeeshan Ahmad" 
                    className="w-12 h-12 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 font-sans">Zeeshan Ahmad</h4>
                      <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        CRS: 88
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">University of Peshawar • BS Computer Science</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-sm font-bold text-slate-900">PKR 42,000</p>
                  <p className="text-xs font-mono text-slate-400">18 days delivery</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-mono font-semibold mb-1">Applicant Proposal Profile</p>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed font-sans">
                  "Hi Zawar, I am perfectly suited for this web application project. I have extensive experience building scalable solutions like my Peshawar Artisans project. I can write beautiful Tailwind panels, secure session trackers, and integrate local server actions on our custom Next server. Looking forward to engineering this together!"
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => onOpenChat("student_1")}
                    className="px-3.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold transition-all flex items-center gap-1"
                  >
                    Send message
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">Attachment: [Khyber Artisans Store]</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-0.5 transition-colors">
                    <XCircle className="h-3.5 w-3.5" /> Decline
                  </button>
                  <button type="button" className="px-3.5 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold flex items-center gap-0.5 shadow-sm transition-all shadow-emerald-200">
                    Confirm Hire
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-mono">Real-time candidate pipelines synchronize dynamically inside local memory database .data/nexus_db.json</p>
          </div>
        </div>
      </div>
    </div>
  );
}
