import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { 
  ShieldCheck, Users, Stethoscope, Activity, Calendar, FileText, 
  Plus, Check, Clock, AlertCircle, ArrowLeft, LogOut, Download, Search, CheckCircle2, X,
  Phone, MessageCircle, MapPin, Eye, Filter, HeartPulse, Sparkles, UserCheck, Copy,
  CalendarCheck, ChevronRight
} from 'lucide-react';
import { Appointment, Subscription, MedicalRecord } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  phone?: string;
  profession?: string;
  matricule?: string;
  interventionZone?: string;
  createdAt?: string;
}

export interface ConsolidatedPatient {
  id: string; // Unique patient reference (e.g. PAT-XXXXXX)
  primaryUid?: string;
  name: string;
  phone: string;
  email?: string;
  neighborhood: string;
  appointments: Appointment[];
  subscriptions: Subscription[];
  reports: any[];
  statusBadge: { text: string; color: string };
  lastInteractionDate?: string;
  latestTension?: string;
  latestGlycemie?: number | string;
}

interface AdminDashboardProps {
  user: FirebaseUser | null;
  onBack: () => void;
  onSignOut: () => void;
}

export default function AdminDashboard({
  user,
  onBack,
  onSignOut
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'appointments' | 'subscriptions' | 'visits' | 'report-entry' | 'users'>('overview');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Search and Patient Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [patientFilterCategory, setPatientFilterCategory] = useState<'all' | 'pending-rdv' | 'subscribed' | 'has-reports'>('all');
  const [selectedPatientModal, setSelectedPatientModal] = useState<ConsolidatedPatient | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Examination Report Entry State
  const [repBeneficiary, setRepBeneficiary] = useState('');
  const [repUserId, setRepUserId] = useState('');
  const [repDate, setRepDate] = useState(new Date().toISOString().split('T')[0]);
  const [repTensionSys, setRepTensionSys] = useState('');
  const [repTensionDia, setRepTensionDia] = useState('');
  const [repGlycemie, setRepGlycemie] = useState('');
  const [repNotes, setRepNotes] = useState('');
  const [repRecom, setRepRecom] = useState('');
  const [repSuccessMsg, setRepSuccessMsg] = useState<string | null>(null);
  const [isSubmittingRep, setIsSubmittingRep] = useState(false);

  // Field Visits State
  const [fieldVisits, setFieldVisits] = useState<any[]>([]);
  const [visitClientName, setVisitClientName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitNeighborhood, setVisitNeighborhood] = useState('Quartier Résidentiel');
  const [visitAgentName, setVisitAgentName] = useState('');

  // 1. Load All Appointments across Dabou
  useEffect(() => {
    try {
      const q = query(collection(db, 'appointments'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Appointment));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAppointments(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Admin appointments listener notice:", err);
    }
  }, []);

  // 2. Load All Subscriptions across Dabou
  useEffect(() => {
    try {
      const q = query(collection(db, 'subscriptions'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Subscription[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Subscription));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSubscriptions(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Admin subscriptions listener notice:", err);
    }
  }, []);

  // 3. Load Registered Users
  useEffect(() => {
    try {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as UserProfile));
        setRegisteredUsers(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Admin users listener notice:", err);
    }
  }, []);

  // 4. Load All Reports
  useEffect(() => {
    try {
      const q = query(collection(db, 'reports'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setReports(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Admin reports listener notice:", err);
    }
  }, []);

  // Appointment Status Toggle
  const handleUpdateAppointmentStatus = async (appId: string, newStatus: 'confirmed' | 'completed' | 'cancelled' | 'pending') => {
    try {
      await updateDoc(doc(db, 'appointments', appId), { status: newStatus });
    } catch (err) {
      console.error("Error updating appointment status:", err);
    }
  };

  // Subscription Status Toggle
  const handleUpdateSubStatus = async (subId: string, newStatus: 'active' | 'pending' | 'cancelled' | 'paused') => {
    try {
      await updateDoc(doc(db, 'subscriptions', subId), { status: newStatus });
    } catch (err) {
      console.error("Error updating subscription status:", err);
    }
  };

  // User Role Toggle
  const handleUpdateUserRole = async (userId: string, newRole: 'client' | 'agent' | 'admin') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  // Save Examination Report Form
  const handleCreateReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!repBeneficiary) return;

    setIsSubmittingRep(true);
    const tension = `${repTensionSys}/${repTensionDia}`;
    const glycemie = parseFloat(repGlycemie) || 0.95;

    const newReport = {
      id: 'REP-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      userId: repUserId || user?.uid,
      beneficiaryName: repBeneficiary,
      date: repDate,
      tension: tension,
      glycemie: glycemie,
      notes: repNotes || '',
      recommandations: repRecom || '',
      sentVia: 'Email & WhatsApp',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'reports'), newReport);
      setRepSuccessMsg(`Rapport médical créé et transmis pour ${repBeneficiary} !`);
      setRepNotes('');
      setRepRecom('');
      setTimeout(() => setRepSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Erreur d'enregistrement du rapport:", err);
    } finally {
      setIsSubmittingRep(false);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    let csv = "ID,Beneficiaire,Service/Plan,Date,Statut\n";
    appointments.forEach(a => {
      csv += `"${a.id}","${a.beneficiaryName}","${a.serviceType}","${a.preferredDate}","${a.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epicure_rdv_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Copy patient ID to clipboard
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Switch to report form prefilled with patient data
  const handleStartReportForPatient = (pat: ConsolidatedPatient) => {
    setRepBeneficiary(pat.name);
    setRepUserId(pat.primaryUid || '');
    setActiveTab('report-entry');
    if (selectedPatientModal) {
      setSelectedPatientModal(null);
    }
  };

  // 5. Consolidate unified Patient Directory across Users, Appointments, Subscriptions, and Reports
  const consolidatedPatients = useMemo<ConsolidatedPatient[]>(() => {
    const patientMap = new Map<string, ConsolidatedPatient>();

    const getKey = (name: string, phone: string, uid?: string) => {
      if (uid && uid.length > 5) return `uid_${uid}`;
      const cleanName = (name || '').trim().toLowerCase();
      const cleanPhone = (phone || '').replace(/\s+/g, '');
      return cleanPhone ? `phone_${cleanPhone}` : `name_${cleanName}`;
    };

    // 1. From Registered Users
    registeredUsers.forEach((u) => {
      if (u.role === 'agent' || u.role === 'admin') return; // only clients/patients
      const key = `uid_${u.uid}`;
      const name = u.displayName || u.email.split('@')[0];
      patientMap.set(key, {
        id: `PAT-${u.uid.slice(0, 6).toUpperCase()}`,
        primaryUid: u.uid,
        name: name,
        phone: u.phone || '',
        email: u.email,
        neighborhood: u.interventionZone || 'Dabou',
        appointments: [],
        subscriptions: [],
        reports: [],
        statusBadge: { text: 'Compte Enregistré', color: 'bg-slate-100 text-slate-700 border-slate-200' }
      });
    });

    // 2. From Appointments
    appointments.forEach((app) => {
      const patientName = app.beneficiaryName || app.fullName || 'Patient';
      const phone = app.beneficiaryPhone || app.phone || '';
      const key = app.userId ? `uid_${app.userId}` : getKey(patientName, phone);

      let existing = patientMap.get(key);
      if (!existing) {
        existing = {
          id: `PAT-${app.id.slice(-6).toUpperCase()}`,
          primaryUid: app.userId,
          name: patientName,
          phone: phone,
          email: app.email,
          neighborhood: app.beneficiaryNeighborhood || app.neighborhood || 'Dabou Centre',
          appointments: [],
          subscriptions: [],
          reports: [],
          statusBadge: { text: 'Visite Demandée', color: 'bg-amber-100 text-amber-800 border-amber-200' }
        };
        patientMap.set(key, existing);
      }

      existing.appointments.push(app);
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.neighborhood || existing.neighborhood === 'Dabou') {
        existing.neighborhood = app.beneficiaryNeighborhood || app.neighborhood || 'Dabou Centre';
      }
    });

    // 3. From Subscriptions
    subscriptions.forEach((sub) => {
      const patientName = sub.beneficiaryName || sub.householdOrCompanyName || sub.subscriberName || 'Abonné';
      const phone = sub.beneficiaryPhone || sub.subscriberPhone || '';
      const key = sub.userId ? `uid_${sub.userId}` : getKey(patientName, phone);

      let existing = patientMap.get(key);
      if (!existing) {
        existing = {
          id: `PAT-${sub.id.slice(-6).toUpperCase()}`,
          primaryUid: sub.userId,
          name: patientName,
          phone: phone,
          email: sub.subscriberEmail,
          neighborhood: sub.beneficiaryNeighborhood || 'Dabou Centre',
          appointments: [],
          subscriptions: [],
          reports: [],
          statusBadge: { text: `Abonné ${sub.planName}`, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
        };
        patientMap.set(key, existing);
      }

      existing.subscriptions.push(sub);
      if (!existing.phone && phone) existing.phone = phone;
      if (sub.beneficiaryNeighborhood) existing.neighborhood = sub.beneficiaryNeighborhood;
    });

    // 4. From Reports
    reports.forEach((rep) => {
      const patientName = rep.beneficiaryName || 'Patient';
      const key = rep.userId ? `uid_${rep.userId}` : getKey(patientName, '');

      let existing = patientMap.get(key);
      if (!existing) {
        existing = {
          id: `PAT-${rep.id.slice(-6).toUpperCase()}`,
          primaryUid: rep.userId,
          name: patientName,
          phone: '',
          neighborhood: 'Dabou Centre',
          appointments: [],
          subscriptions: [],
          reports: [],
          statusBadge: { text: 'Suivi Médical', color: 'bg-blue-100 text-blue-800 border-blue-200' }
        };
        patientMap.set(key, existing);
      }

      existing.reports.push(rep);
    });

    // Compute badges, latest interaction, tension, and glycemie
    const list = Array.from(patientMap.values()).map((pat) => {
      const hasActiveSub = pat.subscriptions.some(s => (s.status as string)?.toLowerCase() === 'active');
      const hasPendingApp = pat.appointments.some(a => (a.status as string)?.toLowerCase() === 'pending');
      
      let badge = { text: 'Patient Régulier', color: 'bg-slate-100 text-slate-800 border-slate-300' };
      if (hasPendingApp) {
        badge = { text: 'RDV en attente', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      } else if (hasActiveSub) {
        badge = { text: 'Abonné Actif', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      } else if (pat.reports.length > 0) {
        badge = { text: `${pat.reports.length} rapport(s)`, color: 'bg-blue-100 text-blue-900 border-blue-300' };
      }

      // Collect dates
      const dates: string[] = [];
      pat.appointments.forEach(a => { if (a.preferredDate) dates.push(a.preferredDate); });
      pat.reports.forEach(r => { if (r.date) dates.push(r.date); });
      pat.subscriptions.forEach(s => { if (s.startDate) dates.push(s.startDate); });
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      // Get latest report clinical data
      let latestTension: string | undefined;
      let latestGlycemie: number | string | undefined;
      if (pat.reports.length > 0) {
        const sortedReports = [...pat.reports].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        latestTension = sortedReports[0].tension;
        latestGlycemie = sortedReports[0].glycemie;
      }

      return {
        ...pat,
        statusBadge: badge,
        lastInteractionDate: dates[0] || undefined,
        latestTension,
        latestGlycemie
      };
    });

    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [registeredUsers, appointments, subscriptions, reports]);

  // Normalized search query string
  const queryNormalized = searchQuery.trim().toLowerCase();

  // 6. Filter Patients by name, unique ID, phone, neighborhood, or email
  const filteredPatients = useMemo(() => {
    let result = consolidatedPatients;

    // Filter by query (Name or Unique ID or Phone or Neighborhood)
    if (queryNormalized) {
      result = result.filter((p) => {
        const matchName = p.name.toLowerCase().includes(queryNormalized);
        const matchId = p.id.toLowerCase().includes(queryNormalized) || (p.primaryUid && p.primaryUid.toLowerCase().includes(queryNormalized));
        const matchPhone = p.phone.toLowerCase().replace(/\s+/g, '').includes(queryNormalized.replace(/\s+/g, ''));
        const matchNeighborhood = p.neighborhood.toLowerCase().includes(queryNormalized);
        const matchEmail = p.email ? p.email.toLowerCase().includes(queryNormalized) : false;
        const matchAppId = p.appointments.some(a => a.id.toLowerCase().includes(queryNormalized));
        const matchSubId = p.subscriptions.some(s => s.id.toLowerCase().includes(queryNormalized));
        const matchRepId = p.reports.some(r => (r.id || '').toLowerCase().includes(queryNormalized));

        return matchName || matchId || matchPhone || matchNeighborhood || matchEmail || matchAppId || matchSubId || matchRepId;
      });
    }

    // Filter by quick category chip
    if (patientFilterCategory === 'pending-rdv') {
      result = result.filter(p => p.appointments.some(a => a.status?.toLowerCase() === 'pending'));
    } else if (patientFilterCategory === 'subscribed') {
      result = result.filter(p => p.subscriptions.length > 0);
    } else if (patientFilterCategory === 'has-reports') {
      result = result.filter(p => p.reports.length > 0);
    }

    return result;
  }, [consolidatedPatients, queryNormalized, patientFilterCategory]);

  // 7. Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (!queryNormalized) return appointments;
    return appointments.filter(a => 
      (a.beneficiaryName || a.fullName || '').toLowerCase().includes(queryNormalized) ||
      a.id.toLowerCase().includes(queryNormalized) ||
      (a.userId && a.userId.toLowerCase().includes(queryNormalized)) ||
      (a.beneficiaryPhone || a.phone || '').toLowerCase().includes(queryNormalized) ||
      (a.beneficiaryNeighborhood || a.neighborhood || '').toLowerCase().includes(queryNormalized) ||
      a.serviceType.toLowerCase().includes(queryNormalized)
    );
  }, [appointments, queryNormalized]);

  // 8. Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!queryNormalized) return subscriptions;
    return subscriptions.filter(s => 
      (s.beneficiaryName || s.householdOrCompanyName || s.subscriberName || '').toLowerCase().includes(queryNormalized) ||
      s.id.toLowerCase().includes(queryNormalized) ||
      (s.userId && s.userId.toLowerCase().includes(queryNormalized)) ||
      (s.subscriberPhone || s.beneficiaryPhone || '').toLowerCase().includes(queryNormalized) ||
      (s.beneficiaryNeighborhood || '').toLowerCase().includes(queryNormalized) ||
      s.planName.toLowerCase().includes(queryNormalized)
    );
  }, [subscriptions, queryNormalized]);

  // 9. Filtered Users
  const filteredUsers = useMemo(() => {
    if (!queryNormalized) return registeredUsers;
    return registeredUsers.filter(u => 
      (u.displayName || '').toLowerCase().includes(queryNormalized) ||
      u.uid.toLowerCase().includes(queryNormalized) ||
      u.email.toLowerCase().includes(queryNormalized) ||
      (u.role || '').toLowerCase().includes(queryNormalized)
    );
  }, [registeredUsers, queryNormalized]);

  const pendingAppointments = appointments.filter(a => (a.status as string)?.toLowerCase() === 'pending');
  const activeSubscriptions = subscriptions.filter(s => (s.status as string)?.toLowerCase() === 'active');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Accueil</span>
            </button>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white text-sm">
                ⚙️
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">Epiqure Administration</span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block -mt-1">Console Agent &amp; Gestion</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                {user?.displayName || user?.email || 'Admin'}
              </span>
            </div>
            <button
              onClick={onSignOut}
              title="Déconnexion"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PROMINENT PATIENT SEARCH BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
                <Search className="w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un patient par nom, identifiant unique (ex: PAT-..., UID, Ref RDV), téléphone ou quartier..."
                className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-10 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Quick Result Counter or Direct Tab Switch */}
            <div className="flex items-center gap-2 shrink-0">
              {searchQuery ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{filteredPatients.length} patient(s) trouvé(s)</span>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="ml-1 text-[11px] underline hover:text-amber-800 cursor-pointer font-extrabold"
                  >
                    Voir fiches
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('patients')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-slate-200"
                >
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Dossiers Patients ({consolidatedPatients.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-3 border-t border-slate-100 no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filtres :</span>
            </span>
            <button
              onClick={() => setPatientFilterCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                patientFilterCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({consolidatedPatients.length})
            </button>
            <button
              onClick={() => setPatientFilterCategory('pending-rdv')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                patientFilterCategory === 'pending-rdv'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              RDV en attente ({pendingAppointments.length})
            </button>
            <button
              onClick={() => setPatientFilterCategory('subscribed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                patientFilterCategory === 'subscribed'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Abonnés Actifs ({activeSubscriptions.length})
            </button>
            <button
              onClick={() => setPatientFilterCategory('has-reports')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                patientFilterCategory === 'has-reports'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Avec Bilans Médicaux ({consolidatedPatients.filter(p => p.reports.length > 0).length})
            </button>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-auto text-xs text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Effacer recherche</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-slate-300">
          {[
            { id: 'overview', label: 'Vue Globale', icon: Activity },
            { id: 'patients', label: 'Dossiers Patients', icon: Users, badge: filteredPatients.length },
            { id: 'appointments', label: 'Rendez-vous', icon: Calendar, badge: pendingAppointments.length },
            { id: 'subscriptions', label: 'Abonnements', icon: Stethoscope, badge: activeSubscriptions.length },
            { id: 'report-entry', label: 'Saisir Rapport', icon: FileText },
            { id: 'users', label: 'Utilisateurs', icon: UserCheck, badge: registeredUsers.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Real-time search matches preview on Overview */}
            {searchQuery && (
              <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Search className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-sm">
                      Résultats de recherche pour « {searchQuery} » ({filteredPatients.length} patient(s) trouvé(s))
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ouvrir l'annuaire complet</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Aucun patient ne correspond à cette recherche.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPatients.slice(0, 6).map((pat) => (
                      <div
                        key={pat.id}
                        className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-xs text-slate-900 truncate">{pat.name}</span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {pat.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{pat.neighborhood}</span>
                            {pat.phone && <span className="shrink-0">· {pat.phone}</span>}
                          </p>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedPatientModal(pat)}
                            className="text-[11px] font-bold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Fiche</span>
                          </button>
                          <button
                            onClick={() => handleStartReportForPatient(pat)}
                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Rapport</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RDV à traiter</span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingAppointments.length}</p>
                  <span className="text-xs font-semibold text-slate-500 mt-0.5 block">Demandes en attente</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Abonnés Actifs</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeSubscriptions.length}</p>
                  <span className="text-xs font-semibold text-slate-500 mt-0.5 block">Souscriptions actives</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rapports Rédigés</span>
                  <p className="text-2xl font-extrabold text-blue-600 mt-1">{reports.length}</p>
                  <span className="text-xs font-semibold text-slate-500 mt-0.5 block">Comptes-rendus agents</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comptes Clients</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{registeredUsers.length}</p>
                  <span className="text-xs font-semibold text-slate-500 mt-0.5 block">Utilisateurs enregistrés</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Pending Appointments Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span>Demandes de Rendez-vous en Attente</span>
                </h2>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  Gérer tous les RDV
                </button>
              </div>

              {pendingAppointments.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 font-medium">
                  Aucun rendez-vous en attente de confirmation.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAppointments.slice(0, 4).map((app) => (
                    <div key={app.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{app.beneficiaryName}</span>
                          <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">{app.serviceType}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Souhaité le {app.preferredDate} à {app.preferredTime} · Quartier: {app.beneficiaryNeighborhood} · Tél: {app.beneficiaryPhone}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateAppointmentStatus(app.id, 'confirmed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => handleUpdateAppointmentStatus(app.id, 'cancelled')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PATIENTS DIRECTORY */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Dossiers &amp; Répertoire des Patients (Dabou)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      {filteredPatients.length} patient(s)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fiches médicales, identifiants uniques, constantes vitales et suivi des interventions à domicile.
                  </p>
                </div>

                {searchQuery && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Filtre actif : « {searchQuery} »
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Effacer
                    </button>
                  </div>
                )}
              </div>

              {filteredPatients.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Aucun patient trouvé</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Aucun patient ne correspond à « {searchQuery} ». Vérifiez le nom, numéro de téléphone ou identifiant unique.
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-500 cursor-pointer shadow-xs"
                    >
                      Effacer les critères de recherche
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.map((pat) => (
                    <div
                      key={pat.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header: Avatar, Name, Unique ID */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                              {pat.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">{pat.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {pat.id}
                                </span>
                                <button
                                  onClick={() => handleCopyId(pat.id)}
                                  title="Copier l'identifiant"
                                  className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                >
                                  {copiedId === pat.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${pat.statusBadge.color}`}>
                            {pat.statusBadge.text}
                          </span>
                        </div>

                        {/* Location and Contact */}
                        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-semibold text-slate-800">{pat.neighborhood}</span>
                          </p>
                          {pat.phone && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="font-mono text-slate-700">{pat.phone}</span>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${pat.phone}`}
                                  className="p-1.5 rounded-lg bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                                  title="Appeler"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${pat.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                                  title="Contacter sur WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Health Stats Overview */}
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dernière TA</span>
                            <span className="font-extrabold text-slate-800 text-xs">
                              {pat.latestTension || '—'}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Glycémie</span>
                            <span className="font-extrabold text-slate-800 text-xs">
                              {pat.latestGlycemie ? `${pat.latestGlycemie} g/L` : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Interactions count summary */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                          <span>{pat.appointments.length} rendez-vous</span>
                          <span>{pat.reports.length} bilan(s) rédigé(s)</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedPatientModal(pat)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Dossier</span>
                        </button>
                        <button
                          onClick={() => handleStartReportForPatient(pat)}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rapport</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-0.5">Tous les Rendez-vous Clients (Dabou)</h2>
                <p className="text-xs text-slate-500">Validez, annulez ou modifiez le statut des demandes de visites.</p>
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Filtre actif : « {searchQuery} » ({filteredAppointments.length} résultat(s))
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                {searchQuery ? `Aucun rendez-vous ne correspond à « ${searchQuery} ».` : 'Aucun rendez-vous enregistré.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400 bg-slate-50">
                      <th className="py-3 px-4">Ref &amp; Beneficiaire</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Date &amp; Heure</th>
                      <th className="py-3 px-4">Quartier</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {app.beneficiaryName}
                          <div className="text-[10px] text-slate-400 font-mono">{app.beneficiaryPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{app.serviceType}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{app.preferredDate} à {app.preferredTime}</td>
                        <td className="py-3.5 px-4 text-slate-600">{app.beneficiaryNeighborhood}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            app.status?.toLowerCase() === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            app.status?.toLowerCase() === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status?.toLowerCase() === 'confirmed' ? 'Confirmé' : app.status?.toLowerCase() === 'cancelled' ? 'Annulé' : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {app.status?.toLowerCase() !== 'confirmed' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(app.id, 'confirmed')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-500 cursor-pointer"
                            >
                              Valider
                            </button>
                          )}
                          {app.status?.toLowerCase() !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateAppointmentStatus(app.id, 'cancelled')}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-bold hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                            >
                              Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-0.5">Tous les Abonnements Actifs</h2>
                <p className="text-xs text-slate-500">Gestion des formules souscrites pour les foyers et entreprises à Dabou.</p>
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Filtre actif : « {searchQuery} » ({filteredSubscriptions.length} résultat(s))
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>

            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                {searchQuery ? `Aucun abonnement ne correspond à « ${searchQuery} ».` : 'Aucun abonnement actif enregistré.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSubscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          {sub.planName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.billingCycle === 'annuel' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {sub.billingCycle === 'annuel' ? 'Annuel' : 'Mensuel'}
                        </span>
                      </div>
                      <span className="font-extrabold text-sm text-emerald-800">
                        {sub.billingCycle === 'annuel' && sub.annualCost
                          ? `${sub.annualCost.toLocaleString()} FCFA/an`
                          : `${sub.monthlyCost.toLocaleString()} FCFA/mois`}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-900">{sub.householdOrCompanyName}</h3>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Souscripteur: {sub.subscriberName} ({sub.subscriberPhone})</p>
                      <p>Quartier: {sub.beneficiaryNeighborhood}</p>
                      <p>Jour retenu: Chaque {sub.scheduledDayOfWeek || 'Samedi'}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {sub.id}</span>
                      <button
                        onClick={() => handleUpdateSubStatus(sub.id, sub.status === 'active' ? 'cancelled' : 'active')}
                        className="text-xs font-bold text-amber-600 hover:underline"
                      >
                        {sub.status === 'active' ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPORT ENTRY */}
        {activeTab === 'report-entry' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Saisir un Rapport d'Examen Médical</h2>
            <p className="text-xs text-slate-500 mb-6">Formulaire de l'agent de santé pour transmettre le compte-rendu de visite au patient.</p>

            {repSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{repSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Bénéficiaire *</label>
                <input
                  type="text"
                  required
                  value={repBeneficiary}
                  onChange={(e) => setRepBeneficiary(e.target.value)}
                  placeholder="ex: Maman Bamba"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Associer à un Utilisateur (Compte Client)</label>
                  <select
                    value={repUserId}
                    onChange={(e) => setRepUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Sélectionner dans la liste...</option>
                    {registeredUsers.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date de la Visite</label>
                  <input
                    type="date"
                    value={repDate}
                    onChange={(e) => setRepDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Systolique (PAS)</label>
                  <input
                    type="text"
                    value={repTensionSys}
                    onChange={(e) => setRepTensionSys(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Diastolique (PAD)</label>
                  <input
                    type="text"
                    value={repTensionDia}
                    onChange={(e) => setRepTensionDia(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Glycémie (g/L)</label>
                  <input
                    type="text"
                    value={repGlycemie}
                    onChange={(e) => setRepGlycemie(e.target.value)}
                    placeholder="0.95"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observations Cliniques</label>
                <textarea
                  rows={2}
                  value={repNotes}
                  onChange={(e) => setRepNotes(e.target.value)}
                  placeholder="Etat général, prise régulière des traitements..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommandations pour le Patient</label>
                <textarea
                  rows={2}
                  value={repRecom}
                  onChange={(e) => setRepRecom(e.target.value)}
                  placeholder="Hydratation, hygiène de vie, rappel ordonnance..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRep}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow"
                >
                  {isSubmittingRep ? 'Enregistrement...' : 'Enregistrer & Transmettre'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: USERS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-0.5">Annuaire des Utilisateurs Enregistrés</h2>
                <p className="text-xs text-slate-500">Gestion des rôles (Client / Agent / Admin) et comptes inscrits.</p>
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Filtre actif : « {searchQuery} » ({filteredUsers.length} résultat(s))
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                {searchQuery ? `Aucun utilisateur ne correspond à « ${searchQuery} ».` : 'Aucun utilisateur répertorié.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400 bg-slate-50">
                      <th className="py-3 px-4">Utilisateur</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Rôle</th>
                      <th className="py-3 px-4 text-right">Modifier Rôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.displayName || 'Utilisateur'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-900' :
                            u.role === 'agent' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role || 'client'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={u.role || 'client'}
                            onChange={(e) => handleUpdateUserRole(u.uid, e.target.value as any)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            <option value="client">Client</option>
                            <option value="agent">Agent Terrain</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: PATIENT DOSSIER COMPLET */}
      {selectedPatientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-600 font-black text-base flex items-center justify-center text-white shrink-0">
                  {selectedPatientModal.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg tracking-tight text-white">{selectedPatientModal.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${selectedPatientModal.statusBadge.color}`}>
                      {selectedPatientModal.statusBadge.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      ID Patient : {selectedPatientModal.id}
                    </span>
                    <button
                      onClick={() => handleCopyId(selectedPatientModal.id)}
                      title="Copier l'identifiant"
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === selectedPatientModal.id ? (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Copié
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact & Location Strip */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-800">{selectedPatientModal.neighborhood}</span>
                </span>
                {selectedPatientModal.email && (
                  <span className="text-slate-500 hidden sm:inline">
                    {selectedPatientModal.email}
                  </span>
                )}
              </div>

              {selectedPatientModal.phone && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">{selectedPatientModal.phone}</span>
                  <a
                    href={`tel:${selectedPatientModal.phone}`}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Appeler</span>
                  </a>
                  <a
                    href={`https://wa.me/${selectedPatientModal.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Section 1: Constantes & Bilans Médicaux */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>Constantes Vitales &amp; Derniers Bilans Cliniques</span>
                </h4>

                {selectedPatientModal.reports.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    <p>Aucun rapport d'examen médical saisi pour ce patient.</p>
                    <button
                      onClick={() => handleStartReportForPatient(selectedPatientModal)}
                      className="mt-2 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      + Saisir le premier compte-rendu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPatientModal.reports.map((rep, idx) => (
                      <div key={rep.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">Visite du {rep.date || 'Récemment'}</span>
                          <span className="text-[11px] text-slate-400 font-mono">Ref: {rep.id || `REP-${idx + 1}`}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tension Artérielle</span>
                            <span className="text-sm font-extrabold text-slate-900">{rep.tension || 'Non mesurée'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Glycémie à Jeun</span>
                            <span className="text-sm font-extrabold text-slate-900">{rep.glycemie ? `${rep.glycemie} g/L` : 'Non mesurée'}</span>
                          </div>
                        </div>
                        {rep.notes && (
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-700">Notes :</span> {rep.notes}
                          </p>
                        )}
                        {rep.recommandations && (
                          <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                            <span className="font-bold text-amber-900">Recommandations :</span> {rep.recommandations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Historique Rendez-vous */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-amber-600" />
                  <span>Historique des Demandes de Visites</span>
                </h4>

                {selectedPatientModal.appointments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun rendez-vous planifié.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {selectedPatientModal.appointments.map((a) => (
                      <div key={a.id} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-900 block">{a.serviceType}</span>
                          <span className="text-[11px] text-slate-500">
                            {a.preferredDate} à {a.preferredTime} · Quartier: {a.beneficiaryNeighborhood}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status?.toLowerCase() === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          a.status?.toLowerCase() === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {a.status?.toLowerCase() === 'confirmed' ? 'Confirmé' : a.status?.toLowerCase() === 'cancelled' ? 'Annulé' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Formule Abonnement */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>Formules d'Abonnement Actives</span>
                </h4>

                {selectedPatientModal.subscriptions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun abonnement en cours.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatientModal.subscriptions.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-emerald-900 block">{s.planName}</span>
                          <span className="text-[11px] text-slate-600">
                            Cycle {s.billingCycle} · Passage chaque {s.scheduledDayOfWeek || 'Samedi'}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {s.status || 'Actif'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedPatientModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={() => handleStartReportForPatient(selectedPatientModal)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Rédiger un Rapport d'Examen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
