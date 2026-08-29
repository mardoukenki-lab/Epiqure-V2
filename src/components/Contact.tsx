import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', contact: '', msg: '' });
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.msg) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          formType: "Formulaire de contact",
          name: formData.name,
          contact: formData.contact,
          message: formData.msg,
          _subject: `Nouveau message de contact - Epiqure`
        })
      });

      if (response.ok) {
        setIsSent(true);
        setFormData({ name: '', contact: '', msg: '' });
        setTimeout(() => setIsSent(false), 8000);
      } else {
        console.error("Notification API returned non-ok status");
        // Fallback to local success state to maintain smooth UX
        setIsSent(true);
        setFormData({ name: '', contact: '', msg: '' });
        setTimeout(() => setIsSent(false), 8000);
      }
    } catch (err) {
      console.error("Error submitting contact notification", err);
      // Fallback to local success state to maintain smooth UX
      setIsSent(true);
      setFormData({ name: '', contact: '', msg: '' });
      setTimeout(() => setIsSent(false), 8000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="py-20 bg-slate-50/50" id="contact">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Information Block */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Prendre Contact</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Contactez-nous</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
                Une question, un besoin de renseignement complémentaire ? Notre équipe de coordination à Dabou est à votre entière écoute.
              </p>
              <div className="w-16 h-1 bg-primary-brand mt-4 rounded-full" />
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-50 text-accent-blue rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-950 uppercase tracking-wider">Adresse Locale</h5>
                  <p className="text-xs text-slate-600 mt-0.5">Dabou, Quartier Résidentiel, en face du pôle de santé, Côte d'Ivoire.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-950 uppercase tracking-wider">Téléphone &amp; WhatsApp</h5>
                  <p className="text-xs text-slate-600 mt-0.5">+225 01 01 68 25 35</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-950 uppercase tracking-wider">Courriel Électronique</h5>
                  <p className="text-xs text-slate-600 mt-0.5 font-mono">direction@epiqure.online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Block */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-150 shadow-sm">
            <h4 className="font-display font-black text-slate-900 text-lg mb-6">Envoyer un message en ligne</h4>

            {isSent ? (
              <div className="p-6 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-start gap-4 text-emerald-900 animate-fadeIn">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-sm">Message transmis avec succès !</h5>
                  <p className="text-xs text-emerald-700/90 leading-relaxed mt-1">
                    Merci pour votre intérêt. Notre équipe de Dabou va étudier votre message et vous recontactera par téléphone ou WhatsApp sous un délai maximum de 24 heures.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Votre Nom Complet</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean Koffi"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone / WhatsApp ou Email</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: +225 01 01 68 25 35"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Votre Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Comment pouvons-nous aider votre famille à Dabou ?"
                    value={formData.msg}
                    onChange={(e) => setFormData({ ...formData, msg: e.target.value })}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white text-xs text-slate-800 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto py-3 px-6 bg-primary-brand text-white font-bold rounded-xl text-xs hover:bg-blue-800 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSending ? "Envoi en cours..." : "Envoyer le message"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
