import React, { useState, useEffect } from "react";
import { Opportunity, UserSession } from "../types";
import { Sparkles, Calendar, DollarSign, Award, RefreshCw, Send, CheckCircle2 } from "lucide-react";

interface OpportunitiesProps {
  session: UserSession;
  onApplySuccess: () => void;
}

export default function OpportunitiesBoard({ session, onApplySuccess }: OpportunitiesProps) {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  // Application inputs
  const [proposalText, setProposalText] = useState("");
  const [requestedBudget, setRequestedBudget] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [applying, setApplying] = useState(false);
  const [draftingAI, setDraftingAI] = useState(false);
  const [successApply, setSuccessApply] = useState(false);

  const fetchOpps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/opportunities");
      if (res.ok) {
        setOpps(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  // Gemini AI proposal companion generator!
  const handleAIDraftProposal = async () => {
    if (!selectedOpp) return;
    try {
      setDraftingAI(true);
      // Fetch current student profile bio to align competencies perfectly
      const profileRes = await fetch(`/api/profiles/${session.id}`);
      let bio = "Pursuing Computer Science at University of Peshawar.";
      let skills = ["React", "TypeScript", "Tailwind"];

      if (profileRes.ok) {
        const studentObj = await profileRes.json();
        bio = studentObj.bio;
        skills = studentObj.skills;
      }

      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityTitle: selectedOpp.title,
          opportunityDescription: selectedOpp.description,
          studentBio: bio,
          studentSkills: skills,
          requestedBudget: requestedBudget || selectedOpp.budget
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProposalText(data.text);
      }
    } catch (e) {
      console.error("AI Proposal composer error:", e);
    } finally {
      setDraftingAI(false);
    }
  };

  // Submit Application
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp || !proposalText) return;

    try {
      setApplying(true);
      const res = await fetch(`/api/opportunities/${selectedOpp.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalText,
          requestedBudget: requestedBudget ? Number(requestedBudget) : selectedOpp.budget,
          deliveryDays: deliveryDays ? Number(deliveryDays) : selectedOpp.deliveryTimeDays,
          attachedPortfolioIds: []
        })
      });

      if (res.ok) {
        setSuccessApply(true);
        setProposalText("");
        setRequestedBudget("");
        setDeliveryDays("");
        setTimeout(() => {
          setSuccessApply(false);
          setSelectedOpp(null);
          fetchOpps();
          onApplySuccess();
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || "Execution failed filing application.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-mono">Loading opportunities board...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6">
      
      {/* Visual Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Board opportunities cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-sans uppercase tracking-tight">University Project & Placement Board</h3>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <RefreshCw className="h-3 h-3 cursor-pointer" onClick={fetchOpps} /> Refreshed real-time
            </span>
          </div>

          <div className="space-y-4">
            {opps.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400 bg-white border rounded-2xl">
                No active requirements posted currently on the platform.
              </p>
            ) : (
              opps.map(opp => (
                <div 
                  key={opp.id} 
                  onClick={() => { setSelectedOpp(opp); setSuccessApply(false); }}
                  className={`p-6 rounded-2xl bg-white border transition-all cursor-pointer select-none space-y-4 ${
                    selectedOpp?.id === opp.id 
                      ? "border-slate-800 ring-1 ring-slate-800 shadow-md" 
                      : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded">
                          {opp.type}
                        </span>
                        {opp.universityLimit && (
                          <span className="text-[10px] font-bold font-mono text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded flex items-center gap-0.5">
                            <Award className="h-3 w-3" /> {opp.universityLimit}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-950 leading-snug">{opp.title}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">PKR {opp.budget.toLocaleString()}</span>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">Budget limit</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">{opp.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {opp.skillsRequired.map(sk => (
                      <span key={sk} className="text-[10px] font-mono bg-slate-50 border border-slate-100 text-slate-500 rounded px-2.5 py-1">
                        {sk}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-50">
                    <span>Deadline: {opp.deadline}</span>
                    <span>{opp.applicationsCount} competitors applied</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Opp Application Drawer Panel */}
        <div className="lg:col-span-1">
          {selectedOpp ? (
            <div className="bg-white p-6 rounded-3xl border border-indigo-100/60 shadow-lg shadow-indigo-100/20 space-y-6 self-start sticky top-6">
              
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-600 uppercase">Apply to Listing</span>
                <h4 className="text-sm font-extrabold text-slate-950 leading-tight">{selectedOpp.title}</h4>
                <div className="flex items-center gap-2 pt-1">
                  <img 
                    src={selectedOpp.clientAvatar} 
                    alt={selectedOpp.clientName} 
                    className="w-5 h-5 rounded-full"
                  />
                  <p className="text-[11px] text-slate-500 font-mono font-semibold">{selectedOpp.clientCompany || selectedOpp.clientName}</p>
                </div>
              </div>

              {successApply ? (
                <div className="p-6 text-center text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2 flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  <p className="text-sm font-bold">Proposal Dispatched!</p>
                  <p className="text-xs leading-relaxed">Your application was stored successfully inside NEXUS database network.</p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4 pt-2">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                    <span className="text-[10px] font-sans font-bold text-slate-600">Draft with Gemini Flash AI</span>
                    <button 
                      type="button" 
                      onClick={handleAIDraftProposal}
                      disabled={draftingAI}
                      className="px-2 py-1 bg-white text-indigo-600 border border-slate-100 rounded text-[9px] font-mono font-bold hover:bg-slate-50 flex items-center gap-0.5"
                    >
                      <Sparkles className="h-3 w-3 text-indigo-600" /> {draftingAI ? "Synthesizing..." : "Auto Draft Proposals"}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="proposal-text" className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Proposal Cover Letter</label>
                    <textarea 
                      id="proposal-text"
                      rows={5}
                      placeholder="Discuss how your student background fits their required stack perfectly..."
                      required
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-indigo-600 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="proposal-budget" className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Asking Budget (PKR)</label>
                      <input 
                        id="proposal-budget"
                        type="number" 
                        placeholder={selectedOpp.budget.toString()}
                        value={requestedBudget}
                        onChange={(e) => setRequestedBudget(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="proposal-days" className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Delivery Speed (Days)</label>
                      <input 
                        id="proposal-days"
                        type="number" 
                        placeholder={selectedOpp.deliveryTimeDays.toString()}
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={applying}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" /> {applying ? "Dispatched state..." : "Dispatch Project proposal"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200/50 rounded-3xl text-center text-xs text-slate-400 font-mono py-16">
              Select an active opportunity on the left board to review requirements & compose proposal details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
