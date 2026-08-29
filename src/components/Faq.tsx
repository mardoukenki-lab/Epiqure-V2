import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "EPICURE remplace-t-il mon médecin traitant ?",
      a: "Non, EPICURE est un service d'accompagnement et de suivi préventif à domicile. Nous surveillons vos constantes clés de santé (tension artérielle, glycémie) et facilitons votre parcours de soins en vous orientant vers nos médecins spécialistes partenaires ou vers l'Hôpital Général si nécessaire."
    },
    {
      q: "Comment la diaspora peut-elle s'assurer de la bonne exécution des visites ?",
      a: "Avec la formule 'Sérénité Parents', nos infirmiers rédigent un bilan d'évaluation complet après chaque passage à domicile. Ce rapport vous est transmis directement par message WhatsApp ou par Email sous 24 heures. En cas d'anomalie, vous êtes immédiatement alerté par appel téléphonique."
    },
    {
      q: "Quels sont les quartiers pris en charge à Dabou ?",
      a: "Nous couvrons l'ensemble de la commune de Dabou et ses proches alentours : le Quartier Résidentiel, Dabou Centre, les quartiers Pass, Layo, ainsi que les villages intégrés comme Debrimou. Tous les frais de transport de nos professionnels de santé sont entièrement inclus dans le forfait d'abonnement."
    },
    {
      q: "Comment s'effectue le règlement des abonnements ?",
      a: "Les abonnements sont mensuels et sans aucun engagement de durée. Pour faciliter la vie des parrains, nous acceptons les paiements locaux par Mobile Money (Wave, Orange Money, MTN MoMo) ainsi que les paiements sécurisés par carte de crédit pour la diaspora résidant à l'étranger."
    }
  ];

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Des réponses à vos doutes</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Questions Fréquentes (FAQ)</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
            Retrouvez les réponses aux questions courantes concernant le fonctionnement de nos services à domicile à Dabou.
          </p>
          <div className="w-20 h-1 bg-primary-brand mx-auto mt-4 rounded-full" />
        </div>

        {/* Faq List */}
        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className="border border-slate-150 rounded-2xl overflow-hidden transition-all bg-slate-50/20"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left p-6 font-display font-black text-sm text-slate-900 flex justify-between items-center gap-4 focus:outline-none"
              >
                <span>{f.q}</span>
                {openIdx === idx ? (
                  <ChevronUp className="w-4 h-4 text-primary-brand shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {openIdx === idx && (
                <div className="p-6 pt-0 border-t border-slate-100/50 text-xs text-slate-600 leading-relaxed font-sans bg-white">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
