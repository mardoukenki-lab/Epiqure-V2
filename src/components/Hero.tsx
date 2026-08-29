import { motion } from 'motion/react';
import { Sparkles, CalendarRange, Heart, ArrowRight } from 'lucide-react';
import { IMAGES } from '../types';

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="relative min-h-[780px] pt-32 pb-16 flex items-center overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white" id="home">
      {/* Background decoration */}
      <div className="absolute top-1/4 -left-36 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -right-36 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 border border-blue-100 text-accent-blue rounded-full text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Proximité &amp; Santé locale à Dabou</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-slate-900 leading-tight tracking-tight"
          >
            Votre santé, notre priorité, <span className="text-primary-brand relative">près de chez vous.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-sans"
          >
            Bénéficiez de visites de santé à domicile, d'un suivi régulier de vos constantes et d'une orientation médicale personnalisée par nos experts locaux à Dabou.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <a
              href="#abonnements"
              className="px-7 py-3.5 bg-primary-brand text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex items-center gap-2"
            >
              <span>Je m'abonne</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={onOpenBooking}
              className="px-7 py-3.5 border-2 border-primary-brand text-primary-brand hover:bg-primary-brand/5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              id="hero-booking-btn"
            >
              <CalendarRange className="w-4 h-4" />
              <span>Demander une visite</span>
            </button>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="relative lg:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-md w-full"
          >
            {/* Main Image */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border-[10px] border-white relative z-10 custom-shadow">
              <img
                src={IMAGES.hero}
                alt="Soins de santé à domicile par Epiqure"
                className="w-full aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Float Badge */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl flex items-center gap-3.5 z-20 border border-slate-200/40"
            >
              <div className="bg-emerald-500 p-2.5 rounded-xl text-white">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <p className="font-display font-black text-xl text-primary-brand">100%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accompagnement Local</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
