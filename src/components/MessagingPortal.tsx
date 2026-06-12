import React, { useState, useEffect, useRef } from "react";
import { Conversation, Message, UserSession, UserRole } from "../types";
import { Send, FileText, CheckCheck, Sparkles, Plus, AlertCircle, RefreshCw } from "lucide-react";

interface MessagingProps {
  session: UserSession;
  activeTargetId?: string; // Option to seed immediate chat with student
}

export default function MessagingPortal({ session, activeTargetId }: MessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [attUrl, setAttUrl] = useState("");
  const [attType, setAttType] = useState<"image" | "pdf">("image");
  const [showAttForm, setShowAttForm] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize conversations list
  const loadConversations = async (targetId?: string) => {
    try {
      setLoading(true);
      
      // If we have an active target student we want to open chat with
      if (targetId) {
        const constructRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: targetId })
        });
        if (constructRes.ok) {
          const newC = await constructRes.json();
          setSelectedConv(newC);
        }
      }

      const res = await fetch("/api/conversations");
      if (res.ok) {
        const list = await res.json();
        setConversations(list);
        
        // Auto select first conversation if none selected
        if (!selectedConv && list.length > 0 && !targetId) {
          setSelectedConv(list[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations(activeTargetId);
  }, [activeTargetId]);

  // Load messages for selected conversation
  const loadMessages = async () => {
    if (!selectedConv) return;
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMessages();
    
    // Set pooling interval to check for AI or database updates
    const interval = setInterval(() => {
      loadMessages();
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || (!content && !attUrl)) return;

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          attachmentUrl: attUrl || undefined,
          attachmentType: attUrl ? attType : undefined
        })
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setContent("");
        setAttUrl("");
        setShowAttForm(false);
        
        // Simulate peer typing immediately for client agent reply
        const recipient = selectedConv.participants.find(p => p.id !== session?.id);
        if (recipient && recipient.role === UserRole.CLIENT && session?.role === UserRole.STUDENT) {
          setTyping(true);
          setTimeout(() => {
            setTyping(false);
          }, 3500);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRecipient = (conv: Conversation) => {
    return conv.participants.find(p => p.id !== session?.id);
  };

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500 mb-2" />
        <span className="text-sm font-mono">Opening securely messaging gateways...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[550px] max-h-[650px] select-none">
      
      {/* Chats directory list */}
      <div className="md:col-span-1 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
        <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">NEXUS Inbox</h3>
          <button 
            onClick={() => loadConversations()}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono flex flex-col items-center space-y-2 mt-12 justify-center">
            <AlertCircle className="h-6 w-6 text-slate-300" />
            <p>Your inbox is empty.</p>
            <span className="text-[10px] text-slate-300 text-balance leading-normal">
              Go to Gigs or Opportunities and click 'Chat' to connect with peers.
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
            {conversations.map(conv => {
              const recipient = getRecipient(conv);
              if (!recipient) return null;
              const isSelected = selectedConv?.id === conv.id;
              const unread = session ? (conv.unreadCount[session.id] || 0) : 0;

              return (
                <div 
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected ? "bg-white border-l-4 border-slate-900" : "hover:bg-slate-100/45"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={recipient.avatar} 
                      alt={recipient.name} 
                      className="w-9 h-9 rounded-full border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-950">{recipient.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{recipient.role}</p>
                    </div>
                  </div>
                  {unread > 0 && (
                    <span className="h-4.5 w-4.5 rounded-full bg-slate-900 text-white font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main chat window */}
      <div className="md:col-span-2 flex flex-col justify-between h-full bg-white relative">
        {selectedConv ? (
          <>
            {/* Window title bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={getRecipient(selectedConv)?.avatar} 
                  alt={getRecipient(selectedConv)?.name} 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{getRecipient(selectedConv)?.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Active Pipeline • {getRecipient(selectedConv)?.role} • University Zone
                  </p>
                </div>
              </div>

              {/* AI Badge Indicators */}
              {session?.role === UserRole.STUDENT && getRecipient(selectedConv)?.role === UserRole.CLIENT && (
                <div className="px-2 py-1 rounded bg-indigo-50 border border-indigo-100 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500 animate-pulse" />
                  <span className="text-[9px] text-indigo-700 font-bold font-mono">Gemini AI Client Pilot Active</span>
                </div>
              )}
            </div>

            {/* Message Bubble Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[420px]">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-slate-300">
                  Begin typing below to commence conversation securely.
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.senderId === session?.id;
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col space-y-1 max-w-[80%] ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className="text-[9px] text-slate-400 font-mono">{msg.senderName}</span>
                      
                      <div className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed ${
                        isOwn 
                          ? "bg-slate-900 text-white rounded-tr-none shadow-sm" 
                          : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                      }`}>
                        
                        {msg.content && <p>{msg.content}</p>}

                        {/* Rendering attachments */}
                        {msg.attachmentUrl && (
                          <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${isOwn ? "bg-white/10" : "bg-white"}`}>
                            <FileText className="h-4 w-4 text-sky-500" />
                            <a 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); alert(`Downloading Attachment asset: ${msg.attachmentUrl}`); }} 
                              className={`text-[10px] underline font-mono truncate max-w-[150px] ${isOwn ? "text-white" : "text-slate-800"}`}
                            >
                              Open Attachment Document
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-mono text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {isOwn && <CheckCheck className="h-3 w-3 text-sky-500" />}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing simulation */}
              {typing && (
                <div className="flex items-center space-x-2 text-slate-400 mr-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-mono">Client typing...</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* File attaching module */}
            {showAttForm && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs font-mono">
                <input 
                  type="text" 
                  placeholder="Paste URL (e.g. CV.pdf / project.zip)"
                  value={attUrl}
                  onChange={(e) => setAttUrl(e.target.value)}
                  className="col-span-2 px-2.5 py-1 rounded border border-slate-200"
                />
                <select 
                  value={attType} 
                  onChange={(e) => setAttType(e.target.value as any)}
                  className="px-2 py-1 rounded border border-slate-200"
                >
                  <option value="image">Image</option>
                  <option value="pdf">Document</option>
                </select>
              </div>
            )}

            {/* Text input submit form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setShowAttForm(!showAttForm)}
                className="p-2.5 rounded-xl text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0 border border-slate-200/50"
              >
                <Plus className="h-4 w-4" />
              </button>
              
              <input 
                type="text" 
                placeholder="Type your message content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 text-xs px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />

              <button 
                type="submit" 
                className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md shadow-slate-200"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-center text-slate-350 font-mono text-xs">
            Begin by selecting a conversations portal or client profile.
          </div>
        )}
      </div>

    </div>
  );
}
