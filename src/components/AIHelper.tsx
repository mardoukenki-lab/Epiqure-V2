import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, RefreshCw, Sparkles, Heart } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function AIHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Bonjour ! Je suis l'assistant virtuel d'EPICURE. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur nos formules d'abonnement, nos visites de santé à domicile ou nos partenaires médicaux."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      // Map message history to what API expects
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        text: msg.text
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history })
      });

      if (!response.ok) {
        throw new Error('API failed');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: "Désolé, je rencontre une petite difficulté de connexion. Veuillez réessayer. Notre équipe humaine est également joignable sur WhatsApp au +225 00 00 00 00 !"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-4"
          >
            {/* Window Header */}
            <div className="p-4 bg-primary-brand text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <Heart className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm">Assistant EPICURE</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/80 font-medium">IA de conseils & suivi</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer bar */}
            <div className="bg-amber-50 text-[10px] text-amber-800 p-2 border-b border-amber-100 flex items-center gap-1 px-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Conseils préventifs uniquement. Ne remplace pas un médecin.</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                      msg.role === 'user'
                        ? 'bg-blue-100 text-accent-blue'
                        : 'bg-primary-brand text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent-blue text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-primary-brand text-white flex items-center justify-center shrink-0">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-3 bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-tl-none text-xs italic shadow-sm">
                    EPICURE réfléchit...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {messages.length === 1 && (
              <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 justify-center">
                <button
                  onClick={() => setInput("Quels sont les tarifs des abonnements ?")}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-medium text-slate-700 transition-colors"
                >
                  Tarifs & Formules
                </button>
                <button
                  onClick={() => setInput("Faites-vous des bilans de tension ?")}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-medium text-slate-700 transition-colors"
                >
                  Bilans de tension
                </button>
                <button
                  onClick={() => setInput("Comment ça marche pour la Diaspora ?")}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-medium text-slate-700 transition-colors"
                >
                  Suivi Diaspora
                </button>
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Posez votre question de santé..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white text-xs text-slate-800"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-primary-brand text-white rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-secondary-brand text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-colors relative"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping" />
      </motion.button>
    </div>
  );
}
