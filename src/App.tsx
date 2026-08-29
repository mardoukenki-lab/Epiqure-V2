import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Pricing from './components/Pricing';
import WhyChooseUs from './components/WhyChooseUs';
import Steps from './components/Steps';
import Partners from './components/Partners';
import Faq from './components/Faq';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import AIHelper from './components/AIHelper';
import AuthPage from './components/AuthPage';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Appointment, Subscription } from './types';

// Firebase imports
import { auth, db, googleProvider, signInWithPopup, signOut } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingType, setBookingType] = useState<'visit' | 'subscribe'>('visit');
  const [selectedPlan, setSelectedPlan] = useState<'Essentiel' | 'Sérénité Parents' | undefined>(undefined);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'client' | 'agent' | 'admin'>('client');
  const [authLoading, setAuthLoading] = useState(true);

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

  const handleOpenBooking = (type: 'visit' | 'subscribe', planName?: string) => {
    setBookingType(type);
    if (planName === 'Essentiel') {
      setSelectedPlan('Essentiel');
    } else if (planName === 'Sérénité Parents') {
      setSelectedPlan('Sérénité Parents');
    } else {
      setSelectedPlan(undefined);
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
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-primary-brand selection:text-white" id="root-container">
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
                  onSelectPlan={(planName) => handleOpenBooking('subscribe', planName)}
                />
                <Partners />
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
        onBookingSuccess={handleBookingSuccess}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        currentUser={user}
      />
    </div>
  );
}
