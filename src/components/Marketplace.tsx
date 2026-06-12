import React, { useState, useEffect } from "react";
import { ServiceGig, UserSession, UserRole } from "../types";
import { CATEGORIES, UNIVERSITIES } from "../data";
import { Filter, Star, Search, CreditCard, MessageSquare, Plus, RefreshCw, Sparkles, Award } from "lucide-react";

interface MarketplaceProps {
  session: UserSession;
  onOpenChat: (userId: string) => void;
  onPostSuccess: () => void;
}

export default function Marketplace({ session, onOpenChat, onPostSuccess }: MarketplaceProps) {
  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  // Post new Gig Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [startingPrice, setStartingPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("3");
  const [tags, setTags] = useState("");
  const [galleryUrl, setGalleryUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // AI assistant optimizer for Gig creation!
  const [aiOptimizing, setAiOptimizing] = useState(false);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gigs");
      if (res.ok) {
        setGigs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  // Post Gig action
  const handlePublishGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !startingPrice) return;

    try {
      setIsPublishing(true);
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: desc,
          category,
          tags: tagsArray,
          startingPrice: Number(startingPrice),
          deliveryTimeDays: Number(deliveryDays),
          gallery: galleryUrl ? [galleryUrl] : [],
          faqs: [
            { question: "What requirements are needed?", answer: "We will establish a direct dialogue on the conversation portal to details scope milestones." }
          ]
        })
      });

      if (res.ok) {
        setShowForm(false);
        // Reset states
        setTitle("");
        setDesc("");
        setTags("");
        setStartingPrice("");
        setGalleryUrl("");
        fetchGigs();
        onPostSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  // AI Optimizer service with Gemini 3.5 Flash
  const handleAIOptimizeGig = async () => {
    if (!title) return;
    try {
      setAiOptimizing(true);
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/ai/gig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleInput: title,
          category,
          tags: tagsArray
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDesc(data.description);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiOptimizing(false);
    }
  };

  // Algorithmic search, filtering and sorting by Campus Reputation Score!
  const filteredGigs = gigs
    .filter(gig => {
      const matchSearch = gig.title.toLowerCase().includes(search.toLowerCase()) || 
                          gig.description.toLowerCase().includes(search.toLowerCase()) ||
                          gig.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = selectedCategory ? gig.category === selectedCategory : true;
      const matchUniversity = selectedUniversity ? gig.studentUniversity === selectedUniversity : true;
      const matchPrice = gig.startingPrice <= maxPrice;
      const matchVerified = onlyVerified ? gig.studentCrs >= 80 : true;

      return matchSearch && matchCategory && matchUniversity && matchPrice && matchVerified;
    })
    // Sort in descending order by Campus Reputation score (studentCrs) to reward top-tier verified students!
    .sort((a, b) => b.studentCrs - a.studentCrs);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-mono">Exploring Student Gigs...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-xs font-mono px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full font-bold border border-sky-400/20">
            Student Gig Marketplace
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Hire Pakistan's Next Talent</h2>
          <p className="text-slate-400 text-sm max-w-lg">
            Gigs are continuously organized dynamically, prioritizing students with high Campus Reputation Scores (CRS).
          </p>
        </div>
        {session?.role === UserRole.STUDENT && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-slate-50 shrink-0 relative z-10 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" /> Publish My Service Gig
          </button>
        )}
        {/* Decorative canvas glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* Post Gig Form */}
      {showForm && (
        <form onSubmit={handlePublishGig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Define Service Package</h3>
            <button 
              type="button" 
              onClick={handleAIOptimizeGig}
              disabled={aiOptimizing}
              className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-mono text-[10px] font-bold border border-sky-200 transition-all flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> {aiOptimizing ? "Optimizing copywriting..." : "Optimize with Gemini AI"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="gig-title" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Service Title (Catchy, starts with 'I will')</label>
              <input 
                id="gig-title"
                type="text" 
                placeholder="I will build robust Next.js layouts" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="gig-category" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Category</label>
                <select 
                  id="gig-category"
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none font-medium"
                >
                  {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="gig-tags" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Tags (comma separated)</label>
                <input 
                  id="gig-tags"
                  type="text" 
                  placeholder="React, Frontend, API"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="gig-price" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Starting Price (PKR)</label>
              <input 
                id="gig-price"
                type="number" 
                placeholder="15000" 
                required
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="gig-delivery" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Delivery Time (Days)</label>
              <input 
                id="gig-delivery"
                type="number" 
                placeholder="5" 
                required
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="gig-gallery" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Gallery Image URL (Optional)</label>
              <input 
                id="gig-gallery"
                type="text" 
                placeholder="https://..."
                value={galleryUrl}
                onChange={(e) => setGalleryUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="gig-desc" className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-700">Detailed Service Explanation (Paragraph)</label>
            <textarea 
              id="gig-desc"
              rows={3} 
              placeholder="Describe what you plan to offer clients..."
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-950 bg-white focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPublishing}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 transition-all"
            >
              {isPublishing ? "Publishing Catalog..." : "Publish Package"}
            </button>
          </div>
        </form>
      )}

      {/* Main Filter Rail & Gigs layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Dynamic Filters side rail */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 self-start">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" /> Catalog Optimization filters
          </h4>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label htmlFor="search-keywords" className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider block">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                id="search-keywords"
                type="text" 
                placeholder="Figma, React, API..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label htmlFor="search-category" className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider block">Skill Category</label>
            <select 
              id="search-category"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>

          {/* University Filter */}
          <div className="space-y-1.5">
            <label htmlFor="search-univ" className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider block">University Location</label>
            <select 
              id="search-univ"
              value={selectedUniversity} 
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full text-xs px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none"
            >
              <option value="">All Universities</option>
              {UNIVERSITIES.map(u => (<option key={u} value={u}>{u}</option>))}
            </select>
          </div>

          {/* CRS verified only filter */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-200">
            <div className="space-y-0.5">
              <label htmlFor="search-elite" className="text-xs font-bold text-indigo-950 flex items-center gap-1 cursor-pointer">
                <Award className="h-3.5 w-3.5 text-indigo-700" /> Elite Rank Status
              </label>
              <p className="text-[9px] text-indigo-800 font-mono">Show Only CRS &gt; 80</p>
            </div>
            <input 
              id="search-elite"
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Price limit filter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="search-budget" className="text-[10px] font-mono font-black text-slate-700 uppercase tracking-wider">Starting Budget limit</label>
              <span className="text-xs font-extrabold text-slate-950 font-mono">PKR {maxPrice.toLocaleString()}</span>
            </div>
            <input 
              id="search-budget"
              type="range" 
              min={5500} 
              max={150000} 
              step={5000}
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full text-slate-900 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Gigs gallery show list */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between font-mono text-xs text-slate-500">
            <span>Displaying {filteredGigs.length} packages found</span>
            <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-sky-500" /> Sorted dynamically by algorithmic CRS rank</span>
          </div>

          {filteredGigs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 text-xs">
              No matching gigs could be found matching your query criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredGigs.map(gig => (
                <div key={gig.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all border-b-2 hover:border-b-indigo-400">
                  <div className="space-y-4">
                    {/* Cover image Aspect */}
                    <div className="aspect-video relative bg-slate-100">
                      <img 
                        src={gig.gallery[0]} 
                        alt="Service portfolio thumbnail" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-1.5 shadow-sm">
                        <img 
                          src={gig.studentAvatar} 
                          alt={gig.studentName} 
                          className="w-5 h-5 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-[9px] font-bold text-slate-950 font-mono leading-none">{gig.studentName}</p>
                          <p className="text-[8px] text-slate-400 leading-none mt-0.5">{gig.studentUniversity.substring(0, 18)}...</p>
                        </div>
                      </div>
                    </div>

                    {/* Content package details */}
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100 font-semibold">{gig.category}</span>
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full">CRS Score: {gig.studentCrs}</span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer">
                        {gig.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-3 font-sans leading-relaxed">
                        {gig.description}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {gig.tags.slice(0, 3).map(tg => (
                          <span key={tg} className="text-[10px] font-mono text-slate-400">#{tg}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gig purchase block pricing */}
                  <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100/60 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">Starting at</p>
                      <p className="text-base font-extrabold text-slate-950 font-mono mt-1">Rs.{gig.startingPrice.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex gap-1.5">
                      {session?.id !== gig.studentId && (
                        <>
                          <button 
                            onClick={() => onOpenChat(gig.studentId)}
                            className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200/80 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => onOpenChat(gig.studentId)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Hire
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
