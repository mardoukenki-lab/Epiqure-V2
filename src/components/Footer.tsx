export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 border-t border-slate-850">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1 - Brand description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-extrabold font-display">
                E
              </div>
              <span className="font-display font-extrabold text-base tracking-tight text-white">
                Epiqure
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Service d'Itinéraire de Santé et de Proximité à Dabou, Côte d'Ivoire. Nous rapprochons les contrôles préventifs essentiels de votre foyer pour votre sérénité.
            </p>
          </div>

          {/* Column 2 - Links */}
          <div>
            <h5 className="font-display font-black text-xs uppercase tracking-wider mb-4 text-slate-200">
              Epiqure
            </h5>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <a className="hover:text-white transition-colors" href="#home">
                  Accueil
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#services">
                  Nos Services
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#abonnements">
                  Forfaits d'Abonnement
                </a>
              </li>
              <li>
                <a className="hover:text-white transition-colors" href="#about">
                  Qui sommes-nous ?
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 - Specialization */}
          <div>
            <h5 className="font-display font-black text-xs uppercase tracking-wider mb-4 text-slate-200">
              POUR LA DIASPORA
            </h5>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <span className="text-slate-400">Suivi rigoureux des parents</span>
              </li>
              <li>
                <span className="text-slate-400">Comptes-rendus sur WhatsApp</span>
              </li>
              <li>
                <span className="text-slate-400">Tranquillité d'esprit garantie</span>
              </li>
              <li>
                <span className="text-slate-400">Paiement en ligne sécurisé</span>
              </li>
            </ul>
          </div>

          {/* Column 4 - Localisation */}
          <div>
            <h5 className="font-display font-black text-xs uppercase tracking-wider mb-4 text-slate-200">
              CONTACT LOCAL
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Dabou, Côte d'Ivoire<br />
              Quartier Résidentiel<br />
              Tél : +225 01 01 68 25 35<br />
              Email : direction@epiqure.online
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-800 my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-500 font-sans">
            &copy; {new Date().getFullYear()} Epiqure. Tous droits réservés. Service d'accompagnement de proximité.
          </p>
          <div className="flex gap-4 text-[10px] text-slate-500">
            <span className="hover:text-slate-400 cursor-pointer">Confidentialité</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 cursor-pointer">Mentions Légales</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
