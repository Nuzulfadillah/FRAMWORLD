import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  ExternalLink,
  Bot,
  User,
  Globe,
  Loader2,
  HelpCircle,
  Zap,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; uri: string }[];
  timestamp?: number;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGrowId?: string;
  authToken?: string;
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  userGrowId = 'Petani',
  authToken,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Halo ${userGrowId}! 🌱 Saya **Growtopia AI Farming Master & Advisor**, didukung model **Gemini 3.8 Flash** dengan **Google Search Grounding**.

Saya siap membantu Anda dengan:
- 📊 **Perhitungan Profit & Gems**: Laser Grid, Chandelier, Pepper, dll.
- 💎 **Konversi Store Pack**: Rekomendasi belanja gems ke WL (Surgery Pack, SSP, dll).
- 📅 **Event Terkini & Live Info**: Jadwal Carnival, SummerFest, Winterfest, dan resep item via Google Search.
- 🚜 **Taktik BFG & Replant**: Optimasi rotasi multi-world.

Apa yang ingin Anda tanyakan atau hitung hari ini?`,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Pass previous 6 messages for context
      const historyContext = messages
        .filter((m) => m.id !== 'welcome-1')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          conversationHistory: historyContext,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses jawaban dari Gemini AI');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        sources: data.sources || [],
        timestamp: data.timestamp || Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Maaf, terjadi kesalahan saat menghubungi server AI: ${error.message || 'Koneksi terputus'}. Silakan coba lagi.`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Riwayat chat telah dibersihkan. Silakan ajukan pertanyaan baru seputar farming Growtopia Anda!',
      },
    ]);
    if (authToken) {
      fetch('/api/chat/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
  };

  const quickPrompts = [
    { label: '💎 Rasio Profit Surgery Pack', query: 'Berapa rasio profit konversi Gems ke WL untuk Surgery Pack di Growtopia?' },
    { label: '⚡ Laser Grid vs Chandelier', query: 'Bandingkan kelebihan dan kekurangan farming Laser Grid vs Chandelier dari segi waktu panen dan estimasi gems.' },
    { label: '📅 Event Growtopia Bulan Ini', query: 'Jadwal dan info event Growtopia terkini bulan ini serta item yang patut diinvestasikan.' },
    { label: '🚜 Tips Optimasi BFG', query: 'Bagaimana cara dan setup terbaik mengoperasikan BFG / Rayman untuk memecahkan blok farmable?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border-2 border-emerald-500/40 rounded-3xl w-full max-w-3xl h-[90vh] sm:h-[82vh] flex flex-col shadow-2xl shadow-emerald-950/40 overflow-hidden relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-gradient-to-r from-[#0d182e] to-[#0a1120] flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-400 to-amber-300 p-0.5 shadow-lg shadow-emerald-500/25">
              <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center text-xl">
                🤖
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-100 font-game tracking-wider">
                  GROWTOPIA AI FARMING ADVISOR
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google Search Grounding Aktif (Data Web Realtime)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              title="Bersihkan Percakapan"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Tutup Chatbot"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Scrollable Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 z-10">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-md shadow-emerald-500/20">
                    <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center text-sm">
                      🌱
                    </div>
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-tr-xs shadow-md shadow-emerald-500/20'
                        : 'bg-[#121c33]/90 text-slate-100 border border-slate-700/80 rounded-tl-xs shadow-lg'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Google Search Grounding Sources Chips */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#091222] border border-slate-800 text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Sumber Grounding Google Search:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                          >
                            <span className="truncate max-w-[200px]">{s.title || s.uri}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0">
                    <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center text-xs font-bold text-amber-300 font-game">
                      {userGrowId.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 animate-pulse">
                <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center text-sm">
                  🌱
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#121c33]/80 border border-slate-700/80 text-xs flex items-center gap-2 text-emerald-300">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Gemini sedang menganalisis data & mencari info Google...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-[#09101f] overflow-x-auto z-10">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-amber-400" />
              Tanya Cepat:
            </span>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p.query)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-amber-300 border border-slate-700/70 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-[#0a1120] shrink-0 z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Tanyakan apapun ke Guru Farming Growtopia (profit, rotasi, harga pack)..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-[#142038] border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 text-xs sm:text-sm placeholder:text-slate-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="px-4 sm:px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Kirim</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
