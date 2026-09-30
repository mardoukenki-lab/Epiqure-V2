import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Pricing from './components/Pricing';
import WhyChooseUs from './components/WhyChooseUs';
import Steps from './components/Steps';
import Faq from './components/Faq';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import AIHelper from './components/AIHelper';
import AuthPage from './components/AuthPage';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import CursorGrid from './components/CursorGrid';
import { Appointment, Subscription } from './types';

// Route SEO metadata mapping
interface RouteMetadata {
  title: string;
  description: string;
}

const getRouteMetadata = (pathname: string, hash: string): RouteMetadata => {
  if (pathname === '/auth') {
    return {
      title: 'Connexion & Inscription – EPICURE Santé Dabou',
      description: "Accédez à votre espace sécurisé EPICURE : suivi de santé des proches à Dabou, comptes-rendus de visite soignante et gestion de vos forfaits."
    };
  }
  if (pathname === '/dashboard') {
    return {
      title: 'Espace Patient & Famille – EPICURE Dabou',
      description: "Consultez l'historique des visites soignantes, les constantes vitales de vos proches et le statut de vos forfaits de santé à domicile à Dabou."
    };
  }
  if (pathname === '/admin') {
    return {
      title: 'Portail Administration & Soignants – EPICURE Dabou',
      description: "Plateforme d'administration médicale : planning des passages à Dabou, dossiers médicaux des bénéficiaires et rapports d'interventions."
    };
  }

  // Pathname is '/' (Landing page & sections)
  if (pathname === '/') {
    if (hash === '#tarifs') {
      return {
        title: 'Forfaits & Tarifs de Santé – EPICURE Dabou',
        description: "Découvrez nos forfaits de visites médicales préventives à domicile à Dabou : Forfait Individuel, Forfait Maison et Forfait Entreprise dès 10 000 FCFA."
      };
    }
    if (hash === '#services') {
      return {
        title: 'Nos Soins & Services Médicaux – EPICURE Dabou',
        description: "Prise des constantes vitales, dépistage tensionnel & glycémie, pansements, carnet de santé numérique et orientation médicale d'urgence à Dabou."
      };
    }
    if (hash === '#etapes') {
      return {
        title: 'Comment Ça Marche – Parcours de Soins EPICURE Dabou',
        description: "Souscription en 3 étapes simples : réservation en ligne, passage hebdomadaire de l'équipe soignante à domicile et réception des comptes-rendus détaillés."
      };
    }
    if (hash === '#faq') {
      return {
        title: 'Foire Aux Questions – EPICURE Santé Dabou',
        description: "Toutes les réponses à vos questions sur les visites soignantes à domicile à Dabou, la couverture des forfaits, les paiements Mobile Money et cartes bancaires."
      };
    }
    if (hash === '#contact') {
      return {
        title: 'Contact & Urgences Médicales – EPICURE Dabou',
        description: "Contactez notre équipe de coordination médicale à Dabou par téléphone, WhatsApp ou formulaire. Assistance et orientation réactives 7j/7."
      };
    }
    if (hash === '#a-propos') {
      return {
        title: "À Propos d'EPICURE – Santé de Proximité à Dabou",
        description: "Notre mission : garantir un suivi médical digne, régulier et humain pour chaque famille et chaque parent à Dabou, Côte d'Ivoire."
      };
    }
    return {
      title: 'EPICURE – Soins & Suivi Médical à Domicile à Dabou',
      description: "Service de visites de santé préventives à domicile à Dabou, Côte d'Ivoire. Suivi tensionnel, glycémie, bilans réguliers et carnet médical numérique pour vos proches."
    };
  }

  return {
    title: 'EPICURE – Service de Santé et Soins à Domicile à Dabou',
    description: "Service de santé et visites préventives soignantes à domicile à Dabou, Côte d'Ivoire. Soins de proximité, dépistages et carnet médical numérique."
  };
};

