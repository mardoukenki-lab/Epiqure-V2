/**
 * Types & Constants for EPICURE website
 */

export interface Appointment {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  relativeName?: string;
  relativePhone?: string;
  neighborhood: string;
  serviceType: string;
  bookingCategory?: 'visite_unique' | 'bilan_ponctuel' | 'abonnement';
  preferredDate: string;
  preferredTime: string;
  additionalInfo?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethod?: 'paystack' | 'cash_on_delivery' | 'wave' | 'orange_money' | 'mtn_momo' | 'card';
  paymentStatus?: 'paid' | 'pending' | 'failed';
  paymentReference?: string;
  paidAmount?: number;
  paidAt?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId?: string;
  planName: 'Individuel' | 'Forfait Maison' | 'Forfait Entreprise' | 'Essentiel' | 'Sérénité Parents' | 'Custom';
  planType?: 'individuel' | 'maison' | 'entreprise' | 'custom';
  billingCycle?: 'mensuel' | 'annuel';
  subscriberName: string;
  subscriberEmail: string;
  subscriberPhone: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryNeighborhood: string;
  weeklyPrice?: number;
  monthlyCost: number;
  annualCost?: number;
  scheduledDayOfWeek?: 'samedi' | 'dimanche';
  householdOrCompanyName?: string;
  startDate: string;
  status: 'active' | 'pending' | 'cancelled' | 'paused';
  paymentMethod?: 'paystack' | 'cash_on_delivery' | 'wave' | 'orange_money' | 'mtn_momo' | 'card';
  paymentStatus?: 'paid' | 'pending' | 'failed';
  paymentReference?: string;
  paidAmount?: number;
  paidAt?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: 'client' | 'agent' | 'admin';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  subscriptionId?: string;
  appointmentId?: string;
  clientUserId?: string;
  clientName: string;
  clientPhone: string;
  neighborhood: string;
  scheduledDate: string; // e.g. "2026-07-26"
  scheduledDayOfWeek: 'samedi' | 'dimanche';
  status: 'planifiée' | 'réalisée' | 'annulée';
  agentId?: string;
  agentName?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Examination {
  id: string;
  visitId: string;
  beneficiaryName: string;
  beneficiaryAge?: number;
  tensionArterielle: string; // e.g. "12/8"
  glycemie: number; // in g/L, e.g. 0.95
  notesAgent?: string;
  recommandations?: string;
  reportId?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  visitId: string;
  examinationId: string;
  beneficiaryName: string;
  tensionArterielle: string;
  glycemie: number;
  notesAgent?: string;
  recommandations?: string;
  pdfUrl?: string;
  sentVia: 'email' | 'whatsapp' | 'email & whatsapp' | 'sms';
  sentAt: string;
  deliveryStatus: 'envoyé' | 'échec' | 'en cours';
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  userId?: string;
  patientName: string;
  category: 'Ordonnance' | 'Analyse Médicale' | 'Bilan Sanguin' | 'Imagerie / Radio' | 'Autre Document';
  title: string;
  recordDate: string;
  notes?: string;
  fileDataUrl?: string;
  fileName?: string;
  createdAt: string;
}

export const IMAGES = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuAN5tb7IafJNE61mxDgqFel5wSWMXLqDeCNdTmXzHnZQ3PTssOjTmQt49zFn7lrIKxHqDXjRYmt-_1p3XXLvBrdSRe-c83vRXbVJvJ6D1bUz8QdIlYXDqtNrDysj4VBWh2lP4OtCtEgwzQljRVnAzedygfN-nvZFhKFkykWUjfOF6hDSHCPiUptQx94aZXDy67eRMWOuQn31Cg15UCIPgs1vcPFprAhd6lHjghMtFUZbigSLt2WREvI",
  bpMonitor: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeVIdZxQ-ffcFxy9E7sDZjmp7iV2rNB7R8InRKOv2TDM9RqjhTMS8NiRJ6WCUscnWD3MHuSoEkkEBVxVPqMe5fMkh1U_rtaguJNtxDHhM1QtWi-312sNlbWR0M7zmGrHAAFIpSmhnOTnDYuK3HIuuGy-aRohBawcITbq1ZHgWBmcQtUnzs44lkJzVnMfgu5d55byWymq5PWnNGbRp8Crtj0fn-sJmeI0s3-mO0PItjg-T1oxOrZf_S",
  tabletCharts: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9461Ay2RSuUm7KulDH4rd78dab4Ur91u7HT7Ri4u30_gfigwgpuaiysArMFIAikoLWaogaOaYeU3IDlVzQZl7rwpfhUMS4l_IAFbMVmpCRcd3DrLk-c_1EqQeZggSceo_1IQlgRuAIu4ka79Vm4oPkVFH3zKNCQPCkZQ-QeOMzEjdZp4RVBW85zwNgPs76KLAxdxNklkYSQwIXGpxKuSjdvr2z1kd8xYMWso_Tekt3bhenG4rRayW",
  team: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGR9X-0X8FiYWh7yqInQyeWAKIAtg0izgaFCKNfKG44NAWtP0gsCga_svyFI01BOBLjsiKdV86sAcyZRpdNLby19SB5U4cVSh0bxUwEGggYCk0wA3NIZ24b6qSr3ihFZWkv2463L4iiuLfz4sGIu-KmHAKw45Xoa-JgjmD6lluIpT0lFRMimLzbXjmc2m419sbhDti3fJqI0s3DcSQExrU4YIj1FbtNZ9NSXEi8AlmCU8KJd5orfOv",
  bloodSugar: "https://lh3.googleusercontent.com/aida-public/AB6AXuABrIKU1whek6lqlIkC824oW_Gl4e02hSWOw0-F1tp4-zYceL5u5i9qINj6VlqoNo0vTMUn3PEI1Ljz3CNXu21KU7cV2EcNpETa0AE_N0Uob_q-Ya05V8p1eOFU7_f0QO5FEJTAvA5l2OtCr5XtblUixa9j_4dvShklojYVgBBZjLYC4Z7LMvOEFnGrxmnyW3SxQ4yQeS_TtpXbf8priQ3Adgfu0Vtj_R4W0EoTQLE7346NJVHBq_Wi",
  nurseAndPatient: "https://lh3.googleusercontent.com/aida-public/AB6AXuByCFLXk4aUyvd20Y4OKWqLTNgwfZqsnZSF3Q4XfEurS2EqBoeWGZvmA5J074kB4xvgMCstCEVYXvP1FNqJ_Amr24A4DwcPxBvZnepPOBVMml6sQNk2pv1kMkB9xyHrNZI_nI3dCCKw-YcMvQK3PIDT_lAERIvROJLDOkl6HAFjKZaXTIMu9O3OBg9F1b2VTr4XA_DG0iJaaQ7UMLcDtHQBKODXOxSyvqhqKBxyOI0XE3FA6gxh5qM6",
  map: "https://lh3.googleusercontent.com/aida-public/AB6AXuDF11zdv-tTzd8TOEAEMWHVze1QxMh4qI1xNdKk4gClArrfvEKMYSdzd-ErddkjEML4YFolvUExvNNYAZoXew2MUhO8mT20sAqywWWnat-nv7gcfJDo5zxowLSVweHeRjcZD8p277G7MJ5nZQUloKnoS2lnvY6O7xSCXM3tVsobesw7sUfF6ae1ywKPKhCiTZz-ry1jD4NFsPRe-bURh9-hSI-Ofub0kKb9mHN5e--3MNn926plwnFL"
};
