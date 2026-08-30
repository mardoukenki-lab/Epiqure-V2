import { PenTool, Calendar, Shield, MessageSquareText } from 'lucide-react';

export default function Steps() {
  const stepList = [
    {
      num: "01",
      icon: <PenTool className="w-5 h-5 text-primary-brand" />,
      title: "Souscription ou Demande",
      desc: "Inscrivez votre parent en ligne via notre formulaire simplifié ou réservez un premier bilan ponctuel de santé."
    },
    {
      num: "02",
      icon: <Calendar className="w-5 h-5 text-primary-brand" />,
      title: "Planification locale",
      desc: "Notre secrétariat local à Dabou appelle le bénéficiaire pour caler la date et l'heure du passage à domicile."
    },
    {
      num: "03",
      icon: <Shield className="w-5 h-5 text-primary-brand" />,
      title: "Passage à domicile",
      desc: "Notre infirmier de proximité se déplace à vélo ou en moto pour effectuer les tests prévus avec bienveillance."
    },
    {
      num: "04",
      icon: <MessageSquareText className="w-5 h-5 text-primary-brand" />,
      title: "Rapport instantané",
      desc: "Le parrain local ou à l'étranger reçoit sous 24 heures la fiche de synthèse sur son smartphone via WhatsApp."
    }
  ];

  return (
    <section className="py-20 bg-slate-50/50 relative overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Simplicité d'Usage</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Un parcours fluide en 4 étapes</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
            Que vous habitiez à Dabou, à Abidjan ou en Europe, découvrez comment notre service s'active pour vos proches.
          </p>
          <div className="w-20 h-1 bg-primary-brand mx-auto mt-4 rounded-full" />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stepList.map((step, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-150 relative shadow-sm hover:shadow-md transition-all">
              {/* Step counter */}
              <span className="absolute top-4 right-6 font-display font-black text-3xl text-slate-100">
                {step.num}
              </span>

              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                {step.icon}
              </div>

              <h4 className="font-display font-black text-slate-900 text-sm mb-2">{step.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
