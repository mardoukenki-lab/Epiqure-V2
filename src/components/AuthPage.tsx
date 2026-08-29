import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { 
  auth, googleProvider, signInWithPopup 
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { 
  Heart, ArrowLeft, Mail, Lock, User as UserIcon, Sparkles, AlertCircle, CheckCircle, PhoneCall
} from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AuthPage({ onBack, onSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMsg("Connexion réussie ! Redirection...");
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup window before completing auth; reset silently.
        return;
      }
      console.error("Google auth error", err);
      setError("La connexion avec Google a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Veuillez saisir votre adresse email ci-dessus pour recevoir un lien de réinitialisation.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`Un e-mail de réinitialisation de mot de passe a été envoyé à ${email}. Veuillez vérifier votre boîte de réception.`);
    } catch (err: any) {
      console.error("Password reset error", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError("Aucun compte trouvé pour cette adresse email.");
      } else {
        setError("Impossible d'envoyer l'e-mail de réinitialisation. Veuillez vérifier l'adresse email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !fullName)) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        // Send verification email
        try {
          await sendEmailVerification(userCredential.user);
        } catch (verifErr) {
          console.warn("Could not send email verification:", verifErr);
        }
        setSuccessMsg("Votre compte a été créé avec succès ! Un e-mail de vérification vous a été envoyé.");
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Connexion réussie !");
      }
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error("Email auth error", err);
      let frenchMessage = "Une erreur est survenue. Veuillez réessayer.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        frenchMessage = "Adresse email ou mot de passe incorrect.";
      } else if (err.code === 'auth/email-already-in-use') {
        frenchMessage = "Cette adresse email est déjà associée à un compte.";
      } else if (err.code === 'auth/weak-password') {
        frenchMessage = "Le mot de passe doit contenir au moins 6 caractères.";
      } else if (err.code === 'auth/invalid-email') {
        frenchMessage = "Format d'adresse email invalide.";
      }
      setError(frenchMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans" id="auth-page-container">
      {/* Left visual brand sidebar - Desktop only */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Background ambient radial glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all group mr-2 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
            E
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight">Epiqure</span>
            <span className="block text-[8px] uppercase tracking-widest font-mono text-emerald-400 font-bold">Santé &amp; Proximité</span>
          </div>
        </div>

        {/* Dynamic value statements */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Espace Adhérent Sécurisé</span>
            <h1 className="font-display font-black text-4xl leading-tight tracking-tight text-white">
              Votre tiers de confiance santé à Dabou.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Connectez-vous pour planifier des visites de santé pour vos parents à Dabou, suivre l'évolution de leurs constantes médicales, et recevoir des rapports instantanés sur WhatsApp.
            </p>
          </div>

          <div className="space-y-4 border-l-2 border-emerald-500/50 pl-6">
            <div className="flex gap-3 items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Idéal pour la Diaspora</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Où que vous soyez dans le monde, prenez soin de vos proches à Dabou en toute sécurité et transparence.
            </p>
          </div>
        </div>

        {/* Footer contact */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Epiqure. Dabou, Côte d'Ivoire.</p>
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>01 01 68 25 35</span>
          </div>
        </div>
      </div>

      {/* Right Form side */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 bg-white relative">
        {/* Back button for mobile */}
        <button 
          onClick={onBack}
          className="lg:hidden absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        {/* Small header logo for mobile */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
            E
          </div>
          <div>
            <span className="font-display font-extrabold text-sm tracking-tight text-slate-900">Epiqure</span>
            <span className="block text-[7px] uppercase tracking-wider font-mono text-slate-400 font-bold">Santé &amp; Proximité</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Section title */}
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {isSignUp ? "Créer un compte" : "Bon retour parmi nous !"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-sans">
              {isSignUp 
                ? "Inscrivez-vous pour bénéficier d'un suivi de santé d'exception pour vos proches." 
                : "Connectez-vous à votre espace personnel pour suivre vos rendez-vous et abonnements."
              }
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-3 text-rose-900 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl flex items-start gap-3 text-emerald-900 text-xs font-medium"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Votre Nom Complet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean Koffi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800 font-medium transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800 font-medium transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Mot de Passe</label>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800 font-medium transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? "Créer mon compte" : "Se connecter"}</span>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-150" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold text-[10px] tracking-wider">Ou continuer avec</span>
            </div>
          </div>

          {/* Social Google Login Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 0 1-2.45 3.71v3.08h3.95a11.94 11.94 0 0 0 3.63-8.64z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.1.74-2.5 1.18-4.01 1.18-3.09 0-5.71-2.09-6.64-4.9H1.37v3.18A11.95 11.95 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.36 14.29a7.14 7.14 0 0 1 0-4.58V6.53H1.37a11.95 11.95 0 0 0 0 10.94l3.99-3.18z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.92 11.92 0 0 0 12 0 11.95 11.95 0 0 0 1.37 6.53l3.99 3.18c.93-2.81 3.55-4.96 6.64-4.96z"
              />
            </svg>
            <span>Connexion Google</span>
          </button>

          {/* Toggle between connection/sign up */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              {isSignUp 
                ? "Vous avez déjà un compte ? Se connecter" 
                : "Nouveau chez Epiqure ? Créer un compte"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
