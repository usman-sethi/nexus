import React, { useState, useEffect } from "react";
import { StudentProfile, UserSession, VerificationStatus } from "../types";
import { Award, Briefcase, Github, Globe, Plus, Trash2, Sparkles, RefreshCw, Star, MessageSquare, ShieldCheck, ShieldAlert } from "lucide-react";
import CloudinaryUpload from "./CloudinaryUpload";

interface StudentProfileViewProps {
  session: UserSession;
  onUpdateSession: (updated: UserSession) => void;
}

export default function StudentProfileView({ session, onUpdateSession }: StudentProfileViewProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom states
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  
  // Portfolio states
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [pfTitle, setPfTitle] = useState("");
  const [pfDesc, setPfDesc] = useState("");
  const [pfType, setPfType] = useState<"image" | "link">("image");
  const [pfUrl, setPfUrl] = useState("");
  const [pfGithub, setPfGithub] = useState("");
  const [pfLive, setPfLive] = useState("");

  // AI optimizer state
  const [optimizingAdd, setOptimizingAdd] = useState(false);
  const [reviewReplies, setReviewReplies] = useState<Record<string, string>>({});

  // Verification submit states
  const [vFullName, setVFullName] = useState("");
  const [vStudentId, setVStudentId] = useState("");
  const [vUniv, setVUniv] = useState("University of Peshawar");
  const [vDept, setVDept] = useState("Computer Science");
  const [vDegree, setVDegree] = useState("BS Computer Science");
  const [vCardUrl, setVCardUrl] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [vSuccessMsg, setVSuccessMsg] = useState("");

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCardUrl) {
      alert("Please upload your Student ID Card image to Cloudinary first!");
      return;
    }

    try {
      setSubmittingVerification(true);
      const res = await fetch("/api/verification-requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: vFullName,
          university: vUniv,
          department: vDept,
          degreeProgram: vDegree,
          studentIdNum: vStudentId,
          idCardUrl: vCardUrl
        })
      });

      if (res.ok) {
        setVSuccessMsg("Verification request logged with the Provost Office successfully!");
        onUpdateSession({
          ...session,
          verificationStatus: VerificationStatus.PENDING,
          isVerifiedStudent: false
        });
        await fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profiles/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setHeadline(data.headline);
        setBio(data.bio);
        setSkills(data.skills.join(", "));
      } else {
        console.error("Student profile not indexed yet.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session.id]);

  // Update bio actions
  const handleUpdateBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`/api/profiles/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          bio,
          skills: skillsArray
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditingBio(false);
        onUpdateSession({
          ...session,
          isVerifiedStudent: updated.verificationStatus === VerificationStatus.APPROVED,
          verificationStatus: updated.verificationStatus
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add portfolio
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pfTitle,
          description: pfDesc,
          mediaType: pfType,
          mediaUrl: pfUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
          githubUrl: pfGithub,
          liveUrl: pfLive
        })
      });

      if (res.ok) {
        setShowAddPortfolio(false);
        setPfTitle("");
        setPfDesc("");
        setPfUrl("");
        setPfGithub("");
        setPfLive("");
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete portfolio
  const handleDeletePortfolio = async (itemId: string) => {
    try {
      const res = await fetch(`/api/portfolio/${itemId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Gemini Portfolio Optimizer using Server Action API
  const handleOptimizeDescription = async () => {
    if (!pfTitle || !pfDesc) return;
    try {
      setOptimizingAdd(true);
      const res = await fetch("/api/ai/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemTitle: pfTitle,
          itemDescription: pfDesc,
          skillsUsed: skills.split(",").map(s => s.trim())
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPfDesc(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizingAdd(false);
    }
  };

  // Review reply
  const handleReviewReply = async (reviewId: string) => {
    if (!reviewReplies[reviewId]) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: reviewReplies[reviewId] })
      });
      if (res.ok) {
        fetchProfile();
        setReviewReplies({ ...reviewReplies, [reviewId]: "" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-sans">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-mono">Loading Profile Credentials...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-slate-505 font-sans">
        No student record located. Please register via login toggle bar.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 font-sans">
      {/* Profile Header Block */}
      <div className="relative bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="relative shrink-0">
          <img 
            src={profile.avatar} 
            alt={profile.name} 
            className="w-24 h-24 rounded-full border-2 border-slate-100 shadow-sm"
            referrerPolicy="no-referrer"
          />
          {profile.verificationStatus === VerificationStatus.APPROVED && (
            <span className="absolute -bottom-1 -right-1 bg-sky-505 text-white p-1.5 rounded-full shadow-lg border border-white">
              ★
            </span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{profile.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                profile.verificationStatus === VerificationStatus.APPROVED 
                  ? "bg-sky-50 text-sky-700 border border-sky-100" 
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {profile.verificationStatus === VerificationStatus.APPROVED ? "VERIFIED STUDENT BADGE" : "IDENTITY PENDING"}
              </span>
              <span className="text-xs text-slate-400 font-medium">{profile.university} • {profile.department}</span>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-705">{profile.headline}</p>

          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{profile.bio}</p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.skills.map(skill => (
              <span key={skill} className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs border border-slate-100 font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setIsEditingBio(!isEditingBio)}
          className="px-4 py-2 hover:bg-slate-55 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shrink-0"
        >
          {isEditingBio ? "Cancel" : "Update Profile"}
        </button>
      </div>

      {/* Edit Bio Form */}
      {isEditingBio && (
        <form onSubmit={handleUpdateBio} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Edit Profile Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prof-headline" className="text-xs font-mono font-bold text-slate-707">Professional Headline</label>
              <input 
                id="prof-headline"
                type="text" 
                value={headline} 
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prof-skills" className="text-xs font-mono font-bold text-slate-707">Skills (Comma separated list)</label>
              <input 
                id="prof-skills"
                type="text" 
                value={skills} 
                onChange={(e) => setSkills(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="prof-bio" className="text-xs font-mono font-bold text-slate-707">Student Bio</label>
            <textarea 
              id="prof-bio"
              rows={3}
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white text-slate-955 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400" 
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900">
              Save Parameters
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campus Reputation Score (CRS) Engine Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
            <div className="space-y-1.5 relative z-10">
              <span className="text-[10px] font-mono font-semibold tracking-widest text-indigo-300 uppercase">Automated Reputation Engine</span>
              <h3 className="text-lg font-bold">Campus Reputation Score</h3>
            </div>

            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <span className="text-3xl font-extrabold text-indigo-200">{profile.crsScore}</span>
              </div>
              <div>
                <p className="text-xs text-indigo-200">System Standing</p>
                <p className="text-xs font-bold text-slate-300">
                  {profile.crsScore >= 85 ? "⭐️ Elite Peer Rank" : profile.crsScore >= 70 ? "✅ Verified Peer Track" : "⭐️ Standard peer Index"}
                </p>
              </div>
            </div>

            {/* Score variables details */}
            <div className="space-y-3 font-mono text-[11px] pt-4 border-t border-indigo-950 relative z-10">
              <div className="flex justify-between items-center text-slate-400">
                <span>Completed Tasks (30%)</span>
                <span className="text-indigo-300 font-semibold">{profile.completedProjectCount} projects</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Rating Average (25%)</span>
                <span className="text-indigo-300 font-semibold">{profile.rating} / 5.0</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Verified Status (15%)</span>
                <span className="text-indigo-300 font-semibold">{profile.verificationStatus}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Index Showcases (20%)</span>
                <span className="text-indigo-300 font-semibold">{profile.portfolio.length} items</span>
              </div>
            </div>

            {/* Subtle element background noise */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/25 blur-2xl rounded-full" />
          </div>

          {/* Social Links Block */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Campus Credentials info</h4>
            <div className="space-y-2 text-xs font-mono text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span>Degree Level</span>
                <span className="font-semibold text-slate-900">{profile.degreeProgram}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span>Enrollment Year</span>
                <span className="font-semibold text-slate-900">{profile.degreeYear}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>College Email</span>
                <span className="font-semibold text-slate-900">{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Identity Verification Subsection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Verified Student Badge Status</h4>
            
            {profile.verificationStatus === VerificationStatus.APPROVED ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-800">Reputation Account Fully Verified</p>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">Your university ID credentials match. The official Verified Student badge is ACTIVE on your marketplace indexes.</p>
                </div>
              </div>
            ) : profile.verificationStatus === VerificationStatus.PENDING ? (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800">Verification Pending Administrative Approval</p>
                  <p className="text-[10px] text-amber-700 leading-relaxed">Your Student ID card and credentials are currently in the Provost Office review queue. You'll receive verification shortly.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 flex-row">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-rose-800">Identity Not Verified</p>
                    <p className="text-[10px] text-rose-600 leading-relaxed">Please submit your university credentials and upload your legal student ID photo using the form below to unlock global pilot ranks.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitVerification} className="space-y-3 pt-1">
                  {vSuccessMsg && (
                    <p className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">{vSuccessMsg}</p>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Full Legal Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Uzair Khan"
                      required
                      value={vFullName}
                      onChange={(e) => setVFullName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-950"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Student Roll / Registration ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UOP-1829CS"
                      required
                      value={vStudentId}
                      onChange={(e) => setVStudentId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-955"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-955">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">University</label>
                      <select 
                        value={vUniv} 
                        onChange={(e) => setVUniv(e.target.value)}
                        className="w-full text-[11px] px-2 py-2 border border-slate-200 bg-white rounded-xl"
                      >
                        <option value="University of Peshawar">University of Peshawar</option>
                        <option value="FAST NUCES, Peshawar Campus">FAST NUCES</option>
                        <option value="IM Sciences, Peshawar">IM Sciences</option>
                        <option value="UET Peshawar">UET Peshawar</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Department</label>
                      <select 
                        value={vDept} 
                        onChange={(e) => setVDept(e.target.value)}
                        className="w-full text-[11px] px-2 py-2 border border-slate-200 bg-white rounded-xl"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Art & Graphic Design">Graphic Design</option>
                        <option value="Management Sciences">Management</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1.5">
                    <CloudinaryUpload 
                      onUploadSuccess={(url) => setVCardUrl(url)} 
                      label="Upload Student ID Card Photo to Cloudinary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVerification}
                    className="w-full mt-2 py-2.5 text-center text-xs font-bold font-sans text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:shadow-md transition-all shrink-0"
                  >
                    {submittingVerification ? "Uploading Security Portfolio..." : "Submit Verification Packet"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio CRUD & Feedbacks */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Portfolio block */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                  Portfolio Directory
                </h3>
                <p className="text-xs text-slate-505">Student creative showcases in development, design and systems.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddPortfolio(!showAddPortfolio)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 text-xs font-semibold transition-all"
              >
                <Plus className="h-4 w-4" /> Add Showcase
              </button>
            </div>

            {/* Add Portfolio Showcase form */}
            {showAddPortfolio && (
              <form onSubmit={handleAddPortfolio} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    ✦ Construct Showcase
                  </h4>
                  <button 
                    type="button"
                    onClick={handleOptimizeDescription}
                    disabled={optimizingAdd}
                    className="px-2.5 py-1 rounded bg-sky-50 text-sky-700 font-mono text-[10px] font-bold border border-sky-100 hover:bg-sky-100 flex items-center gap-1 transition-all"
                  >
                    {optimizingAdd ? "CTO Parsing..." : "Optimize Narrative with Gemini AI"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-semibold text-slate-500">Project Showcase Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Peshawar Campus Transport Tracker"
                      required
                      value={pfTitle}
                      onChange={(e) => setPfTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-950 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-semibold text-slate-500">Showcase Type</label>
                      <select 
                        value={pfType} 
                        onChange={(e) => setPfType(e.target.value as any)}
                        className="w-full text-xs px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-955"
                      >
                        <option value="image">Snapshot Image</option>
                        <option value="link">Anchor Link</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-semibold text-slate-500">Image Asset URL (Option)</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        value={pfUrl}
                        onChange={(e) => setPfUrl(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-955"
                      />
                    </div>
                  </div>
                </div>

                {pfType === "image" && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <CloudinaryUpload 
                      onUploadSuccess={(url) => setPfUrl(url)} 
                      label="Upload Portfolio Snapshot Showcase Image to Cloudinary"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold text-slate-505">Impact Narrative / Explanation</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter project metrics & tech stack utilized. Pro tip: Type a basic draft then hit the Gemini AI optimization trigger above!"
                    required
                    value={pfDesc}
                    onChange={(e) => setPfDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-955 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="GitHub repository link (e.g. https://...)" 
                    value={pfGithub}
                    onChange={(e) => setPfGithub(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-955 bg-white"
                  />
                  <input 
                    type="text" 
                    placeholder="Live URL / Deployment link" 
                    value={pfLive}
                    onChange={(e) => setPfLive(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-955 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => setShowAddPortfolio(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[10px] uppercase font-bold rounded-lg hover:bg-slate-350"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 text-white bg-slate-900 text-[10px] uppercase font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1"
                  >
                    Confirm & Publish
                  </button>
                </div>
              </form>
            )}

            {/* Render items list */}
            {profile.portfolio.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                Your portfolio directory is currently empty. Build confidence by adding items!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.portfolio.map(item => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-indigo-100 transition-all bg-white group select-none">
                    <div className="relative aspect-video w-full bg-slate-100 border-b border-slate-50">
                      <img 
                        src={item.mediaUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5 font-sans">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                          <button 
                            type="button"
                            onClick={() => handleDeletePortfolio(item.id)}
                            className="p-1 rounded text-slate-300 hover:text-red-505 hover:bg-red-50 shrink-0 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans leading-relaxed">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50 font-sans">
                        {item.githubUrl && (
                          <a 
                            href={item.githubUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        {item.liveUrl && (
                          <a 
                            href={item.liveUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Reviews history and student replies */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="h-5 w-5 text-slate-400" />
              Evaluation History & Reviews
            </h3>

            {profile.reviews.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-xs font-sans">
                No evaluations completed yet. Active student opportunities generate standings here.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {profile.reviews.map(rev => (
                  <div key={rev.id} className="py-4 space-y-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={rev.reviewerAvatar} 
                          alt={rev.reviewerName} 
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-955 font-mono">{rev.reviewerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Date: {new Date(rev.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                        ★ {rev.rating}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic">{rev.comment}</p>

                    {/* Respond to evaluation trigger */}
                    {rev.replyText ? (
                      <div className="p-3 rounded-lg bg-slate-50 text-[11px] text-slate-600 border border-slate-100 font-sans">
                        <p className="font-bold text-slate-900 font-mono text-[9px] uppercase tracking-wider mb-0.5">Your Response</p>
                        <span>{rev.replyText}</span>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 font-sans">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Respond back politely to client feedback..."
                            value={reviewReplies[rev.id] || ""}
                            onChange={(e) => setReviewReplies({ ...reviewReplies, [rev.id]: e.target.value })}
                            className="flex-1 text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-slate-950 bg-white"
                          />
                          <button 
                            type="button"
                            onClick={() => handleReviewReply(rev.id)}
                            className="px-3 py-1.5 text-white bg-slate-900 hover:bg-slate-800 text-[10px] uppercase font-bold rounded-lg transition-all"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
