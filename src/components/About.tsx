import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { IMAGES } from '../types';

export default function About() {
  return (
    <section className="py-20 bg-slate-50/50" id="about">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text panel */}
          <div className="space-y-6 lg:col-span-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Notre Mission</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Qui sommes-nous ?</h2>
              <div className="w-16 h-1 bg-primary-brand mt-3 rounded-full" />
            </div>

            <p className="text-base text-slate-600 leading-relaxed font-sans">
              Le Service d'Itinéraire de Santé et de Proximité Epiqure est né de la volonté de rapprocher les soins essentiels des habitants de Dabou. Notre mission est d'assurer une veille sanitaire proactive directement à votre domicile.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-secondary-brand shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-slate-800">Contrôles de proximité réguliers (Tension, Glycémie, Constantes de santé).</p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-secondary-brand shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-slate-800">Orientation qualifiée vers les spécialistes adaptés et accompagnement complet.</p>
              </div>
            </div>

            {/* Disclaimer box */}
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-950 rounded-r-xl flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Note importante :</p>
                <p className="text-[11px] text-rose-800/90 leading-normal mt-1">
                  Epiqure n'est pas une clinique médicale. Nous assurons la prévention et l'orientation, mais n'effectuons pas d'actes chirurgicaux ou d'hospitalisations sur place.
                </p>
              </div>
            </div>
          </div>

          {/* Grid of 4 images */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl overflow-hidden shadow-md group">
                <img
                  src={IMAGES.bpMonitor}
                  alt="Dépistage de tension EPICURE Dabou"
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md group">
                <img
                  src={IMAGES.tabletCharts}
                  alt="Suivi de données de santé EPICURE"
                  className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-md group">
                <img
                  src={IMAGES.team}
                  alt="L'équipe de professionnels EPICURE Dabou"
                  className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md group">
                <img
                  src={IMAGES.bloodSugar}
                  alt="Test de glycémie à Dabou"
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
