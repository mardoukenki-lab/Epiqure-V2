import { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, Users, Stethoscope, Activity, Calendar, FileText, 
  Plus, Check, Clock, AlertCircle, ArrowLeft, LogOut, Download, Search, CheckCircle2, X
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
  createdAt?: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'subscriptions' | 'visits' | 'report-entry' | 'users'>('overview');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<any[]>([]);

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

  const pendingAppointments = appointments.filter(a => a.status === 'Pending');
  const activeSubscriptions = subscriptions.filter(s => s.status === 'Active' || s.status === 'En attente');

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
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-slate-300">
          {[
            { id: 'overview', label: 'Vue Globale', icon: Activity },
            { id: 'appointments', label: 'Rendez-vous', icon: Calendar, badge: pendingAppointments.length },
            { id: 'subscriptions', label: 'Abonnements', icon: Stethoscope, badge: activeSubscriptions.length },
            { id: 'report-entry', label: 'Saisir Rapport', icon: FileText },
            { id: 'users', label: 'Utilisateurs', icon: Users, badge: registeredUsers.length },
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

        {/* TAB 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Tous les Rendez-vous Clients (Dabou)</h2>
            <p className="text-xs text-slate-500 mb-6">Validez, annulez ou modifiez le statut des demandes de visites.</p>

            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                Aucun rendez-vous enregistré.
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
                    {appointments.map((app) => (
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
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Tous les Abonnements Actifs</h2>
            <p className="text-xs text-slate-500 mb-6">Gestion des formules souscrites pour les foyers et entreprises à Dabou.</p>

            {subscriptions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                Aucun abonnement actif enregistré.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((sub) => (
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
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Annuaire des Utilisateurs Enregistrés</h2>
            <p className="text-xs text-slate-500 mb-6">Gestion des rôles (Client / Agent / Admin) et comptes inscrits.</p>

            {registeredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                Aucun utilisateur répertorié.
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
                    {registeredUsers.map((u) => (
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
    </div>
  );
}
