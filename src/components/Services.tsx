import { Heart, Stethoscope, BookOpen, Users, ClipboardCheck, HelpCircle } from 'lucide-react';

export default function Services() {
  const serviceList = [
    {
      icon: <Heart className="w-6 h-6 text-primary-brand" />,
      title: "Suivi des Constantes",
      desc: "Contrôle de la tension artérielle, de la glycémie capillaire et du poids à domicile pour prévenir les complications chroniques.",
      badge: "Prévention"
    },
    {
      icon: <Stethoscope className="w-6 h-6 text-primary-brand" />,
      title: "Orientation Médicale",
      desc: "Analyse de votre parcours de santé et mise en relation privilégiée avec notre réseau de médecins partenaires de Dabou.",
      badge: "Réseau Local"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-primary-brand" />,
      title: "Éducation Thérapeutique",
      desc: "Conseils diététiques, hygiène de vie personnalisée et explications claires sur vos traitements pour mieux les suivre.",
      badge: "Accompagnement"
    },
    {
      icon: <Users className="w-6 h-6 text-primary-brand" />,
      title: "Formules pour la Diaspora",
      desc: "Suivi régulier de vos parents restés au pays avec des comptes-rendus réguliers envoyés par WhatsApp pour votre tranquillité.",
      badge: "Diaspora"
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-primary-brand" />,
      title: "Bilan de Santé à Proximité",
      desc: "Des bilans préventifs simples planifiés régulièrement sans que vous n'ayez besoin de faire de longs trajets fatigants.",
      badge: "Annuel"
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-primary-brand" />,
      title: "Conseils & Assistance",
      desc: "Notre équipe reste à votre écoute par téléphone pour vous conseiller sur les démarches de santé et les structures d'accueil.",
      badge: "Bienveillance"
    }
  ];

  return (
    <section className="py-20 bg-white" id="services">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Notre Expertise</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Nos Services de Santé de Proximité</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
            Découvrez notre gamme complète d'interventions conçues pour veiller quotidiennement sur vous et votre famille à Dabou.
          </p>
          <div className="w-20 h-1 bg-primary-brand mx-auto mt-4 rounded-full" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceList.map((service, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:border-blue-100/55 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-50 group-hover:bg-primary-brand/10 rounded-xl flex items-center justify-center transition-colors mb-6">
                {service.icon}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-display font-black text-slate-900 text-base">{service.title}</h4>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                  {service.badge}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-sans">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
