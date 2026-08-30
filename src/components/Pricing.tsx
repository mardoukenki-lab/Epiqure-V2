import { useState } from 'react';
import { Check, ShieldCheck, Calendar, Sparkles, Clock, Stethoscope, HeartHandshake } from 'lucide-react';

interface PricingProps {
  onSelectPlan: (planName: string, price: number, billingCycle?: 'mensuel' | 'annuel' | 'visite_unique') => void;
}

export default function Pricing({ onSelectPlan }: PricingProps) {
  const [pricingMode, setPricingMode] = useState<'mensuel' | 'annuel' | 'visite_unique'>('mensuel');

  const monthlyPlans = [
    {
      name: "Individuel",
      price: "2 000",
      numPrice: 2000,
      badge: "Individuel & Prévention",
      period: "FCFA / mois",
      subNote: "Soit 500 FCFA / semaine",
      desc: "Pour une seule personne qui souhaite un suivi de santé préventif régulier à Dabou.",
      features: [
        "1 visite à domicile par semaine (samedi ou dimanche)",
        "Prise systématique de tension artérielle & glycémie",
        "Un compte-rendu médical après chaque passage",
        "Rapports transmis par WhatsApp ou Email sous 24h",
        "Assistance d'orientation vers nos cliniques partenaires"
      ],
      isPopular: false,
      btnLabel: "Choisir l'Abonnement Mensuel"
    },
    {
      name: "Forfait Maison",
      price: "5 000",
      numPrice: 5000,
      badge: "Particuliers & Foyers",
      period: "FCFA / mois (par foyer)",
      subNote: "Soit 1 250 FCFA / semaine pour toute la famille",
      desc: "Idéal pour veiller sur la santé de tout votre foyer résidant à Dabou avec un suivi mensuel régulier.",
      features: [
        "1 visite à domicile par semaine pour l'ensemble du foyer",
        "Passage fixé chaque samedi ou dimanche selon vos disponibilités",
        "Prise de tension artérielle & glycémie pour chaque membre ausculté",
        "Un rapport médical individuel rédigé par personne examinée",
        "Comptes-rendus transmis par Email ou WhatsApp après chaque visite",
        "Conseils de prévention et d'orientation médicale personnalisée"
      ],
      isPopular: true,
      btnLabel: "Choisir le Forfait Maison Mensuel"
    },
    {
      name: "Forfait Entreprise",
      price: "15 000",
      numPrice: 15000,
      badge: "Entreprises & Sites",
      period: "FCFA / mois (par site)",
      subNote: "Soit 3 750 FCFA / semaine pour votre équipe",
      desc: "La formule professionnelle dédiée aux entreprises et équipes pour préserver la santé des collaborateurs à Dabou.",
      features: [
        "1 passage hebdomadaire de l'équipe soignante sur site",
        "Visite planifiée le samedi ou dimanche selon le planning convenu",
        "Dépistage individuel & suivi des constantes de chaque collaborateur présent",
        "Un rapport individuel rédigé par salarié ausculté",
        "Envoi sécurisé des rapports par Email ou WhatsApp (Salarié / RH)",
        "Assistance téléphonique d'orientation santé & suivi prioritaire"
      ],
      isPopular: false,
      btnLabel: "Choisir le Forfait Entreprise Mensuel"
    }
  ];

  const annualPlans = [
    {
      name: "Individuel",
      price: "20 000",
      numPrice: 20000,
      oldPrice: "24 000",
      badge: "2 mois offerts",
      period: "FCFA / an",
      subNote: "Équivaut à ~1 660 FCFA / mois (2 mois gratuits)",
      desc: "Tranquillité annuelle pour 1 personne avec suivi régulier 52 semaines sur l'année à Dabou.",
      features: [
        "52 visites à domicile sur l'année (1 passage par semaine)",
        "Suivi continu de tension artérielle & glycémie toute l'année",
        "Historique médical annuel consolidé et bilans réguliers",
        "Rapports automatiques WhatsApp pour vous ou vos proches",
        "Accès prioritaire à notre réseau médical et partenaires"
      ],
      isPopular: false,
      btnLabel: "Souscrire à l'Année (20 000 FCFA)"
    },
    {
      name: "Forfait Maison",
      price: "50 000",
      numPrice: 50000,
      oldPrice: "60 000",
      badge: "Recommandé · 2 mois offerts",
      period: "FCFA / an (par foyer)",
      subNote: "Équivaut à ~4 160 FCFA / mois pour tout le foyer",
      desc: "La formule sérénité totale pour vos parents ou votre famille à Dabou pendant 12 mois complets.",
      features: [
        "52 visites familiales à domicile (chaque week-end)",
        "Suivi de tous les membres du foyer résidant à Dabou",
        "Comptes-rendus WhatsApp systématiques envoyés au parrain",
        "Alertes immédiates en cas d'anomalie de tension ou glycémie",
        "Orientation médicale prioritaire et coordination locale",
        "2 mois complets d'abonnement offerts (économie de 10 000 FCFA)"
      ],
      isPopular: true,
      btnLabel: "Souscrire au Forfait Maison Annuel"
    },
    {
      name: "Forfait Entreprise",
      price: "150 000",
      numPrice: 150000,
      oldPrice: "180 000",
      badge: "Entreprises · 2 mois offerts",
      period: "FCFA / an (par site)",
      subNote: "Équivaut à ~12 500 FCFA / mois (économie de 30 000 FCFA)",
      desc: "Couverture santé préventive annuelle pour les salariés de votre structure ou entreprise à Dabou.",
      features: [
        "52 interventions hebdomadaires d'équipe soignante sur site",
        "Dépistages réguliers de l'ensemble des équipes et collaborateurs",
        "Bilans de santé au travail semestriels et annuels",
        "Comptes-rendus individuels confidentiels et synthèses RH",
        "Assistance santé dédiée et conseils de prévention collective"
      ],
      isPopular: false,
      btnLabel: "Souscrire au Forfait Entreprise Annuel"
    }
  ];

  const singleVisits = [
    {
      name: "Première Visite Découverte",
      serviceType: "Première visite découverte (Gratuite)",
      price: "0",
      numPrice: 0,
      badge: "Offerte",
      period: "FCFA (Sans engagement)",
      desc: "Une première prise de contact à domicile pour évaluer les besoins de santé de votre parent et présenter le service.",
      features: [
        "Passage d'un agent de santé à votre domicile à Dabou",
        "Prise de contact conviviale et écoute attentive",
        "Premier relevé de tension artérielle à titre indicatif",
        "Présentation personnalisée des formules d'accompagnement",
        "100% gratuite et sans aucun engagement"
      ],
      isPopular: false,
      btnLabel: "Demander la visite offerte"
    },
    {
      name: "Bilan Dépistage Complet & Constantes",
      serviceType: "Dépistage complet & Bilan de constantes",
      price: "3 000",
      numPrice: 3000,
      badge: "Visite Unique",
      period: "FCFA (Passage unique)",
      desc: "Une consultation préventive complète à domicile avec bilan immédiat des constantes vitales.",
      features: [
        "Prise complète de tension artérielle & glycémie capillaire",
        "Évaluation générale des signes vitaux et du mode de vie",
        "Fiche de synthèse médicale transmise sous 24h sur WhatsApp",
        "Conseils diététiques et d'hygiène de vie personnalisés",
        "Recommandations d'orientation si nécessaire"
      ],
      isPopular: true,
      btnLabel: "Réserver cette visite ponctuelle (3 000 FCFA)"
    },
    {
      name: "Suivi Thérapeutique & Traitement",
      serviceType: "Suivi post-consultation / Rappel traitement",
      price: "3 000",
      numPrice: 3000,
      badge: "Accompagnement",
      period: "FCFA (Passage unique)",
      desc: "Un accompagnement soignant pour vérifier la bonne compréhension d'une ordonnance et le respect des prises.",
      features: [
        "Revue des ordonnances et vérification des traitements",
        "Éducation thérapeutique adaptée au patient",
        "Contrôle des constantes (tension / glycémie)",
        "Rapport explicatif envoyé aux proches ou parrain",
        "Réponse à toutes les questions pratiques du patient"
      ],
      isPopular: false,
      btnLabel: "Réserver ce suivi ponctuel (3 000 FCFA)"
    }
  ];

  return (
    <section className="py-20 bg-slate-50/50 relative overflow-hidden" id="abonnements">
      {/* Background visual detail */}
      <div className="absolute top-1/2 -left-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 -right-12 w-64 h-64 bg-blue-50/60 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nos Tarifs & Formules</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Une formule adaptée à votre rythme</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
            Choisissez entre un <strong>abonnement mensuel sans engagement</strong>, un <strong>abonnement annuel avantageux (2 mois offerts)</strong> ou une <strong>visite unique ponctuelle</strong>.
          </p>
          <div className="w-20 h-1 bg-primary-brand mx-auto mt-4 rounded-full" />
        </div>

        {/* 3-Option Interactive Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 bg-slate-200/80 backdrop-blur rounded-2xl shadow-inner max-w-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPricingMode('mensuel')}
              className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pricingMode === 'mensuel'
                  ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
              id="pricing-toggle-mensuel"
            >
              <Clock className="w-4 h-4 text-primary-brand" />
              <span>Abonnement Mensuel</span>
            </button>

            <button
              type="button"
              onClick={() => setPricingMode('annuel')}
              className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                pricingMode === 'annuel'
                  ? 'bg-primary-brand text-white shadow-md scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
              id="pricing-toggle-annuel"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Abonnement Annuel</span>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                pricingMode === 'annuel' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
              }`}>
                -17%
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPricingMode('visite_unique')}
              className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pricingMode === 'visite_unique'
                  ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
              id="pricing-toggle-visite"
            >
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Visite Unique</span>
            </button>
          </div>
        </div>

        {/* Informative banner depending on mode */}
        <div className="max-w-2xl mx-auto mb-10 text-center">
          {pricingMode === 'mensuel' && (
            <p className="text-xs text-slate-600 bg-white/80 border border-slate-200 py-2 px-4 rounded-xl inline-block shadow-sm">
              ✨ <strong>Paiement chaque mois</strong> · 1 visite à domicile par semaine · Sans engagement, résiliable à tout moment.
            </p>
          )}
          {pricingMode === 'annuel' && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 py-2 px-4 rounded-xl inline-block shadow-sm">
              🎉 <strong>Offre Sérénité Annuelle</strong> : Payez 10 mois et bénéficiez de <strong>12 mois de suivi (2 mois offerts)</strong> !
            </p>
          )}
          {pricingMode === 'visite_unique' && (
            <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 py-2 px-4 rounded-xl inline-block shadow-sm">
              🩺 <strong>Visite Ponctuelle</strong> : Idéal pour un contrôle ponctuel ou une évaluation initiale avant tout engagement.
            </p>
          )}
        </div>

        {/* Pricing Cards: Monthly Mode */}
        {pricingMode === 'mensuel' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {monthlyPlans.map((plan, idx) => (
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
                    <span>Le Plus Choisi</span>
                  </span>
                )}

                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-accent-blue inline-block mb-3">
                    {plan.badge}
                  </span>

                  <h3 className="font-display font-black text-2xl text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans mb-6">{plan.desc}</p>

                  <div className="mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-display font-black tracking-tight text-primary-brand">
                        {plan.price}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">{plan.subNote}</p>
                  </div>

                  <div className="border-t border-slate-100 my-6" />

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

                <button
                  onClick={() => onSelectPlan(plan.name, plan.numPrice, 'mensuel')}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                    plan.isPopular
                      ? 'bg-primary-brand hover:bg-blue-800 text-white hover:shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  id={`plan-monthly-btn-${idx}`}
                >
                  {plan.btnLabel}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Cards: Annual Mode */}
        {pricingMode === 'annuel' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {annualPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative p-8 sm:p-10 rounded-3xl border transition-all flex flex-col justify-between ${
                  plan.isPopular
                    ? 'bg-white border-2 border-emerald-600 shadow-2xl scale-[1.02]'
                    : 'bg-white/80 border-slate-150 shadow-md hover:border-slate-300'
                }`}
              >
                <span className="absolute -top-4 right-6 px-4 py-1.5 bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>2 Mois Offerts</span>
                </span>

                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 inline-block mb-3 border border-emerald-200">
                    {plan.badge}
                  </span>

                  <h3 className="font-display font-black text-2xl text-slate-900 mb-1">{plan.name} (Annuel)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans mb-4">{plan.desc}</p>

                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400 line-through font-bold">{plan.oldPrice} FCFA</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Économie 2 mois</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-display font-black tracking-tight text-emerald-700">
                        {plan.price}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">{plan.subNote}</p>
                  </div>

                  <div className="border-t border-slate-100 my-6" />

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex gap-3 items-start">
                        <div className="p-0.5 rounded-full mt-0.5 bg-emerald-50 text-emerald-700">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-slate-600 leading-normal font-sans">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onSelectPlan(plan.name, plan.numPrice, 'annuel')}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-lg cursor-pointer"
                  id={`plan-annual-btn-${idx}`}
                >
                  {plan.btnLabel}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Cards: Single Visit Mode */}
        {pricingMode === 'visite_unique' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {singleVisits.map((visit, idx) => (
              <div
                key={idx}
                className={`relative p-8 sm:p-10 rounded-3xl border transition-all flex flex-col justify-between ${
                  visit.isPopular
                    ? 'bg-white border-2 border-primary-brand shadow-2xl scale-[1.02]'
                    : 'bg-white/80 border-slate-150 shadow-md hover:border-slate-300'
                }`}
              >
                {visit.isPopular && (
                  <span className="absolute -top-4 right-6 px-4 py-1.5 bg-primary-brand text-white text-[10px] uppercase tracking-wider font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 fill-white/10" />
                    <span>Recommandé</span>
                  </span>
                )}

                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-accent-blue inline-block mb-3">
                    {visit.badge}
                  </span>

                  <h3 className="font-display font-black text-2xl text-slate-900 mb-2">{visit.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans mb-6">{visit.desc}</p>

                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-4xl sm:text-5xl font-display font-black tracking-tight text-slate-900">
                      {visit.price}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{visit.period}</span>
                  </div>

                  <div className="border-t border-slate-100 my-6" />

                  <div className="space-y-4 mb-8">
                    {visit.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex gap-3 items-start">
                        <div className="p-0.5 rounded-full mt-0.5 bg-blue-50 text-accent-blue">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-slate-600 leading-normal font-sans">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onSelectPlan(visit.serviceType, visit.numPrice, 'visite_unique')}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                    visit.isPopular
                      ? 'bg-primary-brand hover:bg-blue-800 text-white hover:shadow-lg'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  id={`visit-btn-${idx}`}
                >
                  {visit.btnLabel}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Assurance Card */}
        <div className="mt-14 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Besoin d'un accompagnement personnalisé pour vos parents à Dabou ?</p>
              <p className="text-xs text-slate-500">Nos conseillers soignants vous guident par téléphone ou WhatsApp pour choisir la meilleure formule.</p>
            </div>
          </div>
          <a
            href="https://wa.me/2250700000000?text=Bonjour%20Epiqure,%20je%20souhaite%20des%20renseignements%20sur%20les%20abonnements%20et%20visites"
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors"
          >
            Conseil WhatsApp direct
          </a>
        </div>
      </div>
    </section>
  );
}
