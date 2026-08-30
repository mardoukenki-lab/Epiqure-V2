import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Check, Send, Phone, User, Home, ShieldAlert, 
  HeartHandshake, Mail, CheckCircle2, CreditCard, Banknote, ShieldCheck,
  Clock, Sparkles, Stethoscope 
} from 'lucide-react';
import { Appointment, Subscription } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { openPaystackModal } from '../lib/paystack';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'visit' | 'subscribe';
  initialPlan?: string;
  initialBillingCycle?: 'mensuel' | 'annuel' | 'visite_unique';
  onBookingSuccess: (appointment: Appointment) => void;
  onSubscriptionSuccess: (subscription: Subscription) => void;
  currentUser?: FirebaseUser | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  initialType = 'subscribe',
  initialPlan,
  initialBillingCycle = 'mensuel',
  onBookingSuccess,
  onSubscriptionSuccess,
  currentUser,
}: BookingModalProps) {
  // Main choice: 'mensuel' | 'annuel' | 'visite_unique'
  const [bookingMode, setBookingMode] = useState<'mensuel' | 'annuel' | 'visite_unique'>(
    initialBillingCycle || (initialType === 'visit' ? 'visite_unique' : 'mensuel')
  );

  const [plan, setPlan] = useState<string>(initialPlan || 'Forfait Maison');
  const [scheduledDay, setScheduledDay] = useState<'samedi' | 'dimanche'>('samedi');
  
  // Subscriber (who pays, could be diaspora)
  const [subscriberName, setSubscriberName] = useState(currentUser?.displayName || '');
  const [subscriberPhone, setSubscriberPhone] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState(currentUser?.email || '');
  const [isDiaspora, setIsDiaspora] = useState(false);

  // Payment method selection
  const [paymentChoice, setPaymentChoice] = useState<'paystack' | 'cash'>('paystack');

  // Beneficiary / Patient (who receives the visit in Dabou)
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('Quartier Résidentiel');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Single Visit details
  const [visitService, setVisitService] = useState('Dépistage complet & Bilan de constantes');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('09:00');

  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentEmailTarget, setSentEmailTarget] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<{
    reference: string;
    amount: number;
    method: string;
  } | null>(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialBillingCycle) {
        setBookingMode(initialBillingCycle);
      } else if (initialType === 'visit') {
        setBookingMode('visite_unique');
      } else {
        setBookingMode('mensuel');
      }

      if (initialPlan) {
        if (initialPlan.includes('Dépistage') || initialPlan.includes('Visite') || initialPlan.includes('Suivi')) {
          setBookingMode('visite_unique');
          setVisitService(initialPlan);
        } else {
          setPlan(initialPlan);
        }
      }
      if (currentUser) {
        if (!subscriberName && currentUser.displayName) {
          setSubscriberName(currentUser.displayName);
        }
        if (!subscriberEmail && currentUser.email) {
          setSubscriberEmail(currentUser.email);
        }
      }
    }
  }, [isOpen, initialType, initialPlan, initialBillingCycle, currentUser]);

  // Compute total price based on form choice
  const getPriceFCFA = () => {
    if (bookingMode === 'mensuel') {
      if (plan === 'Individuel') return 2000;
      if (plan.includes('Maison') || plan === 'Essentiel') return 5000;
      if (plan.includes('Entreprise') || plan === 'Sérénité Parents') return 15000;
      return 5000;
    } else if (bookingMode === 'annuel') {
      if (plan === 'Individuel') return 20000;
      if (plan.includes('Maison') || plan === 'Essentiel') return 50000;
      if (plan.includes('Entreprise') || plan === 'Sérénité Parents') return 150000;
      return 50000;
    } else {
      // Single visit
      if (visitService.includes('Gratuite') || visitService.includes('Offerte')) return 0;
      return 3000;
    }
  };

  const handleFinalizeBooking = async (
    paymentStatus: 'paid' | 'pending',
    paymentMethodName: string,
    reference?: string,
    amountPaid?: number
  ) => {
    setIsSending(true);
    const emailToConfirm = subscriberEmail.trim();
    setSentEmailTarget(emailToConfirm);

    if (reference && amountPaid) {
      setPaymentReceipt({
        reference,
        amount: amountPaid,
        method: paymentMethodName
      });
    } else {
      setPaymentReceipt(null);
    }

    let payload: any = {};

    if (bookingMode === 'mensuel' || bookingMode === 'annuel') {
      let selectedPlanName: 'Individuel' | 'Forfait Maison' | 'Forfait Entreprise' = 'Individuel';
      let monthlyPrice = 2000;
      let annualPrice = 20000;
      let planType: 'individuel' | 'maison' | 'entreprise' = 'individuel';

      if (plan === 'Individuel') {
        selectedPlanName = 'Individuel';
        monthlyPrice = 2000;
        annualPrice = 20000;
        planType = 'individuel';
      } else if (plan.includes('Maison') || plan === 'Essentiel') {
        selectedPlanName = 'Forfait Maison';
        monthlyPrice = 5000;
        annualPrice = 50000;
        planType = 'maison';
      } else if (plan.includes('Entreprise') || plan === 'Sérénité Parents') {
        selectedPlanName = 'Forfait Entreprise';
        monthlyPrice = 15000;
        annualPrice = 150000;
        planType = 'entreprise';
      }

      const effectiveCost = bookingMode === 'annuel' ? annualPrice : monthlyPrice;
      const weeklyCost = Math.round(monthlyPrice / 4);

      const newSub: Subscription = {
        id: 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        planName: selectedPlanName,
        planType: planType,
        billingCycle: bookingMode,
        subscriberName: subscriberName || beneficiaryName,
        subscriberEmail: emailToConfirm,
        subscriberPhone: subscriberPhone || beneficiaryPhone,
        beneficiaryName: beneficiaryName || subscriberName,
        beneficiaryPhone: beneficiaryPhone || subscriberPhone,
        beneficiaryNeighborhood: neighborhood,
        weeklyPrice: weeklyCost,
        monthlyCost: monthlyPrice,
        annualCost: annualPrice,
        scheduledDayOfWeek: scheduledDay,
        householdOrCompanyName: beneficiaryName || subscriberName,
        startDate: new Date().toISOString().split('T')[0],
        status: paymentStatus === 'paid' ? 'active' : 'pending',
        paymentMethod: paymentChoice === 'paystack' ? 'paystack' : 'cash_on_delivery',
        paymentStatus: paymentStatus,
        paymentReference: reference,
        paidAmount: amountPaid || (paymentStatus === 'paid' ? effectiveCost : undefined),
        paidAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      };
      
      onSubscriptionSuccess(newSub);

      payload = {
        formType: `Souscription Abonnement (${bookingMode === 'annuel' ? 'Annuel · 2 mois offerts' : 'Mensuel'})`,
        billingCycle: bookingMode === 'annuel' ? 'Annuel' : 'Mensuel',
        planName: selectedPlanName,
        scheduledDayOfWeek: scheduledDay,
        subscriberName: subscriberName || beneficiaryName,
        subscriberEmail: emailToConfirm,
        subscriberPhone: subscriberPhone || beneficiaryPhone,
        isDiaspora: isDiaspora ? "Oui" : "Non",
        beneficiaryName: beneficiaryName || subscriberName,
        beneficiaryPhone: beneficiaryPhone || subscriberPhone,
        beneficiaryNeighborhood: neighborhood,
        additionalInfo: additionalInfo,
        tarif: bookingMode === 'annuel' ? `${annualPrice.toLocaleString()} FCFA / an (2 mois offerts)` : `${monthlyPrice.toLocaleString()} FCFA / mois`,
        paymentMethod: paymentMethodName,
        paymentStatus: paymentStatus === 'paid' ? 'Payé' : 'En attente de passage',
        paymentReference: reference || 'Aucune (Espèces)',
        _subject: `Nouvel Abonnement ${bookingMode === 'annuel' ? 'ANNUEL' : 'MENSUEL'} - ${selectedPlanName} - Epiqure ${paymentStatus === 'paid' ? '💳 [PAYÉ PAYSTACK]' : ''}`
      };
    } else {
      // Single Visit
      const singlePrice = visitService.includes('Gratuite') || visitService.includes('Offerte') ? 0 : 3000;

      const newApp: Appointment = {
        id: 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        fullName: subscriberName || beneficiaryName,
        phone: subscriberPhone || beneficiaryPhone,
        whatsapp: subscriberPhone || beneficiaryPhone,
        email: emailToConfirm,
        relativeName: isDiaspora ? beneficiaryName : undefined,
        relativePhone: isDiaspora ? beneficiaryPhone : undefined,
        neighborhood: neighborhood,
        serviceType: visitService,
        bookingCategory: 'visite_unique',
        preferredDate: preferredDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        preferredTime: preferredTime,
        additionalInfo: additionalInfo,
        status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
        paymentMethod: paymentChoice === 'paystack' ? 'paystack' : 'cash_on_delivery',
        paymentStatus: paymentStatus,
        paymentReference: reference,
        paidAmount: amountPaid || (paymentStatus === 'paid' ? singlePrice : undefined),
        paidAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      };

      onBookingSuccess(newApp);

      payload = {
        formType: 'Visite unique ponctuelle',
        serviceType: visitService,
        clientName: subscriberName || beneficiaryName,
        clientPhone: subscriberPhone || beneficiaryPhone,
        clientEmail: emailToConfirm,
        isDiaspora: isDiaspora ? "Oui" : "Non",
        beneficiaryName: isDiaspora ? beneficiaryName : (subscriberName || beneficiaryName),
        beneficiaryPhone: isDiaspora ? beneficiaryPhone : (subscriberPhone || beneficiaryPhone),
        beneficiaryNeighborhood: neighborhood,
        preferredDate: preferredDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        preferredTime: preferredTime,
        additionalInfo: additionalInfo,
        tarif: singlePrice === 0 ? 'Offerte (0 FCFA)' : `${singlePrice.toLocaleString()} FCFA`,
        paymentMethod: paymentMethodName,
        paymentStatus: paymentStatus === 'paid' ? 'Payé' : 'En attente de passage',
        paymentReference: reference || 'Aucune (Espèces)',
        _subject: `Nouvelle Demande de Visite Unique - ${visitService} - Epiqure ${paymentStatus === 'paid' ? '💳 [PAYÉ PAYSTACK]' : ''}`
      };
    }

    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Error sending booking notification via Resend", err);
    } finally {
      setIsSending(false);
      setSubmitted(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const priceFCFA = getPriceFCFA();

    // If user chose Paystack and price > 0, open Paystack modal
    if (paymentChoice === 'paystack' && priceFCFA > 0) {
      const email = subscriberEmail.trim() || 'client@epicure.ci';
      const serviceName = bookingMode === 'annuel'
        ? `Abonnement Annuel ${plan} (12 mois)`
        : bookingMode === 'mensuel'
          ? `Abonnement Mensuel ${plan}`
          : `Visite Unique ${visitService}`;

      openPaystackModal({
        email: email,
        amountFCFA: priceFCFA,
        planOrServiceName: serviceName,
        customerName: subscriberName || beneficiaryName,
        customerPhone: subscriberPhone || beneficiaryPhone,
        metadata: {
          booking_mode: bookingMode,
          plan_name: plan,
          beneficiary_name: beneficiaryName || subscriberName,
          neighborhood: neighborhood,
          scheduled_day: scheduledDay,
          is_diaspora: isDiaspora ? "Oui" : "Non"
        },
        onSuccess: (resp) => {
          handleFinalizeBooking('paid', 'Paystack (Mobile Money / Carte)', resp.reference, resp.paidAmount);
        },
        onCancel: () => {
          console.log("Paiement Paystack annulé par l'utilisateur.");
        },
        onError: (err) => {
          alert(`Erreur Paystack : ${err.message || 'Impossible d\'effectuer le paiement en ligne. Vous pouvez choisir le paiement en espèces sur place.'}`);
        }
      });
    } else {
      // Cash payment or Free discovery visit
      const methodName = priceFCFA === 0 ? "Visite d'évaluation offerte" : "Espèces sur place (lors de la visite)";
      const status = priceFCFA === 0 ? 'paid' : 'pending';
      handleFinalizeBooking(status, methodName);
    }
  };

  const handleCloseSuccess = () => {
    setSubmitted(false);
    onClose();
    // Reset form fields
    if (!currentUser) {
      setSubscriberName('');
      setSubscriberEmail('');
      setSubscriberPhone('');
    }
    setBeneficiaryName('');
    setBeneficiaryPhone('');
    setAdditionalInfo('');
    setPreferredDate('');
    setPaymentReceipt(null);
  };

  const neighborhoods = [
    'Quartier Résidentiel',
    'Dabou Centre',
    'Layo',
    'N\'gatty',
    'Pass',
    'Bohu',
    'Debrimou',
    'Gbougbo',
    'Yassap',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            id="modal-backdrop"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
            id="booking-modal-box"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900">
                  {bookingMode === 'annuel' && "Souscrire à un Abonnement Annuel"}
                  {bookingMode === 'mensuel' && "Souscrire à un Abonnement Mensuel"}
                  {bookingMode === 'visite_unique' && "Demander une Visite Médicale Unique"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  EPICURE - Service d'Itinéraire de Santé et de Proximité à Dabou
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200/80 rounded-full transition-colors text-slate-500 cursor-pointer"
                id="close-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="overflow-y-auto p-6 flex-1">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="font-display font-black text-2xl text-slate-900 mb-2">
                    {paymentReceipt ? "Paiement & Demande Confirmés !" : "Demande enregistrée avec succès !"}
                  </h4>
                  <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed mb-4">
                    {bookingMode === 'annuel' && `Félicitations ! Votre souscription annuelle pour le ${plan} (12 mois de suivi avec 2 mois offerts) a bien été enregistrée.`}
                    {bookingMode === 'mensuel' && `Félicitations ! Votre souscription mensuelle pour le ${plan} a bien été transmise à notre équipe médicale de Dabou.`}
                    {bookingMode === 'visite_unique' && `Votre demande de visite médicale unique à domicile (${visitService}) a été enregistrée avec succès.`}
                  </p>

                  {/* Paystack Payment Receipt Card if paid */}
                  {paymentReceipt && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl max-w-md w-full text-left mb-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2 mb-2">
                        <span className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Reçu de Paiement Paystack
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">
                          RÉGLÉ
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500 text-[11px]">Montant réglé :</p>
                          <p className="font-bold text-slate-900 text-sm">{paymentReceipt.amount.toLocaleString()} FCFA</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[11px]">Moyen :</p>
                          <p className="font-medium text-slate-800">Mobile Money / Carte</p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-emerald-100">
                          <p className="text-slate-500 text-[11px]">Référence Paystack :</p>
                          <p className="font-mono text-[11px] font-bold text-emerald-800">{paymentReceipt.reference}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resend Email Confirmation Badge */}
                  {sentEmailTarget && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-xl max-w-md mx-auto text-xs flex items-start gap-2.5 text-left mb-5">
                      <Mail className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Email de confirmation automatique envoyé :</p>
                        <p className="text-slate-600 mt-0.5">
                          Une confirmation détaillée a été expédiée à <span className="font-mono font-bold text-accent-blue">{sentEmailTarget}</span>.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          (Pensez à vérifier vos courriers indésirables si vous ne le recevez pas dans les 2 minutes).
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-150 px-4 py-2.5 rounded-xl inline-flex items-center gap-2 mb-6 max-w-md">
                    <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Un soignant Epiqure va vous contacter sur WhatsApp pour valider l'horaire précis de passage à Dabou.</span>
                  </div>

                  <button
                    onClick={handleCloseSuccess}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Compris, fermer la fenêtre
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 3-Option Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Type de formule souhaitée
                    </label>
                    <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setBookingMode('mensuel')}
                        className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                          bookingMode === 'mensuel'
                            ? 'bg-white text-primary-brand shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        id="modal-mode-mensuel"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Abonnement Mensuel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingMode('annuel')}
                        className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer relative ${
                          bookingMode === 'annuel'
                            ? 'bg-primary-brand text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        id="modal-mode-annuel"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Annuel (2 mois off.)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingMode('visite_unique')}
                        className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                          bookingMode === 'visite_unique'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        id="modal-mode-visite"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Visite Unique</span>
                      </button>
                    </div>
                  </div>

                  {/* Plan selector (if monthly or annual subscription) */}
                  {(bookingMode === 'mensuel' || bookingMode === 'annuel') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Sélectionner le forfait ({bookingMode === 'annuel' ? 'Tarif Annuel · 2 mois offerts' : 'Tarif Mensuel'})
                        </label>
                        {bookingMode === 'annuel' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            12 mois au prix de 10
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Individuel */}
                        <div
                          onClick={() => setPlan('Individuel')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            plan === 'Individuel'
                              ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-950">Individuel</span>
                            {plan === 'Individuel' && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <span className="text-base font-extrabold text-emerald-700">
                            {bookingMode === 'annuel' ? '20 000 FCFA' : '2 000 FCFA'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {bookingMode === 'annuel' ? ' / an' : ' / mois'}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            1 personne · 1 visite/semaine (Tension &amp; glycémie).
                          </p>
                        </div>

                        {/* Forfait Maison */}
                        <div
                          onClick={() => setPlan('Forfait Maison')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            plan.includes('Maison') || plan === 'Essentiel'
                              ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-950">Forfait Maison</span>
                            {(plan.includes('Maison') || plan === 'Essentiel') && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <span className="text-base font-extrabold text-emerald-700">
                            {bookingMode === 'annuel' ? '50 000 FCFA' : '5 000 FCFA'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {bookingMode === 'annuel' ? ' / an' : ' / mois'}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            Tout le foyer · 1 visite/semaine pour chaque membre.
                          </p>
                        </div>

                        {/* Forfait Entreprise */}
                        <div
                          onClick={() => setPlan('Forfait Entreprise')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                            plan.includes('Entreprise') || plan === 'Sérénité Parents'
                              ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-950">Entreprise</span>
                            {(plan.includes('Entreprise') || plan === 'Sérénité Parents') && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <span className="text-base font-extrabold text-emerald-700">
                            {bookingMode === 'annuel' ? '150 000 FCFA' : '15 000 FCFA'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {bookingMode === 'annuel' ? ' / an' : ' / mois'}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            Sur site · Dépistage collaborateurs et rapports RH.
                          </p>
                        </div>
                      </div>

                      {/* Scheduled Day Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Jour de passage hebdomadaire souhaité
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setScheduledDay('samedi')}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              scheduledDay === 'samedi'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>Samedi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduledDay('dimanche')}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              scheduledDay === 'dimanche'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>Dimanche</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Single Visit services selector */}
                  {bookingMode === 'visite_unique' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Prestation de la visite unique
                      </label>
                      <select
                        value={visitService}
                        onChange={(e) => setVisitService(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                      >
                        <option value="Dépistage complet & Bilan de constantes">Dépistage complet & Bilan de constantes (Tension, Glycémie) - 3 000 FCFA</option>
                        <option value="Suivi post-consultation / Rappel traitement">Suivi post-consultation & Éducation thérapeutique - 3 000 FCFA</option>
                        <option value="Orientation médicale & Conseils de vie">Orientation médicale & Conseils personnalisés - 3 000 FCFA</option>
                        <option value="Première visite découverte (Gratuite)">Première visite d'évaluation à domicile (Offerte - 0 FCFA)</option>
                      </select>
                    </div>
                  )}

                  {/* Diaspora toggle */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="w-5 h-5 text-accent-blue shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Vous souscrivez depuis l'étranger (Diaspora) ?</p>
                          <p className="text-xs text-slate-500">Pour régler la visite ou l'abonnement de vos parents restés à Dabou</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDiaspora}
                          onChange={(e) => setIsDiaspora(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                      </label>
                    </div>
                  </div>

                  {/* Form section: Subscriber Info */}
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold text-sm text-slate-900 border-l-4 border-accent-blue pl-2">
                      {isDiaspora ? "Vos coordonnées (Souscripteur / Parrain)" : "Vos coordonnées de contact"}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Nom & Prénom
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="Ex: Koffi Kouassi"
                            value={subscriberName}
                            onChange={(e) => setSubscriberName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Numéro WhatsApp / Téléphone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            required
                            placeholder="Ex: +225 07 00 00 00 00 ou +33 6..."
                            value={subscriberPhone}
                            onChange={(e) => setSubscriberPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Adresse Email (pour recevoir le récapitulatif)
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="Ex: mon-email@exemple.com"
                          value={subscriberEmail}
                          onChange={(e) => setSubscriberEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form section: Beneficiary Info (In Dabou) */}
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold text-sm text-slate-900 border-l-4 border-secondary-brand pl-2">
                      {isDiaspora ? "Bénéficiaire à Dabou (Le Parent ausculté)" : "Lieu de la visite et bénéficiaire"}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isDiaspora && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Nom complet du parent
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: M. Jean Koffi"
                              value={beneficiaryName}
                              onChange={(e) => setBeneficiaryName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Numéro de téléphone local à Dabou
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="Ex: +225 05 00 00 00 00"
                              value={beneficiaryPhone}
                              onChange={(e) => setBeneficiaryPhone(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Quartier à Dabou
                        </label>
                        <div className="relative">
                          <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                          >
                            {neighborhoods.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Date details for single visit */}
                      {bookingMode === 'visite_unique' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Date souhaitée pour la visite
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="date"
                              required
                              value={preferredDate}
                              onChange={(e) => setPreferredDate(e.target.value)}
                              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Informations complémentaires (antécédents, repères d'accès...)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Mon parent a besoin d'un suivi très régulier de tension. Maison située près du Grand Marché..."
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-blue focus:outline-none text-slate-800 text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 border-l-4 border-emerald-600 pl-2 flex items-center justify-between">
                      <span>Mode de règlement</span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Total : {getPriceFCFA().toLocaleString()} FCFA
                        {bookingMode === 'annuel' && ' (Annuel)'}
                        {bookingMode === 'mensuel' && ' (Mensuel)'}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Paystack Online Payment */}
                      <div
                        onClick={() => setPaymentChoice('paystack')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                          paymentChoice === 'paystack'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-slate-900">Payer en ligne (Paystack)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Mobile Money (<strong>Wave, Orange Money, MTN MoMo</strong>) &amp; <strong>Cartes Visa / Mastercard</strong>.
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-800 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sécurisé · Validation instantanée</span>
                        </div>
                      </div>

                      {/* Cash Payment */}
                      <div
                        onClick={() => setPaymentChoice('cash')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentChoice === 'cash'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Banknote className="w-4 h-4 text-slate-700" />
                          <span className="text-xs font-bold text-slate-900">Paiement sur place à Dabou</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Règlement direct en espèces remis au soignant lors de son passage à domicile.
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400 font-medium">
                          <span>Reçu remis sur place</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors text-sm text-center cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSending}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                      id="submit-booking-btn"
                    >
                      {isSending ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : paymentChoice === 'paystack' && getPriceFCFA() > 0 ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Payer {getPriceFCFA().toLocaleString()} FCFA (Paystack)</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Confirmer ma demande</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
