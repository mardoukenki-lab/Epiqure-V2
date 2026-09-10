import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Activity, Plus, Trash2, Calendar, Clock, 
  TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, 
  Download, Filter, Sparkles, Scale, Droplet, User, Info, 
  ChevronDown, X, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { VitalSign } from '../types';

interface VitalSignsTrackerProps {
  user: FirebaseUser | null;
  beneficiaryNames?: string[];
  onExportPdf?: () => void;
}

export default function VitalSignsTracker({ user, beneficiaryNames = [], onExportPdf }: VitalSignsTrackerProps) {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter States
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'tension' | 'glycemie' | 'poids'>('all');

  // New Vital Sign Form States
  const [patientName, setPatientName] = useState(user?.displayName || 'Moi-même');
  const [customPatientName, setCustomPatientName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [bloodSugar, setBloodSugar] = useState<string>('0.95');
  const [bloodSugarContext, setBloodSugarContext] = useState<'fasting' | 'post_meal' | 'random'>('fasting');
  const [weight, setWeight] = useState<string>('72.0');
  const [height, setHeight] = useState<string>('170');
  const [heartRate, setHeartRate] = useState<string>('72');
  const [notes, setNotes] = useState<string>('');

  // 1. Real-time Subscription to Firestore Vitals
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'vitals'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: VitalSign[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as VitalSign);
        });
        // Sort chronologically ascending for charts, then we can reverse for table
        list.sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
          const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
          return timeA - timeB;
        });
        setVitals(list);
        setLoading(false);
      }, (err) => {
        console.warn("Vitals snapshot listener notice:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Vitals setup error:", err);
      setLoading(false);
    }
  }, [user]);

  // Unique list of patients for filter dropdown
  const allPatientNames = useMemo(() => {
    const set = new Set<string>();
    if (user?.displayName) set.add(user.displayName);
    beneficiaryNames.forEach(n => { if (n) set.add(n); });
    vitals.forEach(v => { if (v.patientName) set.add(v.patientName); });
    return Array.from(set);
  }, [user, beneficiaryNames, vitals]);

  // Filtered vitals according to selected beneficiary and time range
  const filteredVitals = useMemo(() => {
    let result = [...vitals];

    if (selectedBeneficiary !== 'all') {
      result = result.filter(v => v.patientName.toLowerCase() === selectedBeneficiary.toLowerCase());
    }

    if (timeRange !== 'all') {
      const now = new Date().getTime();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      result = result.filter(v => {
        const t = new Date(v.date).getTime();
        return t >= cutoff;
      });
    }

    return result;
  }, [vitals, selectedBeneficiary, timeRange]);

  // Table vitals (newest first)
  const reversedVitals = useMemo(() => {
    return [...filteredVitals].reverse();
  }, [filteredVitals]);

  // Chart-ready data formatted for Recharts
  const chartData = useMemo(() => {
    return filteredVitals.map(v => {
      // Format date for X-Axis (e.g. "24 Aoû" or "12/08")
      let displayDate = v.date;
      try {
        const parts = v.date.split('-');
        if (parts.length === 3) {
          displayDate = `${parts[2]}/${parts[1]}`;
        }
      } catch {
        // fallback
      }

      return {
        id: v.id,
        rawDate: v.date,
        displayDate: v.time ? `${displayDate} ${v.time}` : displayDate,
        date: displayDate,
        patientName: v.patientName,
        systolic: v.systolic || null,
        diastolic: v.diastolic || null,
        bloodSugar: v.bloodSugar || null,
        weight: v.weight || null,
        heartRate: v.heartRate || null,
        bloodSugarContext: v.bloodSugarContext || 'fasting',
        notes: v.notes || ''
      };
    });
  }, [filteredVitals]);

  // Key Statistics
  const stats = useMemo(() => {
    if (filteredVitals.length === 0) return null;

    const latest = filteredVitals[filteredVitals.length - 1];
    const previous = filteredVitals.length > 1 ? filteredVitals[filteredVitals.length - 2] : null;

    // Weight delta
    let weightDiff: number | null = null;
    if (latest.weight && previous?.weight) {
      weightDiff = Number((latest.weight - previous.weight).toFixed(1));
    }

    // Blood pressure status
    let bpStatus: { label: string; color: string; bg: string } = {
      label: 'Normale',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200'
    };
    if (latest.systolic && latest.diastolic) {
      if (latest.systolic >= 140 || latest.diastolic >= 90) {
        bpStatus = { label: 'Hypertension (Stade 1+)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
      } else if (latest.systolic >= 130 || latest.diastolic >= 85) {
        bpStatus = { label: 'Pré-hypertension', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
      } else if (latest.systolic < 90 || latest.diastolic < 60) {
        bpStatus = { label: 'Hypotension', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
      }
    }

    // Blood sugar status
    let sugarStatus: { label: string; color: string; bg: string } = {
      label: 'Normale',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200'
    };
    if (latest.bloodSugar) {
      if (latest.bloodSugar < 0.70) {
        sugarStatus = { label: 'Hypoglycémie', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
      } else if (latest.bloodSugar > 1.26 && latest.bloodSugarContext === 'fasting') {
        sugarStatus = { label: 'Élevée (À surveiller)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
      } else if (latest.bloodSugar > 1.10 && latest.bloodSugarContext === 'fasting') {
        sugarStatus = { label: 'Légèrement élevée', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
      }
    }

    // BMI / IMC
    let bmi: number | null = null;
    let bmiCategory = '';
    if (latest.weight && latest.height) {
      const heightInMeters = latest.height / 100;
      bmi = Number((latest.weight / (heightInMeters * heightInMeters)).toFixed(1));
      if (bmi < 18.5) bmiCategory = 'Insuffisance pondérale';
      else if (bmi < 25) bmiCategory = 'Poids normal';
      else if (bmi < 30) bmiCategory = 'Surpoids';
      else bmiCategory = 'Obésité';
    }

    return {
      latest,
      weightDiff,
      bpStatus,
      sugarStatus,
      bmi,
      bmiCategory
    };
  }, [filteredVitals]);

  // Handle Create New Vital Record
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFeedbackMsg({ type: 'error', text: 'Vous devez être connecté pour enregistrer vos constantes.' });
      return;
    }

    const resolvedPatient = patientName === '__custom__' ? (customPatientName.trim() || 'Proche') : patientName;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const sysNum = systolic ? parseInt(systolic, 10) : undefined;
      const diaNum = diastolic ? parseInt(diastolic, 10) : undefined;
      const weightNum = weight ? parseFloat(weight) : undefined;
      const sugarNum = bloodSugar ? parseFloat(bloodSugar) : undefined;
      const heightNum = height ? parseFloat(height) : undefined;
      const hrNum = heartRate ? parseInt(heartRate, 10) : undefined;

      const bpText = (sysNum && diaNum) ? `${Math.round(sysNum / 10)}/${Math.round(diaNum / 10)} (${sysNum}/${diaNum} mmHg)` : undefined;

      await addDoc(collection(db, 'vitals'), {
        userId: user.uid,
        patientName: resolvedPatient,
        date,
        time: time || '08:00',
        systolic: sysNum || null,
        diastolic: diaNum || null,
        bloodPressureText: bpText || null,
        bloodSugar: sugarNum || null,
        bloodSugarContext: bloodSugarContext || 'fasting',
        weight: weightNum || null,
        height: heightNum || null,
        heartRate: hrNum || null,
        notes: notes.trim(),
        source: 'patient',
        createdAt: new Date().toISOString()
      });

      setFeedbackMsg({ type: 'success', text: 'Constantes enregistrées avec succès dans votre carnet de santé !' });
      setIsModalOpen(false);
      setNotes('');
    } catch (err: any) {
      console.error("Error saving vital sign:", err);
      setFeedbackMsg({ type: 'error', text: 'Erreur lors de l\'enregistrement. Veuillez vérifier vos données.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete a Vital Record
  const handleDelete = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce relevé de constantes ?")) return;
    try {
      await deleteDoc(doc(db, 'vitals', id));
      setFeedbackMsg({ type: 'success', text: 'Relevé supprimé.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error("Error deleting vital sign:", err);
      setFeedbackMsg({ type: 'error', text: 'Impossible de supprimer ce relevé.' });
    }
  };

  // Seed sample initial values if the user wants to test
  const handleSeedDemoData = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const today = new Date();
      const patient = user.displayName || 'Moi-même';
      
      const demoEntries = [
        { daysAgo: 21, sys: 135, dia: 86, sugar: 1.08, weight: 74.5, time: '08:15', notes: 'Premier relevé à jeun' },
        { daysAgo: 14, sys: 130, dia: 84, sugar: 1.02, weight: 74.0, time: '08:30', notes: 'Régime pauvre en sel initié' },
        { daysAgo: 7, sys: 126, dia: 82, sugar: 0.98, weight: 73.2, time: '08:10', notes: 'Bonne forme, marche matinale' },
        { daysAgo: 2, sys: 122, dia: 80, sugar: 0.94, weight: 72.8, time: '08:00', notes: 'Constantes stables et régulières' },
        { daysAgo: 0, sys: 120, dia: 79, sugar: 0.92, weight: 72.5, time: '08:20', notes: 'Excellente tension ce matin' },
      ];

      for (const entry of demoEntries) {
        const d = new Date(today);
        d.setDate(d.getDate() - entry.daysAgo);
        const dateStr = d.toISOString().split('T')[0];

        await addDoc(collection(db, 'vitals'), {
          userId: user.uid,
          patientName: patient,
          date: dateStr,
          time: entry.time,
          systolic: entry.sys,
          diastolic: entry.dia,
          bloodPressureText: `${Math.round(entry.sys / 10)}/${Math.round(entry.dia / 10)} (${entry.sys}/${entry.dia} mmHg)`,
          bloodSugar: entry.sugar,
          bloodSugarContext: 'fasting',
          weight: entry.weight,
          height: 172,
          heartRate: 72,
          notes: entry.notes,
          source: 'patient',
          createdAt: new Date().toISOString()
        });
      }

      setFeedbackMsg({ type: 'success', text: '5 relevés historiques de démonstration ajoutés avec succès !' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error("Error generating demo vitals:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV helper
  const handleExportCSV = () => {
    if (vitals.length === 0) return;
    const header = "Date,Heure,Patient,Tension_Systolique_mmHg,Tension_Diastolique_mmHg,Glycemie_g_L,Contexte_Glycemie,Poids_kg,Taille_cm,Pouls_bpm,Notes\n";
    const rows = vitals.map(v => 
      `"${v.date}","${v.time || ''}","${v.patientName}","${v.systolic || ''}","${v.diastolic || ''}","${v.bloodSugar || ''}","${v.bloodSugarContext || ''}","${v.weight || ''}","${v.height || ''}","${v.heartRate || ''}","${(v.notes || '').replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Epiqure_Constantes_Vitales_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8" id="vital-signs-tracker-root">
      {/* Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Suivi &amp; Surveillance Médicale</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Constantes Vitales &amp; Graphiques d'Évolution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Saisissez et visualisez les constantes de santé de vos proches à Dabou : tension artérielle, glycémie capillaire et poids avec analyses graphiques interactives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {vitals.length === 0 && (
              <button
                onClick={handleSeedDemoData}
                disabled={isSubmitting}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Générer des exemples de mesures pour tester les graphiques"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Exemples de test</span>
              </button>
            )}

            {vitals.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                title="Exporter toutes les données au format CSV"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Exporter CSV</span>
              </button>
            )}

            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                title="Générer et télécharger le résumé PDF officiel du dossier médical"
              >
                <Download className="w-4 h-4" />
                <span>Résumé Médical (PDF)</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Saisir une constante</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}

        {/* Filters and Controls */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Patient */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedBeneficiary}
                onChange={(e) => setSelectedBeneficiary(e.target.value)}
                aria-label="Filtrer par proche / patient"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Tous les proches ({vitals.length} mesures)</option>
                {allPatientNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Period */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                aria-label="Période temporelle des graphiques"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">3 derniers mois</option>
                <option value="all">Tout l'historique</option>
              </select>
            </div>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            {[
              { id: 'all', label: 'Tous les graphes' },
              { id: 'tension', label: 'Tension (TA)' },
              { id: 'glycemie', label: 'Glycémie' },
              { id: 'poids', label: 'Poids / IMC' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveChartTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards (Latest measurements) */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tension Artérielle Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dernière Tension</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900">
                {stats.latest.systolic && stats.latest.diastolic 
                  ? `${Math.round(stats.latest.systolic / 10)}/${Math.round(stats.latest.diastolic / 10)}` 
                  : '--/--'}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({stats.latest.systolic || '--'}/{stats.latest.diastolic || '--'} mmHg)
                </span>
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stats.bpStatus.bg} ${stats.bpStatus.color}`}>
                  {stats.bpStatus.label}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{stats.latest.date}</span>
              </div>
            </div>
          </div>

          {/* Glycémie Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dernière Glycémie</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Droplet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900">
                {stats.latest.bloodSugar !== undefined && stats.latest.bloodSugar !== null ? `${stats.latest.bloodSugar}` : '--'}
                <span className="text-xs font-normal text-slate-400 ml-1">g/L</span>
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stats.sugarStatus.bg} ${stats.sugarStatus.color}`}>
                  {stats.sugarStatus.label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {stats.latest.bloodSugarContext === 'fasting' ? 'À jeun' : 'Après repas'}
                </span>
              </div>
            </div>
          </div>

          {/* Poids & Évolution Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Poids Actuel</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900">
                {stats.latest.weight !== undefined && stats.latest.weight !== null ? `${stats.latest.weight}` : '--'}
                <span className="text-xs font-normal text-slate-400 ml-1">kg</span>
              </p>
              <div className="mt-2 flex items-center justify-between">
                {stats.weightDiff !== null ? (
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    {stats.weightDiff > 0 ? (
                      <span className="text-amber-600 flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" /> +{stats.weightDiff} kg
                      </span>
                    ) : stats.weightDiff < 0 ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" /> {stats.weightDiff} kg
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <Minus className="w-3.5 h-3.5" /> Stable
                      </span>
                    )}
                    <span className="text-slate-400 font-normal">/ dernier</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">Premier relevé</span>
                )}
                <span className="text-[11px] text-slate-400 font-medium">{stats.latest.date}</span>
              </div>
            </div>
          </div>

          {/* IMC & Indice Santé */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Indice IMC &amp; Cœur</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900">
                {stats.bmi ? `${stats.bmi}` : stats.latest.heartRate ? `${stats.latest.heartRate} bpm` : '--'}
                {stats.bmi && <span className="text-xs font-normal text-slate-400 ml-1">kg/m²</span>}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {stats.bmiCategory || (stats.latest.heartRate ? 'Pouls au repos' : 'Taille non renseignée')}
                </span>
                {stats.latest.heartRate && (
                  <span className="text-[10px] font-bold text-rose-600">
                    {stats.latest.heartRate} bpm
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Visualizations */}
      {chartData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800">Aucune constante enregistrée pour l'instant</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Commencez par enregistrer la première tension, glycémie ou pesée pour afficher les graphiques de surveillance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow cursor-pointer"
            >
              + Saisir une première mesure
            </button>
            <button
              onClick={handleSeedDemoData}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Charger des données d'exemple
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Tension Artérielle */}
          {(activeChartTab === 'all' || activeChartTab === 'tension') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <h3 className="text-base font-extrabold text-slate-900">Évolution de la Tension Artérielle (mmHg)</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Systolique (maximale) et Diastolique (minimale). Seuil de référence normal OMS : &lt; 140/90 mmHg.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <span className="w-3 h-1 bg-rose-500 rounded-full" />
                    <span>Systolique</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-600">
                    <span className="w-3 h-1 bg-sky-500 rounded-full" />
                    <span>Diastolique</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      domain={[50, 180]} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      unit=" mmHg"
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
                              <p className="font-bold text-slate-200">{data.patientName} · {data.rawDate}</p>
                              <p className="text-rose-400 font-bold">
                                Systolique : {data.systolic} mmHg
                              </p>
                              <p className="text-sky-400 font-bold">
                                Diastolique : {data.diastolic} mmHg
                              </p>
                              <p className="text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                                Tension : {Math.round(data.systolic / 10)}/{Math.round(data.diastolic / 10)}
                              </p>
                              {data.notes && (
                                <p className="text-slate-400 italic text-[10px] mt-1">{data.notes}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={140} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Seuil max 140', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={90} stroke="#0284c7" strokeDasharray="4 4" label={{ value: 'Seuil max 90', fill: '#0284c7', fontSize: 10, position: 'insideBottomRight' }} />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      name="Systolique" 
                      stroke="#f43f5e" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#f43f5e' }}
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      name="Diastolique" 
                      stroke="#0284c7" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0284c7' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 2: Glycémie Capillaire */}
          {(activeChartTab === 'all' || activeChartTab === 'glycemie') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                    <h3 className="text-base font-extrabold text-slate-900">Suivi de la Glycémie Capillaire (g/L)</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Taux de sucre dans le sang. Cible normale à jeun : 0.70 à 1.10 g/L.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    Plage optimale : 0.70 - 1.10 g/L
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGlycemie" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      domain={[0.5, 2.0]} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      unit=" g/L"
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
                              <p className="font-bold text-slate-200">{data.patientName} · {data.rawDate}</p>
                              <p className="text-teal-400 font-extrabold text-sm">
                                Glycémie : {data.bloodSugar} g/L
                              </p>
                              <p className="text-slate-300 text-[11px]">
                                Contexte : {data.bloodSugarContext === 'fasting' ? 'À jeun' : 'Après repas'}
                              </p>
                              {data.notes && (
                                <p className="text-slate-400 italic text-[10px] mt-1">{data.notes}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={1.10} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Normale max 1.10', fill: '#ca8a04', fontSize: 10, position: 'insideTopRight' }} />
                    <ReferenceLine y={1.26} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Seuil diabète 1.26', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
                    <Area 
                      type="monotone" 
                      dataKey="bloodSugar" 
                      stroke="#0d9488" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorGlycemie)" 
                      dot={{ r: 4, fill: '#0d9488' }}
                      activeDot={{ r: 6 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Poids Corporel */}
          {(activeChartTab === 'all' || activeChartTab === 'poids') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <h3 className="text-base font-extrabold text-slate-900">Courbe de Poids (kg)</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Évolution pondérale pour prévenir la rétention hydrosodée ou suivre l'équilibre nutritionnel.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      unit=" kg"
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
                              <p className="font-bold text-slate-200">{data.patientName} · {data.rawDate}</p>
                              <p className="text-indigo-400 font-extrabold text-sm">
                                Poids : {data.weight} kg
                              </p>
                              {data.notes && (
                                <p className="text-slate-400 italic text-[10px] mt-1">{data.notes}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#6366f1' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Historique Détaillé des Relevés</h3>
            <p className="text-xs text-slate-500 mt-0.5">Registre horodaté de toutes les constantes vitales enregistrées.</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {reversedVitals.length} entrée(s)
          </span>
        </div>

        {reversedVitals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">
            Aucun historique correspondant aux filtres sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Bénéficiaire</th>
                  <th className="py-3 px-4">Tension (TA)</th>
                  <th className="py-3 px-4">Glycémie</th>
                  <th className="py-3 px-4">Poids / IMC</th>
                  <th className="py-3 px-4">Observations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reversedVitals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{item.date}</span>
                      {item.time && <span className="text-slate-400 text-[11px] block">{item.time}</span>}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {item.patientName}
                    </td>
                    <td className="py-3 px-4">
                      {item.systolic && item.diastolic ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">
                            {Math.round(item.systolic / 10)}/{Math.round(item.diastolic / 10)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({item.systolic}/{item.diastolic})
                          </span>
                          {item.systolic >= 140 || item.diastolic >= 90 ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Hypertension" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Normale" />
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.bloodSugar !== undefined && item.bloodSugar !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{item.bloodSugar} g/L</span>
                          <span className="text-[10px] text-slate-400">
                            ({item.bloodSugarContext === 'fasting' ? 'Jeun' : 'Repas'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.weight ? (
                        <span className="font-bold text-slate-900">{item.weight} kg</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500 text-[11px]">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer ce relevé"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Vital Measurement Entry */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                    <Activity className="w-4 h-4" />
                    <span>Nouveau Relevé Médical</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Saisie des Constantes Vitales</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Patient Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Bénéficiaire / Proche concerné *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value={user?.displayName || 'Moi-même'}>
                        Moi-même ({user?.displayName || 'Client'})
                      </option>
                      {beneficiaryNames.filter(n => n && n !== user?.displayName).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="__custom__">+ Ajouter un autre proche / parent</option>
                    </select>

                    {patientName === '__custom__' && (
                      <input
                        type="text"
                        required
                        placeholder="Nom complet du proche (ex: Papa Jean Koffi)"
                        value={customPatientName}
                        onChange={(e) => setCustomPatientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                      Date du relevé *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                      Heure de la mesure
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Tension Artérielle */}
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Tension Artérielle (mmHg)</span>
                    </span>
                    {systolic && diastolic && (
                      <span className="text-[11px] font-black text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                        {Math.round(parseInt(systolic) / 10)}/{Math.round(parseInt(diastolic) / 10)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Systolique (max)</label>
                      <input
                        type="number"
                        min="50"
                        max="250"
                        placeholder="Ex: 120"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Diastolique (min)</label>
                      <input
                        type="number"
                        min="30"
                        max="150"
                        placeholder="Ex: 80"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Glycémie Capillaire */}
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
                  <span className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-teal-600" />
                    <span>Glycémie Capillaire (g/L)</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Valeur en g/L</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.30"
                        max="5.00"
                        placeholder="Ex: 0.95"
                        value={bloodSugar}
                        onChange={(e) => setBloodSugar(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Contexte</label>
                      <select
                        value={bloodSugarContext}
                        onChange={(e) => setBloodSugarContext(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="fasting">À jeun (matin)</option>
                        <option value="post_meal">Après repas (post-prandial)</option>
                        <option value="random">Aléatoire / En journée</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Poids & Taille */}
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                  <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Poids, Taille &amp; Pouls</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Poids (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="250"
                        placeholder="Ex: 72.5"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Taille (cm)</label>
                      <input
                        type="number"
                        min="100"
                        max="220"
                        placeholder="Ex: 170"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Pouls (bpm)</label>
                      <input
                        type="number"
                        min="40"
                        max="200"
                        placeholder="Ex: 72"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes & Symptoms */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Observations ou symptômes (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Après prise du médicament, légère fatigue..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Enregistrer les constantes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
