import { Check, ShieldCheck, Heart } from 'lucide-react';

interface PricingProps {
  onSelectPlan: (planName: string, price: number) => void;
}

export default function Pricing({ onSelectPlan }: PricingProps) {
  const plans = [
    {
      name: "Individuel",
      price: "2,000",
      numPrice: 2000,
      badge: "Individuel & Prévention",
      period: "FCFA / mois",
      desc: "Pour une seule personne qui souhaite un suivi de santé préventif régulier à Dabou.",
      features: [
        "1 visite à domicile par semaine, selon le planning établi avec l'agent de santé",
        "Prise systématique de tension artérielle & glycémie",
        "Un rapport rédigé après chaque visite",
        "Rapport envoyé par email ou WhatsApp",
        "Assistance d'orientation générale vers nos centres partenaires"
      ],
      isPopular: false,
      btnLabel: "Souscrire à l'offre Individuel"
    },
    {
      name: "Forfait Maison",
      price: "5,000",
      numPrice: 5000,
      badge: "Particuliers & Foyers",
      period: "FCFA / mois (par foyer)",
      desc: "Idéal pour prendre soin de la santé de tout votre foyer résidant à Dabou avec un suivi mensuel régulier.",
      features: [
        "1 visite à domicile par semaine pour l'ensemble du foyer",
        "Passage fixé chaque samedi ou dimanche selon vos disponibilités",
        "Prise de tension artérielle & glycémie pour chaque membre ausculté",
        "Un rapport médical individuel rédigé par personne examinée",
        "Comptes-rendus transmis par Email ou WhatsApp après chaque visite",
        "Conseils de prévention et d'orientation médicale personnalisée"
      ],
      isPopular: true,
      btnLabel: "Souscrire au Forfait Maison"
    },
    {
      name: "Forfait Entreprise",
      price: "15,000",
      numPrice: 15000,
      badge: "Entreprises & Sites",
      period: "FCFA / mois (par site)",
      desc: "La formule professionnelle dédiée aux entreprises et équipes pour préserver la santé des collaborateurs à Dabou.",
      features: [
        "1 passage hebdomadaire de l'équipe de santé sur site",
        "Visite planifiée le samedi ou dimanche selon le planning convenu",
        "Dépistage individuel & suivi des constantes de chaque collaborateur présent",
        "Un rapport individuel rédigé par salarié ausculté",
        "Envoi sécurisé des rapports par Email ou WhatsApp (Salarié / RH)",
        "Assistance téléphonique d'orientation santé & suivi prioritaire"
      ],
      isPopular: false,
      btnLabel: "Souscrire au Forfait Entreprise"
    }
  ];

  return (
    <section className="py-20 bg-slate-50/50 relative overflow-hidden" id="abonnements">
      {/* Circles for visual detail */}
      <div className="absolute top-1/2 -left-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nos Forfaits</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Formules simples, sans engagement</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
            Choisissez la formule qui convient le mieux à vos besoins ou à ceux de vos proches à Dabou.
          </p>
          <div className="w-20 h-1 bg-primary-brand mx-auto mt-4 rounded-full" />
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative p-8 sm:p-10 rounded-3xl border transition-all flex flex-col justify-between ${
                plan.isPopular
                  ? 'bg-white border-2 border-primary-brand shadow-2xl scale-[1.02]'
                  : 'bg-white/80 border-slate-150 shadow-md hover:border-slate-300'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-4 right-6 px-4 py-1.5 bg-primary-brand text-white text-[10px] uppercase tracking-wider font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 fill-white/10" />
                  <span>Tranquillité Garantie</span>
                </span>
              )}

              {/* Header */}
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-accent-blue inline-block mb-3">
                  {plan.badge}
                </span>

                <h3 className="font-display font-black text-2xl text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans mb-6">{plan.desc}</p>

                {/* Pricing Box */}
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl sm:text-5xl font-display font-black tracking-tight text-primary-brand">
                    {plan.price}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{plan.period}</span>
                </div>

                <div className="border-t border-slate-100 my-6" />

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex gap-3 items-start">
                      <div className={`p-0.5 rounded-full mt-0.5 ${plan.isPopular ? 'bg-blue-50' : 'bg-slate-100'}`}>
                        <Check className={`w-3.5 h-3.5 ${plan.isPopular ? 'text-accent-blue' : 'text-slate-500'}`} />
                      </div>
                      <p className="text-xs text-slate-600 leading-normal font-sans">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => onSelectPlan(plan.name, plan.numPrice)}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  plan.isPopular
                    ? 'bg-primary-brand hover:bg-blue-800 text-white hover:shadow-lg'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
                id={`plan-btn-${idx}`}
              >
                {plan.btnLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
