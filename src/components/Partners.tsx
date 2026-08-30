import { GraduationCap, Heart, HelpCircle, Activity } from 'lucide-react';

export default function Partners() {
  const localPartners = [
    {
      name: "Hôpital Général de Dabou",
      type: "Structure Publique de Référence",
      desc: "Orientation directe pour les urgences lourdes, consultations de spécialistes et bilans biologiques complexes.",
      icon: <Activity className="w-5 h-5 text-rose-500" />
    },
    {
      name: "Clinique SAREPTA",
      type: "Clinique Privée Partenaire",
      desc: "Accueil privilégié et prise de rendez-vous rapide pour nos abonnés nécessitant une imagerie ou une consultation.",
      icon: <Heart className="w-5 h-5 text-blue-500" />
    },
    {
      name: "Laboratoire BioSanté",
      type: "Analyses Médicales",
      desc: "Traitement prioritaire des bilans sanguins préconisés lors de nos visites préventives à domicile.",
      icon: <GraduationCap className="w-5 h-5 text-amber-500" />
    },
    {
      name: "Pharmacies de Garde Dabou",
      type: "Réseau d'Officines",
      desc: "Mise à disposition et vérification de la disponibilité des traitements prescrits pour nos aînés.",
      icon: <HelpCircle className="w-5 h-5 text-emerald-500" />
    }
  ];

  return (
    <section className="py-20 bg-slate-50/50" id="partners">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Notre Réseau</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Partenaires Santé de confiance à Dabou</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
            Pour assurer un parcours de soin optimal, EPICURE collabore en synergie avec les établissements majeurs de la ville.
          </p>
          <div className="w-20 h-1 bg-primary-brand mx-auto mt-4 rounded-full" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {localPartners.map((p, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h5 className="font-display font-black text-slate-900 text-sm mb-1">{p.name}</h5>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
                  {p.type}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