// Firebase imports
import { auth, db, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingType, setBookingType] = useState<'visit' | 'subscribe'>('visit');
  const [selectedPlan, setSelectedPlan] = useState<'Essentiel' | 'Sérénité Parents' | undefined>(undefined);

  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'mensuel' | 'annuel' | 'visite_unique' | undefined>(undefined);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'client' | 'agent' | 'admin'>('client');
  const [authLoading, setAuthLoading] = useState(true);

  // Dynamic SEO Title & Meta Description update based on active route and section hash
  useEffect(() => {
    const { title, description } = getRouteMetadata(location.pathname, location.hash);
    document.title = title;

    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', window.location.origin + location.pathname + location.hash);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'EPICURE');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    // Update or insert canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + location.pathname);
  }, [location.pathname, location.hash]);

  // 1. Observe Authentication and Sync Profile/Data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Force ID token resolution so Firestore requests have fresh auth headers
        try {
          await firebaseUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Could not retrieve ID token:", tokenErr);
        }

        const isAdminEmail = firebaseUser.email?.toLowerCase() === 'mardoukenki@gmail.com';
        let assignedRole: 'client' | 'agent' | 'admin' = isAdminEmail ? 'admin' : 'client';

        // Check if role is stored in Firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.role) assignedRole = data.role;
          } else {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (isAdminEmail ? 'Agent de Santé (Admin)' : 'Utilisateur EPICURE'),
              photoURL: firebaseUser.photoURL || '',
              role: assignedRole,
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (error) {
          console.error("Error managing user profile in Firestore:", error);
        }

        setUserRole(assignedRole);
      } else {
        setUserRole('client');
      }

      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'agent' || user?.email?.toLowerCase() === 'mardoukenki@gmail.com';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAppointments([]);
      setSubscriptions([]);
      navigate('/');
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  const handleOpenBooking = (type: 'visit' | 'subscribe', planName?: string, billingCycle?: 'mensuel' | 'annuel' | 'visite_unique') => {
    setBookingType(type);
    setSelectedBillingCycle(billingCycle || (type === 'visit' ? 'visite_unique' : 'mensuel'));
    if (planName === 'Essentiel') {
      setSelectedPlan('Essentiel');
    } else if (planName === 'Sérénité Parents') {
      setSelectedPlan('Sérénité Parents');
    } else {
      setSelectedPlan(planName as any);
    }
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = async (newApp: Appointment) => {
    if (user) {
      try {
        const appWithUser = { ...newApp, userId: user.uid };
        await setDoc(doc(db, 'appointments', newApp.id), appWithUser);
      } catch (error) {
        console.error("Error writing appointment to Firestore:", error);
      }
    } else {
      setAppointments((prev) => [...prev, newApp]);
    }
  };

  const handleSubscriptionSuccess = async (newSub: Subscription) => {
    if (user) {
      try {
        const subWithUser = { ...newSub, userId: user.uid };
        await setDoc(doc(db, 'subscriptions', newSub.id), subWithUser);
      } catch (error) {
        console.error("Error writing subscription to Firestore:", error);
      }
    } else {
      setSubscriptions((prev) => [...prev, newSub]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-300">Chargement d'Epiqure Santé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-primary-brand selection:text-white relative" id="root-container">
      {/* Site-wide Global Interactive Cursor Grid */}
      <CursorGrid
        global
        cellSize={64}
        color="#0284c7"
        radius={140}
        falloff="smooth"
        holdTime={350}
        fadeDuration={700}
        lineWidth={1.2}
        maxOpacity={0.6}
        fillOpacity={0.06}
        gridOpacity={0.02}
        cellRadius={6}
        clickPulse
        pulseSpeed={650}
      />

      <Routes>
        {/* Landing Page Route */}
        <Route
          path="/"
          element={
            <>
              <Navbar
                user={user}
                isAdmin={isAdmin}
                onSignIn={() => navigate('/auth')}
                onSignOut={handleSignOut}
                onOpenBooking={() => handleOpenBooking('visit')}
                onOpenDashboard={() => {
                  if (user) {
                    if (isAdmin) {
                      navigate('/admin');
                    } else {
                      navigate('/dashboard');
                    }
                  } else {
                    navigate('/auth');
                  }
                }}
              />
              <main className="flex-1">
                <Hero onOpenBooking={() => handleOpenBooking('visit')} />
                <About />
                <Services />
                <Steps />
                <WhyChooseUs />
                <Pricing
                  onSelectPlan={(planName, _price, billingCycle) =>
                    handleOpenBooking(billingCycle === 'visite_unique' ? 'visit' : 'subscribe', planName, billingCycle)
                  }
                />
                <Faq />
                <Contact />
              </main>
              <Footer />
              <AIHelper />
            </>
          }
        />

        {/* Authentication Page */}
        <Route
          path="/auth"
          element={
            <AuthPage
              onBack={() => navigate('/')}
              onSuccess={() => {
                if (isAdmin) {
                  navigate('/admin');
                } else {
                  navigate('/dashboard');
                }
              }}
            />
          }
        />

        {/* Client Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <ClientDashboard
                user={user}
                onBack={() => navigate('/')}
                onSignOut={handleSignOut}
                onOpenBooking={() => handleOpenBooking('visit')}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Admin Dashboard Route */}
        <Route
          path="/admin"
          element={
            user && isAdmin ? (
              <AdminDashboard
                user={user}
                onBack={() => navigate('/')}
                onSignOut={handleSignOut}
              />
            ) : user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Booking Modal with Resend confirmation support */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialType={bookingType}
        initialPlan={selectedPlan}
        initialBillingCycle={selectedBillingCycle}
        onBookingSuccess={handleBookingSuccess}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        currentUser={user}
      />
    </div>
  );
}
