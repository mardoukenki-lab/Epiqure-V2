import { ShieldCheck, Share2, ClipboardList, HeartPulse } from 'lucide-react';

export default function WhyChooseUs() {
  const points = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Rigueur & Sécurité médicale",
      desc: "Tous nos techniciens et infirmiers de proximité à Dabou sont formés, certifiés et équipés d'outils médicaux de précision pour un suivi irréprochable."
    },
    {
      icon: <Share2 className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-50",
      title: "Sérénité pour la Diaspora",
      desc: "À 5000 km ou à Abidjan, recevez en temps réel un rapport après chaque passage. Plus besoin d'attendre l'appel dominical pour avoir des nouvelles de santé."
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-amber-600" />,
      bg: "bg-amber-50",
      title: "Réseau d'orientation solide",
      desc: "EPICURE travaille main dans la main avec l'Hôpital Général, les meilleures officines locales et des médecins spécialistes pour vous orienter au besoin."
    },
    {
      icon: <HeartPulse className="w-6 h-6 text-rose-600" />,
      bg: "bg-rose-50",
      title: "Lutte contre l'automédication",
      desc: "En guidant vos proches vers des professionnels qualifiés dès les premiers symptômes, nous évitons les risques liés à l'achat sauvage de médicaments."
    }
  ];

  return (
    <section className="py-20 bg-white" id="why-choose-us">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left panel - heading */}
          <div className="space-y-6 lg:col-span-5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nos Avantages</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900">Pourquoi choisir EPICURE ?</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans">
                Nous allions technologie, rigueur médicale et bienveillance locale pour offrir un accompagnement digne à vos proches résidant à Dabou.
              </p>
              <div className="w-16 h-1 bg-primary-brand mt-4 rounded-full" />
            </div>
          </div>

          {/* Right panel - cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {points.map((pt, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/20 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 ${pt.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {pt.icon}
                </div>
                <h4 className="font-display font-black text-slate-900 text-sm mb-2">{pt.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
