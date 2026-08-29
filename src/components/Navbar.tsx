import { motion } from 'motion/react';
import { PhoneCall, User, ShieldCheck } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenDashboard: () => void;
  user: FirebaseUser | null;
  isAdmin?: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Navbar({ onOpenBooking, onOpenDashboard, user, isAdmin, onSignIn, onSignOut }: NavbarProps) {
  return (
    <header className="fixed top-0 w-full z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm h-20">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-12 h-full">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-10 h-10 bg-primary-brand rounded-xl flex items-center justify-center text-white font-extrabold font-display text-lg shadow-sm"
          >
            E
          </motion.div>
          <div>
            <span className="font-display font-extrabold text-lg text-primary-brand tracking-tight">Epiqure</span>
            <span className="block text-[8px] uppercase tracking-widest font-bold text-slate-400 font-mono">Santé &amp; Proximité</span>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex gap-8 items-center">
          <a className="text-primary-brand font-bold border-b-2 border-primary-brand py-1 text-xs uppercase tracking-wider" href="#home">
            Accueil
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#services">
            Services
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#abonnements">
            Abonnements
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#faq">
            FAQ
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#contact">
            Contact
          </a>
        </div>

        {/* WhatsApp & Account CTA */}
        <div className="flex items-center gap-3">
          <a
            className="hidden sm:flex items-center gap-2 px-4.5 py-2 bg-secondary-brand text-white rounded-full text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
            href="https://wa.me/2250101682535"
            target="_blank"
            rel="noreferrer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          {user ? (
            <button
              onClick={onOpenDashboard}
              className={`px-3.5 py-1.5 border rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                isAdmin 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 hover:bg-indigo-100' 
                  : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
              id="mon-compte-btn"
            >
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              ) : (
                <img 
                  src={user.photoURL || ""} 
                  alt={user.displayName || "Profil"} 
                  className="w-5 h-5 rounded-full object-cover border border-emerald-300"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="max-w-[120px] truncate">
                {isAdmin ? "Agent de Santé (Admin)" : (user.displayName?.split(' ')[0] || "Mon compte")}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenDashboard}
              className="px-4.5 py-2 border-2 border-primary-brand text-primary-brand rounded-full text-xs font-bold hover:bg-primary-brand/5 transition-all flex items-center gap-1.5 cursor-pointer"
              id="mon-compte-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span>Mon compte</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
