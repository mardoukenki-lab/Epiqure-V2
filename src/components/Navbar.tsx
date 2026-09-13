import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneCall, User, ShieldCheck, ShoppingBag, ExternalLink, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm h-20">
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

        {/* Desktop Links */}
        <div className="hidden md:flex gap-7 lg:gap-8 items-center">
          <a className="text-primary-brand font-bold border-b-2 border-primary-brand py-1 text-xs uppercase tracking-wider" href="#home">
            Accueil
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#services">
            Services
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#tarifs">
            Tarifs
          </a>
          <a
            className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider flex items-center gap-1"
            href="https://blog.epiqure.online"
            target="_blank"
            rel="noreferrer"
            id="nav-link-blog"
            title="Accéder au Blog Epiqure"
          >
            <span>Blog</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
          </a>
          <a
            className="text-emerald-700 hover:text-emerald-600 font-bold transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 shadow-2xs"
            href="https://boutique.epiqure.online/"
            target="_blank"
            rel="noreferrer"
            id="nav-link-boutique"
            title="Accéder à la boutique en ligne Epiqure"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Boutique</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#faq">
            FAQ
          </a>
          <a className="text-slate-600 hover:text-primary-brand font-semibold transition-colors text-xs uppercase tracking-wider" href="#contact">
            Contact
          </a>
        </div>

        {/* WhatsApp & Account CTA & Mobile Menu Toggle */}
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
              <span className="max-w-[120px] sm:max-w-[140px] truncate">
                {isAdmin ? (user.displayName || "Espace Soignant") : (user.displayName?.split(' ')[0] || "Mon compte")}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenDashboard}
              className="px-4 py-2 border-2 border-primary-brand text-primary-brand rounded-full text-xs font-bold hover:bg-primary-brand/5 transition-all flex items-center gap-1.5 cursor-pointer"
              id="mon-compte-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span>Mon compte</span>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-slate-200 shadow-xl px-6 py-5 flex flex-col gap-4"
          >
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="text-primary-brand font-bold py-1.5 text-sm uppercase tracking-wider"
              href="#home"
            >
              Accueil
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 hover:text-primary-brand font-semibold py-1.5 text-sm uppercase tracking-wider"
              href="#services"
            >
              Services
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 hover:text-primary-brand font-semibold py-1.5 text-sm uppercase tracking-wider"
              href="#tarifs"
            >
              Tarifs
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 text-slate-700 hover:text-primary-brand font-semibold text-sm uppercase tracking-wider"
              href="https://blog.epiqure.online"
              target="_blank"
              rel="noreferrer"
              id="mobile-nav-link-blog"
            >
              <span>Blog</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold text-sm uppercase tracking-wider border border-emerald-200 shadow-xs"
              href="https://boutique.epiqure.online/"
              target="_blank"
              rel="noreferrer"
              id="mobile-nav-link-boutique"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Boutique</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 hover:text-primary-brand font-semibold py-1.5 text-sm uppercase tracking-wider"
              href="#faq"
            >
              FAQ
            </a>
            <a
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 hover:text-primary-brand font-semibold py-1.5 text-sm uppercase tracking-wider"
              href="#contact"
            >
              Contact
            </a>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <a
                className="flex items-center justify-center gap-2 py-2.5 bg-secondary-brand text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
                href="https://wa.me/2250101682535"
                target="_blank"
                rel="noreferrer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contact WhatsApp direct (+225 01 01 68 25 35)</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
