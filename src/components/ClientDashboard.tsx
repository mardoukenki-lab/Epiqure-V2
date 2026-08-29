import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Shield, User, HelpCircle, Phone, MapPin, 
  Calculator, Plus, CheckCircle2, Download, FileText, 
  ChevronRight, Calendar, ArrowLeft, LogOut, Sparkles, FolderHeart,
  UploadCloud, Eye, Trash2, Camera, Search, FileImage,
  Users, Stethoscope, Activity, Check, Clock, AlertCircle, RefreshCw, ShieldCheck,
  FileCheck, Printer, Pill, History
} from 'lucide-react';
import { Appointment, Subscription, MedicalRecord, IMAGES } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from 'firebase/firestore';

interface ClientDashboardProps {
  user: FirebaseUser | null;
  onBack: () => void;
  onSignOut: () => void;
  onOpenBooking: () => void;
}

export default function ClientDashboard({
  user,
  onBack,
  onSignOut,
  onOpenBooking
}: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'subscriptions' | 'medical-records' | 'reports' | 'history' | 'simulator' | 'support'>('overview');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [reports, setReports] = useState<Array<{
    id: string;
    beneficiaryName: string;
    date: string;
    tension: string;
    glycemie: number;
    notes: string;
    recommandations: string;
    sentVia: string;
    createdAt?: string;
  }>>([]);

  // Medical History states
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState<'all' | 'consultations' | 'prescriptions'>('all');
  const [activePrescriptionModal, setActivePrescriptionModal] = useState<{
    id: string;
    prescriptionNumber: string;
    date: string;
    beneficiaryName: string;
    practitionerName: string;
    practitionerRole: string;
    medications: Array<{
      name: string;
      dosage: string;
      instructions: string;
      duration: string;
    }>;
    notes?: string;
    verificationCode: string;
  } | null>(null);

  // Medical Record Creation Form
  const [recPatientName, setRecPatientName] = useState(user?.displayName || '');
  const [recCategory, setRecCategory] = useState<MedicalRecord['category']>('Ordonnance');
  const [recTitle, setRecTitle] = useState('');
  const [recRecordDate, setRecRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recNotes, setRecNotes] = useState('');
  const [recFileDataUrl, setRecFileDataUrl] = useState<string | null>(null);
  const [recFileName, setRecFileName] = useState('');
  const [recSuccessMsg, setRecSuccessMsg] = useState<string | null>(null);
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);

  // Modal Lightbox for medical documents
  const [activeImageModal, setActiveImageModal] = useState<MedicalRecord | null>(null);

  // Download Medical History Summary export helper
  const handleDownloadFullSummary = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const userName = user?.displayName || 'Adhérent EPICURE';

    let content = `====================================================\n`;
    content += `       EPICURE DABOU - BILAN MEDICAL COMPLET        \n`;
    content += `    Service d'Itinéraire de Santé et de Proximité   \n`;
    content += `====================================================\n\n`;
    content += `Date d'exportation : ${dateStr}\n`;
    content += `Patient / Adhérent  : ${userName}\n`;
    content += `Basse-Côte / Dabou, Côte d'Ivoire\n`;
    content += `----------------------------------------------------\n\n`;

    content += `1. HISTORIQUE DES CONSULTATIONS & CONSTANTES MEDICALES (${reports.length})\n`;
    content += `----------------------------------------------------\n`;
    if (reports.length === 0) {
      content += `Aucune consultation enregistrée à ce jour.\n\n`;
    } else {
      reports.forEach((rep, idx) => {
        content += `[Consultation #${idx + 1}] - Date : ${rep.date}\n`;
        content += `  Réf. Rapport : ${rep.id}\n`;
        content += `  Bénéficiaire : ${rep.beneficiaryName}\n`;
        content += `  Tension      : ${rep.tension || '--/--'}\n`;
        content += `  Glycémie     : ${rep.glycemie ? rep.glycemie + ' g/L' : '--'}\n`;
        content += `  Observations : ${rep.notes || 'Visite préventive effectuée à domicile.'}\n`;
        content += `  Conseils     : ${rep.recommandations || 'Suivi hygiéno-diététique recommandé.'}\n\n`;
      });
    }

    content += `2. ORDONNANCES ET DOCUMENTS MEDICAUX (${medicalRecords.length})\n`;
    content += `----------------------------------------------------\n`;
    if (medicalRecords.length === 0) {
      content += `Aucun document médical scanné enregistre.\n\n`;
    } else {
      medicalRecords.forEach((rec, idx) => {
        content += `[Document #${idx + 1}] - Date : ${rec.recordDate}\n`;
        content += `  Intitulé     : ${rec.title}\n`;
        content += `  Catégorie    : ${rec.category}\n`;
        content += `  Patient      : ${rec.patientName}\n`;
        content += `  Notes        : ${rec.notes || 'Aucune note'}\n\n`;
      });
    }

    content += `====================================================\n`;
    content += `Document généré automatiquement via le portail sécurisé EPICURE.\n`;
    content += `Contact Support & Suivi Dabou : +225 01 01 68 25 35 | direction@epiqure.online\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bilan_Medical_EPICURE_${userName.replace(/\s+/g, '_')}_${dateStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingleReport = (rep: any) => {
    const dateStr = rep.date || new Date().toISOString().split('T')[0];
    let content = `====================================================\n`;
    content += `    EPICURE DABOU - SYNTHESE DE CONSULTATION        \n`;
    content += `    Service d'Itinéraire de Santé et de Proximité   \n`;
    content += `====================================================\n\n`;
    content += `Réf. Consultation : ${rep.id}\n`;
    content += `Date de l'acte     : ${rep.date}\n`;
    content += `Bénéficiaire      : ${rep.beneficiaryName}\n`;
    content += `Soignant référent : Dr. Kouassi · Infirmier Référent EPICURE Dabou\n`;
    content += `----------------------------------------------------\n\n`;
    content += `RELEVE DE CONSTANTES :\n`;
    content += `  - Tension artérielle : ${rep.tension}\n`;
    content += `  - Glycémie capillaire: ${rep.glycemie} g/L\n\n`;
    content += `OBSERVATIONS MEDICALES :\n`;
    content += `  ${rep.notes || 'Examen de routine et auscultation réalisés à domicile.'}\n\n`;
    content += `RECOMMANDATIONS & PRECAUTIONS :\n`;
    content += `  ${rep.recommandations || 'Suivi régulier des règles d hygiene de vie.'}\n\n`;
    content += `====================================================\n`;
    content += `Document certifié par l'équipe soignante EPICURE Dabou.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Synthese_Consultation_${rep.beneficiaryName.replace(/\s+/g, '_')}_${dateStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simulator state
  const [simParents, setSimParents] = useState(1);
  const [simVisitsPerMonth, setSimVisitsPerMonth] = useState(2);
  const [simIncludesWhatsappReports, setSimIncludesWhatsappReports] = useState(true);
  const [simNeighborhood, setSimNeighborhood] = useState('Quartier Résidentiel');

  // Load User's Appointments
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'appointments'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Appointment));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAppointments(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Appointments listener notice:", err);
    }
  }, [user]);

  // Load User's Subscriptions
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Subscription[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as Subscription));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSubscriptions(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Subscriptions listener notice:", err);
    }
  }, [user]);

  // Load User's Medical Records
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'medicalRecords'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: MedicalRecord[] = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as MedicalRecord));
        list.sort((a, b) => new Date(b.createdAt || b.recordDate).getTime() - new Date(a.createdAt || a.recordDate).getTime());
        setMedicalRecords(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Medical records listener notice:", err);
    }
  }, [user]);

  // Load User's Health Reports
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'reports'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setReports(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Reports listener notice:", err);
    }
  }, [user]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRecFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateRecord = async (e: FormEvent) => {
    e.preventDefault();
    if (!recTitle || !user) return;

    setIsSubmittingRec(true);
    const newDoc: Omit<MedicalRecord, 'id'> = {
      userId: user.uid,
      patientName: recPatientName || user.displayName || 'Bénéficiaire',
      category: recCategory,
      title: recTitle,
      recordDate: recRecordDate,
      notes: recNotes,
      fileDataUrl: recFileDataUrl || '',
      fileName: recFileName || 'document.png',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'medicalRecords'), newDoc);
      setRecSuccessMsg("Document médical ajouté avec succès à votre dossier !");
      setRecTitle('');
      setRecNotes('');
      setRecFileDataUrl(null);
      setRecFileName('');
      setTimeout(() => setRecSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Erreur lors de l'ajout du document:", err);
    } finally {
      setIsSubmittingRec(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Voulez-vous supprimer ce document de votre dossier médical ?")) return;
    try {
      await deleteDoc(doc(db, 'medicalRecords', id));
    } catch (err) {
      console.error("Erreur de suppression:", err);
    }
  };

  const calculateSimulatedPrice = () => {
    let base = simParents * simVisitsPerMonth * 2000;
    if (simIncludesWhatsappReports) base += simParents * 1000;
    return base;
  };

  const latestReport = reports[0];
  const activeSub = subscriptions.find(s => s.status === 'Active' || s.status === 'En attente') || subscriptions[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header Bar */}
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
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                E
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">Epiqure Client</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBooking}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Réserver une visite</span>
            </button>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                {user?.displayName || user?.email || 'Client'}
              </span>
            </div>
            <button
              onClick={onSignOut}
              title="Se déconnecter"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-3 backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Espace Patient Sécurisé · Dabou</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bonjour, {user?.displayName || 'Cher Patient'} 👋
              </h1>
              <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
                Suivez en direct votre parcours de santé préventif, vos visites à domicile et vos bilans rédigés par nos agents de santé à Dabou.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenBooking}
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-colors shadow"
              >
                + Nouvelle demande
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar border-b border-slate-200">
          {[
            { id: 'overview', label: "Vue d'ensemble", icon: Activity },
            { id: 'visits', label: 'Mes Visites', icon: Calendar, badge: appointments.length },
            { id: 'history', label: 'Historique Médical', icon: FileCheck, badge: reports.length + medicalRecords.filter(m => m.category === 'Ordonnance').length },
            { id: 'subscriptions', label: 'Mes Abonnements', icon: Shield, badge: subscriptions.length },
            { id: 'medical-records', label: 'Dossier Médical', icon: FolderHeart, badge: medicalRecords.length },
            { id: 'reports', label: 'Rapports Santé', icon: FileText, badge: reports.length },
            { id: 'simulator', label: 'Simulateur', icon: Calculator },
            { id: 'support', label: 'Assistance', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prochaine Visite</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {appointments.find(a => a.status === 'Confirmed' || a.status === 'Pending')?.preferredDate || 'Aucune'}
                  </p>
                  <span className="text-xs font-semibold text-emerald-600 mt-0.5 inline-block">
                    {appointments.length > 0 ? `${appointments.length} visite(s) au total` : 'Programmez un passage'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Abonnement</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {activeSub ? activeSub.planName : 'Aucun'}
                  </p>
                  <span className="text-xs font-semibold text-emerald-600 mt-0.5 inline-block">
                    {activeSub ? `${activeSub.monthlyCost.toLocaleString()} FCFA / mois` : 'Souscrivez une formule'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dernière Tension</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {latestReport ? latestReport.tension : '-- / --'}
                  </p>
                  <span className="text-xs font-semibold text-emerald-600 mt-0.5 inline-block">
                    {latestReport ? 'Tension contrôlée' : 'Aucun relevé disponible'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dossier Médical</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {medicalRecords.length} doc(s)
                  </p>
                  <span className="text-xs font-semibold text-emerald-600 mt-0.5 inline-block">
                    Ordonnances &amp; Bilan
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderHeart className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Visits Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <span>Visites Récentes</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('visits')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Tout voir</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Vous n'avez aucune visite programmée.</p>
                    <button
                      onClick={onOpenBooking}
                      className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors"
                    >
                      Demander un passage
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{app.serviceType}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {app.preferredDate} à {app.preferredTime} · {app.beneficiaryNeighborhood}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status === 'Confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Health Report */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>Dernier Bilan Médical</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Historique</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!latestReport ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Aucun rapport médical enregistré pour l'instant.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Un rapport sera généré après chaque visite de nos agents.</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950">{latestReport.beneficiaryName}</span>
                      <span className="text-[11px] text-slate-500">{latestReport.date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-100/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Tension Artérielle</span>
                        <p className="text-base font-extrabold text-emerald-800">{latestReport.tension}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Glycémie Capillaire</span>
                        <p className="text-base font-extrabold text-teal-800">{latestReport.glycemie} g/L</p>
                      </div>
                    </div>
                    {latestReport.recommandations && (
                      <p className="text-xs text-slate-600 italic bg-white/80 p-2.5 rounded-lg border border-slate-100">
                        "{latestReport.recommandations}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISITS */}
        {activeTab === 'visits' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Vos Visites Médicales à Domicile</h2>
                <p className="text-xs text-slate-500 mt-0.5">Historique et planning de vos rendez-vous de santé à Dabou.</p>
              </div>
              <button
                onClick={onOpenBooking}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Demander un passage</span>
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Aucune visite programmée</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Réservez une visite unique ou un bilan de constantes à domicile pour vous ou un parent à Dabou.
                </p>
                <button
                  onClick={onOpenBooking}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow"
                >
                  Demander une visite maintenant
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50">
                      <th className="py-3 px-4">Ref &amp; Service</th>
                      <th className="py-3 px-4">Bénéficiaire</th>
                      <th className="py-3 px-4">Date &amp; Heure</th>
                      <th className="py-3 px-4">Quartier</th>
                      <th className="py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{app.serviceType}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{app.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {app.beneficiaryName}
                          <div className="text-[10px] text-slate-400">{app.beneficiaryPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {app.preferredDate} à {app.preferredTime}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {app.beneficiaryNeighborhood}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status === 'Confirmed' ? 'Confirmé' : 'En attente'}
                          </span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Vos Abonnements de Santé</h2>
                <p className="text-xs text-slate-500 mt-0.5">Formules de suivi préventif régulier à Dabou.</p>
              </div>
              <button
                onClick={onOpenBooking}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Souscrire un forfait</span>
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Aucun abonnement actif</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Assurez la tranquillité d'esprit de vos parents à Dabou grâce à nos forfaits Individuel, Maison ou Entreprise.
                </p>
                <button
                  onClick={onOpenBooking}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow"
                >
                  Découvrir les formules
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                          {sub.planName}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{sub.householdOrCompanyName}</h3>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {sub.monthlyCost.toLocaleString()} FCFA <span className="text-[10px] text-slate-400 font-normal">/ mois</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-200">
                      <p><strong>Bénéficiaire :</strong> {sub.beneficiaryPhone ? `${sub.subscriberName} (${sub.beneficiaryPhone})` : sub.subscriberName}</p>
                      <p><strong>Quartier à Dabou :</strong> {sub.beneficiaryNeighborhood}</p>
                      <p><strong>Jour de passage :</strong> Chaque {sub.scheduledDayOfWeek || 'Samedi'}</p>
                      <p><strong>Date de souscription :</strong> {sub.startDate || new Date().toISOString().split('T')[0]}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Abonnement Actif</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {sub.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEDICAL RECORDS */}
        {activeTab === 'medical-records' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Dossier Médical Numérique</h2>
              <p className="text-xs text-slate-500 mb-6">
                Stockez en toute sécurité vos ordonnances, bilans de laboratoire, et carnets de santé.
              </p>

              {/* Upload Document Form */}
              <form onSubmit={handleCreateRecord} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>Ajouter un nouveau document médical</span>
                </h3>

                {recSuccessMsg && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{recSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Patient</label>
                    <input
                      type="text"
                      value={recPatientName}
                      onChange={(e) => setRecPatientName(e.target.value)}
                      placeholder="ex: Maman Bamba"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                    <select
                      value={recCategory}
                      onChange={(e) => setRecCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Ordonnance">Ordonnance</option>
                      <option value="Bilan Sanguin">Bilan Sanguin</option>
                      <option value="Analyse Médicale">Analyse Médicale</option>
                      <option value="Imagerie">Imagerie / Radiographie</option>
                      <option value="Autre">Autre Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date du Document</label>
                    <input
                      type="date"
                      value={recRecordDate}
                      onChange={(e) => setRecRecordDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titre du Document *</label>
                  <input
                    type="text"
                    required
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    placeholder="ex: Ordonnance Traitement Hypertension"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fichier (Image ou Scan)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingRec}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-2"
                  >
                    {isSubmittingRec ? 'Enregistrement...' : 'Ajouter au dossier'}
                  </button>
                </div>
              </form>

              {/* Records List */}
              {medicalRecords.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FolderHeart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Votre dossier médical est actuellement vide.</p>
                  <p className="text-[11px] text-slate-400">Ajoutez une ordonnance ou un résultat de bilan ci-dessus.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicalRecords.map((rec) => (
                    <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            {rec.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{rec.recordDate}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2">{rec.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Patient: {rec.patientName}</p>
                        {rec.notes && <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 italic">{rec.notes}</p>}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setActiveImageModal(rec)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Voir le document</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Vos Rapports d'Examens Médicaux</h2>
            <p className="text-xs text-slate-500 mb-6">Compte-rendus rédigés par nos agents de santé après chaque visite à domicile à Dabou.</p>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Aucun rapport médical disponible</p>
                <p className="text-xs text-slate-500 mt-1">
                  Les comptes-rendus d'examens (tension, glycémie, conseils) apparaîtront ici après vos visites.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Rapport d'Examen Médical</span>
                        <h3 className="text-sm font-extrabold text-slate-900">{rep.beneficiaryName}</h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{rep.date}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tension Artérielle</span>
                        <p className="text-sm font-extrabold text-emerald-700">{rep.tension}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Glycémie Capillaire</span>
                        <p className="text-sm font-extrabold text-teal-700">{rep.glycemie} g/L</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Transmission</span>
                        <p className="text-xs font-semibold text-slate-700">{rep.sentVia || 'Email & WhatsApp'}</p>
                      </div>
                    </div>

                    {rep.recommandations && (
                      <div className="text-xs text-slate-700">
                        <strong>Recommandations :</strong> {rep.recommandations}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: HISTORIQUE MEDICAL & ORDONNANCES */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>Historique Médical &amp; Ordonnances Numériques</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Retrouvez l'historique complet de vos consultations EPICURE passées ainsi que toutes vos ordonnances certifiées.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadFullSummary}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2 shrink-0"
                  title="Exporter le bilan médical complet au format PDF / Fichier"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Summary</span>
                </button>

                {/* Search input */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher (bénéficiaire, soin, date...)"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Tous les actes', count: reports.length + medicalRecords.length },
                { id: 'consultations', label: 'Synthèses de Consultations', count: reports.length },
                { id: 'prescriptions', label: 'Ordonnances Numériques', count: medicalRecords.filter(m => m.category === 'Ordonnance').length || reports.length }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setHistoryCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    historyCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    historyCategory === cat.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Content List */}
            {reports.length === 0 && medicalRecords.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <History className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Aucun historique médical enregistré</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Vos comptes-rendus de consultations EPICURE et vos ordonnances électroniques apparaîtront automatiquement ici après chaque intervention de nos soignants à Dabou.
                </p>
                <button
                  onClick={onOpenBooking}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors"
                >
                  Programmer une consultation à domicile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Render Reports (Consultation Summaries) */}
                {(historyCategory === 'all' || historyCategory === 'consultations' || historyCategory === 'prescriptions') &&
                  reports
                    .filter(rep => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        rep.beneficiaryName?.toLowerCase().includes(q) ||
                        rep.notes?.toLowerCase().includes(q) ||
                        rep.recommandations?.toLowerCase().includes(q) ||
                        rep.date?.toLowerCase().includes(q)
                      );
                    })
                    .map(rep => (
                      <div key={'hist-rep-' + rep.id} className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                  Synthèse de Consultation EPICURE
                                </span>
                                <span className="text-xs text-slate-500 font-medium">Ref: {rep.id}</span>
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{rep.beneficiaryName}</h3>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-bold text-slate-700 block">{rep.date}</span>
                            <span className="text-[11px] text-slate-500">Dabou, Côte d'Ivoire</span>
                          </div>
                        </div>

                        {/* Vitals summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tension Artérielle</span>
                            <p className="text-xs font-extrabold text-emerald-700">{rep.tension}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Glycémie Capillaire</span>
                            <p className="text-xs font-extrabold text-teal-700">{rep.glycemie} g/L</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">État Général</span>
                            <p className="text-xs font-semibold text-slate-800">Constantes contrôlées</p>
                          </div>
                        </div>

                        {/* Notes & Recom */}
                        {rep.recommandations && (
                          <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                            <strong className="text-emerald-900">Recommandations médicales :</strong> {rep.recommandations}
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Transmis par {rep.sentVia || 'Email & WhatsApp'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadSingleReport(rep)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                              title="Télécharger la synthèse individuelle au format PDF / Fichier"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span>Download Summary</span>
                            </button>
                            <button
                              onClick={() => {
                                setActivePrescriptionModal({
                                  id: rep.id,
                                  prescriptionNumber: `ORD-${rep.id.replace('REP-', '')}-DABOU`,
                                  date: rep.date,
                                  beneficiaryName: rep.beneficiaryName,
                                  practitionerName: "Dr. Kouassi · Infirmier Référent EPICURE",
                                  practitionerRole: "Service d'Itinéraire de Santé et de Proximité (Dabou)",
                                  medications: [
                                    { name: "Suivi Tensionnel & Glycémique Capillaire", dosage: "Contrôle hebdomadaire", instructions: "Mesure le matin à jeun à domicile", duration: "1 mois" },
                                    { name: "Conseils Hygiéno-Diététiques Préventifs", dosage: "Hydratation & Modération sodée", instructions: "Suivre la fiche conseils remise en consultation", duration: "Continu" }
                                  ],
                                  notes: rep.recommandations || rep.notes || "Soin préventif et examen de constantes réalisés à domicile.",
                                  verificationCode: `EPC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                                });
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
                            >
                              <Pill className="w-3.5 h-3.5" />
                              <span>Voir l'Ordonnance Numérique</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                {/* 2. Render Medical Records / Prescriptions */}
                {(historyCategory === 'all' || historyCategory === 'prescriptions') &&
                  medicalRecords
                    .filter(rec => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return (
                        rec.patientName?.toLowerCase().includes(q) ||
                        rec.title?.toLowerCase().includes(q) ||
                        rec.notes?.toLowerCase().includes(q) ||
                        rec.recordDate?.toLowerCase().includes(q)
                      );
                    })
                    .map(rec => (
                      <div key={'hist-rec-' + rec.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 text-[10px] font-extrabold uppercase">
                                  {rec.category === 'Ordonnance' ? 'Ordonnance Numérique Certifiée' : 'Document Médical'}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">{rec.patientName}</span>
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{rec.title}</h3>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{rec.recordDate}</span>
                        </div>

                        {rec.notes && (
                          <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                            {rec.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          {rec.fileDataUrl ? (
                            <button
                              onClick={() => setActiveImageModal(rec)}
                              className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Voir le document numérisé</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Ordonnance enregistrée</span>
                          )}

                          <button
                            onClick={() => {
                              setActivePrescriptionModal({
                                id: rec.id,
                                prescriptionNumber: `ORD-${rec.id.substring(0, 6).toUpperCase()}-DABOU`,
                                date: rec.recordDate,
                                beneficiaryName: rec.patientName || 'Bénéficiaire',
                                practitionerName: "Service Médical EPICURE Dabou",
                                practitionerRole: "Pôle Santé & Suivi à Domicile",
                                medications: [
                                  { name: rec.title, dosage: "Selon ordonnance originale", instructions: rec.notes || "Consulter le document numérisé joint", duration: "Traitements en cours" }
                                ],
                                notes: rec.notes || "Document médical conservé dans l'espace sécurisé patient.",
                                verificationCode: `EPC-REC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer / Format Officiel</span>
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Simulateur d'Abonnement Sur-Mesure</h2>
            <p className="text-xs text-slate-500 mb-6">Estimez en temps réel le coût d'un suivi santé personnalisé pour vos proches à Dabou.</p>

            <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de bénéficiaires : <span className="text-emerald-600">{simParents} personne(s)</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={simParents}
                  onChange={(e) => setSimParents(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Visites par mois : <span className="text-emerald-600">{simVisitsPerMonth} visites/mois</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={simVisitsPerMonth}
                  onChange={(e) => setSimVisitsPerMonth(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="simWhatsapp"
                  checked={simIncludesWhatsappReports}
                  onChange={(e) => setSimIncludesWhatsappReports(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="simWhatsapp" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Inscrire les rapports WhatsApp prioritaires
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tarif estimé</span>
                  <div className="text-2xl font-extrabold text-emerald-700">
                    {calculateSimulatedPrice().toLocaleString()} FCFA <span className="text-xs font-normal text-slate-500">/ mois</span>
                  </div>
                </div>
                <button
                  onClick={onOpenBooking}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow"
                >
                  Souscrire à ce plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Assistance &amp; Orientation Santé</h2>
              <p className="text-xs text-slate-500 mt-0.5">Besoin d'aide ou de renseignements sur nos services à Dabou ?</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-emerald-950">Contactez l'équipe Epiqure Dabou</h3>
                <p className="text-xs text-emerald-800 mt-1">Disponibles du Lundi au Dimanche par téléphone et WhatsApp.</p>
              </div>
              <a
                href="https://wa.me/2250101682535"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow flex items-center gap-2 whitespace-nowrap"
              >
                <Phone className="w-4 h-4" />
                <span>+225 01 01 68 25 35</span>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-900 space-y-1">
              <strong className="font-extrabold text-rose-950 block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Avertissement urgence vitale :
              </strong>
              <p>
                Epiqure assure un suivi de santé préventif à domicile. En cas d'urgence vitale à Dabou, rendez-vous immédiatement à l'<strong>Hôpital Général de Dabou</strong> ou contactez les services d'urgence.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Document Image Preview */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
            <h3 className="text-sm font-extrabold text-slate-900">{activeImageModal.title}</h3>
            <p className="text-xs text-slate-500">Document du {activeImageModal.recordDate} · {activeImageModal.patientName}</p>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[250px]">
              <img
                src={activeImageModal.fileDataUrl}
                alt={activeImageModal.title}
                className="max-h-[60vh] object-contain"
              />
            </div>

            {activeImageModal.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong>Notes :</strong> {activeImageModal.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Official Digital Prescription Modal (Printable) */}
      {activePrescriptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto relative shadow-2xl border-t-8 border-emerald-600">
            <button
              onClick={() => setActivePrescriptionModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Fermer"
            >
              ✕
            </button>

            {/* Official Header */}
            <div className="border-b-2 border-slate-200 pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start text-emerald-800 font-extrabold text-lg tracking-tight">
                  <Shield className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  <span>EPIQURE DABOU · SANTE DE PROXIMITE</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Service d'Itinéraire de Santé et de Proximité · Côte d'Ivoire
                </p>
                <p className="text-[11px] text-slate-400">
                  Agréé pour le suivi préventif &amp; les soins de santé à domicile à Dabou
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Réf. Ordonnance</span>
                <span className="text-xs font-mono font-extrabold text-slate-900 block">{activePrescriptionModal.prescriptionNumber}</span>
                <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">Date : {activePrescriptionModal.date}</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-1 bg-emerald-50 rounded-lg border border-emerald-100">
              <h3 className="text-xs uppercase tracking-widest font-extrabold text-emerald-900">
                Ordonnance Numérique &amp; Recommandations Médicales
              </h3>
            </div>

            {/* Beneficiary & Practitioner Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Bénéficiaire / Patient(e)</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activePrescriptionModal.beneficiaryName}</p>
                <p className="text-slate-500 text-[11px]">Résidence : Dabou, Côte d'Ivoire</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Praticien / Soignant Référent</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activePrescriptionModal.practitionerName}</p>
                <p className="text-slate-500 text-[11px]">{activePrescriptionModal.practitionerRole}</p>
              </div>
            </div>

            {/* Medications Table */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                Prescriptions &amp; Posologie
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Désignation / Traitement</th>
                      <th className="p-3">Posologie</th>
                      <th className="p-3">Instructions</th>
                      <th className="p-3">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {activePrescriptionModal.medications.map((med, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-3 font-bold text-emerald-950">{med.name}</td>
                        <td className="p-3 text-slate-700">{med.dosage}</td>
                        <td className="p-3 text-slate-600">{med.instructions}</td>
                        <td className="p-3 font-semibold text-emerald-800">{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Practitioner Notes */}
            {activePrescriptionModal.notes && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                <span className="font-extrabold text-amber-950 block">Recommandations &amp; Précautions :</span>
                <p className="text-amber-900 leading-relaxed">{activePrescriptionModal.notes}</p>
              </div>
            )}

            {/* Stamp & Certification Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Signature Numérique Certifiée</span>
                  <span className="text-[10px] font-mono text-slate-500 block">Code Sécurité: {activePrescriptionModal.verificationCode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / Télécharger (PDF)</span>
                </button>
                <button
                  onClick={() => setActivePrescriptionModal(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
