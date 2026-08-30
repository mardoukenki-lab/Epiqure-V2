import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = 3000;

// Trust proxy for Cloud Run ingress reverse proxy and express-rate-limit
app.set("trust proxy", 1);

app.use(express.json());

// Rate limiters for security
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 chat requests per minute
  message: { error: "Trop de requêtes. Veuillez patienter une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const notifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 notification requests per minute
  message: { error: "Trop de soumissions. Veuillez patienter une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI Chat helper will not function.");
}

// Initialize Resend Client
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: !!ai });
});

// Server-side AI Assistant API Route
app.post("/api/gemini/chat", chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!ai) {
      return res.status(503).json({
        text: "Désolé, le service d'assistant IA n'est pas encore configuré. Veuillez vérifier votre clé API Gemini dans le panneau Secrets de l'AI Studio."
      });
    }

    const systemInstruction = `
      Tu es l'assistant virtuel d'Epiqure (Service d'Itinéraire de Santé et de Proximité à Dabou, Côte d'Ivoire).
      Ton objectif est d'informer, d'orienter et d'aider les utilisateurs d'une manière chaleureuse, respectueuse et professionnelle.
      Donne des réponses courtes, claires et bien présentées. Reste humble et n'invente rien.

      Informations clés sur Epiqure :
      - Epiqure propose un "Service d'Itinéraire de Santé et de Proximité".
      - Adresse : Dabou, Quartier Résidentiel, Côte d'Ivoire.
      - Contact : +225 01 01 68 25 35 (Téléphone et WhatsApp). Email : direction@epiqure.online
      - Activités : Visites de santé à domicile, suivi de constantes (Tension artérielle, Glycémie capillaire), éducation thérapeutique, orientation médicale personnalisée.
      - AVERTISSEMENT : Epiqure n'est PAS un hôpital, ni une clinique d'urgence. Nous ne pratiquons pas de chirurgie ou d'hospitalisation d'urgence. En cas d'urgence vitale à Dabou, orienter immédiatement vers l'Hôpital Général de Dabou ou appeler les secours d'urgence.
      - Formules d'abonnement :
        1. Formule Essentiel : 5,000 FCFA/mois. Comprend 1 visite à domicile par mois, contrôle tension & glycémie, conseils en prévention, orientation, suivi téléphonique bi-mensuel.
        2. Formule Sérénité Parents : 15,000 FCFA/mois (Recommandé pour la Diaspora). Comprend 2 visites par mois, rapports détaillés envoyés par WhatsApp/Email pour rassurer la famille à l'étranger, gestion prioritaire, assistance orientation 24/7.
      - Partenaires de santé locaux : Centre Médical Dabou, Laboratoire BioSanté, Clinique de l'Espoir, Pharmacie Centrale.

      Réponds en français avec beaucoup de bienveillance. Tu peux utiliser des puces pour structurer tes explications.
    `;

    // Map history to the required format
    // Note: If using simple content generation with chat, let's build the chat history
    const chatHistory = history ? history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.text }]
    })) : [];

    // Append user message
    chatHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatHistory,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de l'appel à l'assistant de santé." });
  }
});

// Helper function to send email via Resend
async function sendResendEmail({
  to,
  subject,
  html,
  replyTo
}: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] WARNING: RESEND_API_KEY is missing. Email dispatch skipped.");
    return { success: false, error: "Clé API Resend non configurée" };
  }

  try {
    const client = resend || new Resend(apiKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL || "Epiqure Santé <onboarding@resend.dev>";

    // Validate email targets
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rawTargets = Array.isArray(to) ? to : [to];
    const targets = rawTargets
      .map(e => (typeof e === 'string' ? e.trim() : ''))
      .filter(e => emailRegex.test(e));

    if (targets.length === 0) {
      console.warn("[Resend] No valid recipient email provided:", to);
      return { success: false, error: "Adresse email destinataire invalide" };
    }

    const validReplyTo = replyTo && emailRegex.test(replyTo.trim()) ? replyTo.trim() : undefined;

    const result = await client.emails.send({
      from: fromAddress,
      to: targets,
      subject,
      html,
      ...(validReplyTo ? { reply_to: validReplyTo } : {})
    });

    if (result.error) {
      console.warn("[Resend API Error/Notice]:", result.error);
      return { success: false, error: result.error };
    }

    console.log(`[Resend] Email successfully sent to ${targets.join(', ')} (ID: ${result.data?.id})`);
    return { success: true, data: result.data };
  } catch (error: any) {
    console.warn("[Resend Exception]:", error?.message || error);
    return { success: false, error: error?.message || "Erreur Resend" };
  }
}

// Server-side Paystack Transaction Verification Endpoint
app.post("/api/payments/verify", async (req, res) => {
  try {
    const { reference, expectedAmount, planOrServiceName, customerEmail } = req.body;
    
    if (!reference || typeof reference !== "string") {
      return res.status(400).json({
        verified: false,
        error: "Paramètre 'reference' manquant ou invalide."
      });
    }

    console.log(`[API /api/payments/verify] Verifying transaction reference: ${reference}`);

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      console.error("[Paystack] PAYSTACK_SECRET_KEY absente dans les variables d'environnement. Vérification côté serveur impossible.");
      return res.status(503).json({
        verified: false,
        error: "Le service de vérification des paiements est temporairement indisponible : la clé secrète PAYSTACK_SECRET_KEY n'est pas configurée sur le serveur."
      });
    }

    // Call Paystack API directly with secret key
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await paystackResponse.json();

    if (!paystackResponse.ok || !data.status || !data.data) {
      console.warn("[Paystack Verification Failed]:", data);
      return res.status(400).json({
        verified: false,
        error: data.message || "Transaction introuvable ou non reconnue par Paystack."
      });
    }

    const tx = data.data;

    if (tx.status !== "success") {
      console.warn(`[Paystack Incomplete Transaction]: status is '${tx.status}'`);
      return res.status(400).json({
        verified: false,
        status: tx.status,
        error: `Le statut de la transaction n'est pas validé (Statut: ${tx.status}).`
      });
    }

    // Verify amount in subunits (FCFA cents/centimes x100)
    if (expectedAmount && Number(expectedAmount) > 0) {
      const expectedSubunits = Math.round(Number(expectedAmount) * 100);
      const paidSubunits = Number(tx.amount);
      if (Math.abs(paidSubunits - expectedSubunits) > 100) {
        console.warn(`[Paystack Amount Mismatch]: Expected ${expectedSubunits}, Received ${paidSubunits}`);
        return res.status(400).json({
          verified: false,
          error: `Le montant validé (${paidSubunits / 100} FCFA) ne correspond pas au montant attendu (${expectedAmount} FCFA).`
        });
      }
    }

    console.log(`[Paystack Success]: Transaction ${reference} verified for ${tx.amount / 100} ${tx.currency}`);

    return res.json({
      verified: true,
      reference: tx.reference,
      paidAmountFCFA: tx.amount / 100,
      currency: tx.currency,
      channel: tx.channel,
      paidAt: tx.paid_at,
      gatewayResponse: tx.gateway_response,
      customer: {
        email: tx.customer?.email,
        customerCode: tx.customer?.customer_code
      }
    });
  } catch (error: any) {
    console.error("[Paystack Server Exception]:", error);
    return res.status(500).json({
      verified: false,
      error: error.message || "Erreur interne lors de la vérification du paiement."
    });
  }
});

// Full-stack Notification route via Resend & Formspree
app.post("/api/notify", notifyLimiter, async (req, res) => {
  try {
    const payload = req.body;
    const formType = payload.formType || "Formulaire de contact";
    const staffEmail = process.env.STAFF_EMAIL || "direction@epiqure.online";
    
    console.log(`[API /api/notify] Processing notification for: ${formType}`);

    // 1. Forward the data to Formspree for redundancy/backup
    let formspreeSuccess = false;
    try {
      const formspreeResponse = await fetch("https://formspree.io/f/xgobznna", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      formspreeSuccess = formspreeResponse.ok;
    } catch (err) {
      console.warn("[Formspree Notice]: Failed to forward to Formspree:", err);
    }

    // 2. Classify request type
    const isSubscription = 
      formType === "Abonnement Annuel" || 
      formType === "Souscription Forfait" || 
      formType === "subscribe" ||
      formType === "subscription" ||
      !!payload.planName;

    const isVisitBooking = 
      !isSubscription && (
        formType === "Visite unique / Bilan" || 
        formType === "visit" || 
        formType === "Rendez-vous" || 
        formType === "Prise de rendez-vous" || 
        formType === "booking" ||
        !!payload.serviceType
      );

    let emailToStaffResult = null;
    let emailToUserResult = null;

    if (isSubscription) {
      // -------------------------------------------------------------
      // CASE 1: PLAN SUBSCRIPTION (Souscription à un abonnement)
      // -------------------------------------------------------------
      const plan = payload.planName || "Forfait Maison";
      const subscriberName = payload.subscriberName || payload.clientName || payload.beneficiaryName || "Adhérent Epiqure";
      const subscriberPhone = payload.subscriberPhone || payload.phone || payload.beneficiaryPhone || "Non renseigné";
      const userEmail = payload.subscriberEmail || payload.email || payload.clientEmail || "";
      const beneficiary = payload.beneficiaryName || subscriberName;
      const beneficiaryPhone = payload.beneficiaryPhone || subscriberPhone;
      const neighborhood = payload.beneficiaryNeighborhood || payload.neighborhood || "Dabou";
      const scheduledDay = payload.scheduledDayOfWeek ? (payload.scheduledDayOfWeek.charAt(0).toUpperCase() + payload.scheduledDayOfWeek.slice(1)) : "Samedi";
      const weeklyCost = payload.weeklyCost || (plan === 'Individuel' ? '500 FCFA / semaine' : plan.includes('Maison') ? '1 250 FCFA / semaine' : '3 750 FCFA / semaine');
      const isDiaspora = payload.isDiaspora === "Oui" || payload.isDiaspora === true;
      const additionalInfo = payload.additionalInfo || payload.notes || "";
      const paymentMethod = payload.paymentMethod || "Paiement sur place";
      const paymentStatus = payload.paymentStatus || "En attente";
      const paymentReference = payload.paymentReference || "";
      const isPaidOnline = paymentStatus === "Payé" || paymentMethod.toLowerCase().includes("paystack");

      // Staff Alert Email
      const staffHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc; color: #1e293b;">
          <div style="background: #047857; padding: 18px 24px; border-radius: 12px; margin-bottom: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">🏥 NOUVELLE SOUSCRIPTION D'ABONNEMENT</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Epiqure Dabou · Service de Proximité</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #065f46; font-size: 16px; border-bottom: 2px solid #ecfdf5; padding-bottom: 8px;">Détails de la Formule</h3>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Formule :</strong> <span style="color: #059669; font-weight: bold; font-size: 15px;">${plan}</span> (${weeklyCost})</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Jour de passage prévu :</strong> ${scheduledDay}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Souscription Diaspora :</strong> ${isDiaspora ? "✅ Oui (Paiement depuis l'étranger)" : "Non (Local)"}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Règlement :</strong> <span style="font-weight: bold; color: ${isPaidOnline ? '#059669' : '#d97706'};">${isPaidOnline ? `✅ Payé en ligne via Paystack (Réf: ${paymentReference})` : `⏳ ${paymentMethod} (${paymentStatus})`}</span></p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #065f46; font-size: 16px; border-bottom: 2px solid #ecfdf5; padding-bottom: 8px;">Souscripteur &amp; Bénéficiaire</h3>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Souscripteur :</strong> ${subscriberName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Email du souscripteur :</strong> ${userEmail || 'Non communiqué'}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Téléphone du souscripteur :</strong> ${subscriberPhone}</p>
            <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 12px 0;" />
            <p style="margin: 6px 0; font-size: 14px;"><strong>Bénéficiaire à Dabou :</strong> ${beneficiary}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Téléphone à Dabou :</strong> ${beneficiaryPhone}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Quartier de résidence :</strong> ${neighborhood}, Dabou</p>
            ${additionalInfo ? `<p style="margin: 6px 0; font-size: 14px; background: #fffbeb; padding: 8px; border-radius: 6px; border-left: 3px solid #f59e0b;"><strong>Notes &amp; Pathologies :</strong> ${additionalInfo}</p>` : ''}
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://wa.me/${beneficiaryPhone.replace(/[^0-9]/g, '')}" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 10px 20px; border-radius: 8px; margin-right: 8px;">Contacter sur WhatsApp</a>
          </div>
        </div>
      `;

      emailToStaffResult = await sendResendEmail({
        to: [staffEmail, "kramartial@gmail.com"],
        subject: `[Epiqure Dabou] Nouvel Abonnement ${plan} - ${subscriberName} ${isPaidOnline ? '💳 [PAYÉ PAYSTACK]' : ''}`,
        html: staffHtml,
        replyTo: userEmail || undefined
      });

      // User Automatic Confirmation Email
      if (userEmail) {
        const userHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
            
            <!-- Top Brand Header -->
            <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px;">
                EPIQURE DABOU · SANTÉ DE PROXIMITÉ
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.2;">Bienvenue chez Epiqure</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.92;">Votre souscription à la formule <strong>${plan}</strong> est confirmée</p>
            </div>

            <!-- Body -->
            <div style="padding: 28px 24px;">
              <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #334155;">
                Bonjour <strong>${subscriberName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Nous vous remercions de votre confiance. Votre demande de souscription pour notre service de suivi et de visites de santé à domicile à Dabou a été enregistrée avec succès.
              </p>

              <!-- Plan Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 14px;">
                  <span style="font-size: 13px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Récapitulatif de l'abonnement</span>
                  <span style="background-color: ${isPaidOnline ? '#dcfce7' : '#d1fae5'}; color: #065f46; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
                    ${isPaidOnline ? 'PAYÉ EN LIGNE (PAYSTACK)' : 'ACTIF / VALIDÉ'}
                  </span>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 45%;">Formule souscrite :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${plan}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Tarif :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #047857;">${weeklyCost}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Moyen de paiement :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">
                      ${paymentMethod} ${paymentReference ? `<span style="color: #64748b; font-size: 11px;">(Réf: ${paymentReference})</span>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Jour de passage hebdomadaire :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Chaque ${scheduledDay}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Bénéficiaire à Dabou :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${beneficiary}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Quartier de résidence :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${neighborhood}, Dabou</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Téléphone de contact :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${beneficiaryPhone}</td>
                  </tr>
                </table>
              </div>

              <!-- Included Services -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #065f46; text-transform: uppercase;">Ce qui est inclus dans votre suivi :</h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #065f46; line-height: 1.6;">
                  <li>Visite(s) régulière(s) à domicile par notre infirmier(ère) diplômé(e) d'État.</li>
                  <li>Relevé de constantes vitales : Tension artérielle &amp; Glycémie capillaire à jeun.</li>
                  <li>Rapport de santé détaillé et ordonnances numériques transmis après chaque visite.</li>
                  <li>Orientation prioritaire vers les spécialistes et centres de santé partenaires à Dabou.</li>
                </ul>
              </div>

              <!-- Next Steps Box -->
              <h4 style="margin: 20px 0 10px 0; font-size: 14px; font-weight: 800; color: #0f172a;">Prochaines étapes :</h4>
              <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #475569;">
                <li><strong>Appel de coordination :</strong> Notre responsable soignant à Dabou va vous appeler pour valider les repères géographiques et vos disponibilités.</li>
                <li><strong>Première visite inaugurale :</strong> Votre soignant dédié effectuera le premier passage pour établir le carnet de suivi initial.</li>
                <li><strong>Comptes-rendus en temps réel :</strong> Les bilans sont directement consultables sur votre espace client et partagés aux proches.</li>
              </ol>

              <!-- Support Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin-top: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #1e293b;">Une question ou une modification d'horaire ?</p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  📞 <strong>+225 01 01 68 25 35</strong> (Appel direct &amp; WhatsApp) · ✉️ <strong>direction@epiqure.online</strong>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0 0 4px 0;"><strong>Epiqure Dabou</strong> — Service d'Itinéraire de Santé et de Proximité</p>
              <p style="margin: 0 0 4px 0;">Quartier Résidentiel, Dabou, Région des Grands Ponts, Côte d'Ivoire</p>
              <p style="margin: 0; color: #cbd5e1;">Avis médical : Epiqure assure un suivi préventif à domicile. En cas d'urgence vitale, contactez immédiatement l'Hôpital Général de Dabou.</p>
            </div>
          </div>
        `;

        emailToUserResult = await sendResendEmail({
          to: userEmail,
          subject: `[Epiqure Dabou] Confirmation de votre souscription - Formule ${plan}`,
          html: userHtml,
          replyTo: staffEmail
        });
      }

    } else if (isVisitBooking) {
      // -------------------------------------------------------------
      // CASE 2: APPOINTMENT / HOME VISIT BOOKING (Prise de rendez-vous)
      // -------------------------------------------------------------
      const service = payload.serviceType || "Dépistage complet & Bilan de constantes";
      const clientName = payload.clientName || payload.subscriberName || payload.beneficiaryName || "Patient(e)";
      const clientPhone = payload.clientPhone || payload.subscriberPhone || payload.beneficiaryPhone || "Non renseigné";
      const userEmail = payload.clientEmail || payload.subscriberEmail || payload.email || "";
      const beneficiary = payload.beneficiaryName || clientName;
      const beneficiaryPhone = payload.beneficiaryPhone || clientPhone;
      const date = payload.preferredDate || "À convenir";
      const time = payload.preferredTime || "09:00";
      const neighborhood = payload.beneficiaryNeighborhood || payload.neighborhood || "Dabou";
      const additionalInfo = payload.additionalInfo || payload.notes || "";
      const isDiaspora = payload.isDiaspora === "Oui" || payload.isDiaspora === true;
      const paymentMethod = payload.paymentMethod || "Paiement sur place";
      const paymentStatus = payload.paymentStatus || "En attente";
      const paymentReference = payload.paymentReference || "";
      const isPaidOnline = paymentStatus === "Payé" || paymentMethod.toLowerCase().includes("paystack");

      // Staff Alert Email
      const staffHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc; color: #1e293b;">
          <div style="background: #2563eb; padding: 18px 24px; border-radius: 12px; margin-bottom: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">🩺 NOUVELLE DEMANDE DE RENDEZ-VOUS</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Epiqure Dabou · Visite Médicale à Domicile</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #1e40af; font-size: 16px; border-bottom: 2px solid #eff6ff; padding-bottom: 8px;">Détails du Rendez-vous</h3>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Service demandé :</strong> <span style="color: #2563eb; font-weight: bold;">${service}</span></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Date &amp; Heure souhaitées :</strong> 📅 ${date} à ⏰ ${time}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Quartier à Dabou :</strong> 📍 ${neighborhood}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Paiement :</strong> <span style="font-weight: bold; color: ${isPaidOnline ? '#059669' : '#d97706'};">${isPaidOnline ? `✅ Payé en ligne via Paystack (Réf: ${paymentReference})` : `⏳ ${paymentMethod}`}</span></p>
            ${isDiaspora ? `<p style="margin: 6px 0; font-size: 14px; color: #7c3aed;"><strong>Souscription Diaspora :</strong> Oui (Demandé depuis l'étranger pour un parent)</p>` : ''}
          </div>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <h3 style="margin-top: 0; color: #1e40af; font-size: 16px; border-bottom: 2px solid #eff6ff; padding-bottom: 8px;">Patient(e) &amp; Contacts</h3>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Demandeur / Client :</strong> ${clientName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Email :</strong> ${userEmail || 'Non renseigné'}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Téléphone :</strong> ${clientPhone}</p>
            <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 12px 0;" />
            <p style="margin: 6px 0; font-size: 14px;"><strong>Bénéficiaire de la visite :</strong> ${beneficiary}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Téléphone local du patient :</strong> ${beneficiaryPhone}</p>
            ${additionalInfo ? `<p style="margin: 6px 0; font-size: 14px; background: #fffbeb; padding: 8px; border-radius: 6px; border-left: 3px solid #f59e0b;"><strong>Antécédents / Précisions :</strong> ${additionalInfo}</p>` : ''}
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://wa.me/${beneficiaryPhone.replace(/[^0-9]/g, '')}" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 10px 20px; border-radius: 8px; margin-right: 8px;">Ouvrir sur WhatsApp</a>
          </div>
        </div>
      `;

      emailToStaffResult = await sendResendEmail({
        to: [staffEmail, "kramartial@gmail.com"],
        subject: `[Epiqure Dabou] Demande de Visite (${service}) - ${clientName}`,
        html: staffHtml,
        replyTo: userEmail || undefined
      });

      // User Automatic Confirmation Email
      if (userEmail) {
        const userHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
            
            <!-- Top Brand Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px;">
                EPIQURE DABOU · SANTÉ DE PROXIMITÉ
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.2;">Demande de Rendez-vous Confirmée</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.92;">Visite médicale à domicile à Dabou</p>
            </div>

            <!-- Body -->
            <div style="padding: 28px 24px;">
              <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #334155;">
                Bonjour <strong>${clientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Nous avons bien enregistré votre demande de rendez-vous pour une visite de santé à domicile. Notre équipe médicale de Dabou a été immédiatement notifiée.
              </p>

              <!-- Appointment Recap Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 14px;">
                  <span style="font-size: 13px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Récapitulatif de votre demande</span>
                  <span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">EN ATTENTE DE PASSAGE</span>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 45%;">Service sollicité :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Date souhaitée :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #2563eb;">📅 ${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Heure souhaitée :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">⏰ ${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Bénéficiaire / Patient :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${beneficiary}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Quartier à Dabou :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">📍 ${neighborhood}, Dabou</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Téléphone de contact :</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">📞 ${clientPhone}</td>
                  </tr>
                  ${additionalInfo ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Notes / Indications :</td>
                    <td style="padding: 6px 0; font-style: italic; color: #475569;">${additionalInfo}</td>
                  </tr>` : ''}
                </table>
              </div>

              <!-- How to prepare Box -->
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase;">Déroulement de la visite :</h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #1e40af; line-height: 1.6;">
                  <li><strong>Validation téléphonique :</strong> Un conseiller soignant vous contacte pour confirmer l'heure exacte.</li>
                  <li><strong>Arrivée du soignant :</strong> Notre infirmier se présente muni de son badge officiel Epiqure et de son matériel calibré.</li>
                  <li><strong>Prise des constantes :</strong> Contrôle tensionnel, glycémie capillaire et recueil des symptômes.</li>
                  <li><strong>Conseils &amp; Ordonnance :</strong> Remise de recommandations personnalisées et envoi de votre synthèse numérique.</li>
                </ul>
              </div>

              <!-- Support Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin-top: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #1e293b;">Besoin d'un renseignement immédiat ?</p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  📞 <strong>+225 01 01 68 25 35</strong> (Téléphone &amp; WhatsApp) · ✉️ <strong>direction@epiqure.online</strong>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0 0 4px 0;"><strong>Epiqure Dabou</strong> — Service d'Itinéraire de Santé et de Proximité</p>
              <p style="margin: 0 0 4px 0;">Quartier Résidentiel, Dabou, Région des Grands Ponts, Côte d'Ivoire</p>
              <p style="margin: 0; color: #cbd5e1;">Avis médical : Epiqure n'est pas un service d'urgence hospitalière. En cas d'urgence vitale, orientez-vous immédiatement vers l'Hôpital Général de Dabou.</p>
            </div>
          </div>
        `;

        emailToUserResult = await sendResendEmail({
          to: userEmail,
          subject: `[Epiqure Dabou] Confirmation de votre rendez-vous de santé - ${service}`,
          html: userHtml,
          replyTo: staffEmail
        });
      }

    } else {
      // -------------------------------------------------------------
      // CASE 3: GENERAL CONTACT FORM (Formulaire de contact)
      // -------------------------------------------------------------
      const name = payload.name || payload.clientName || "Visiteur";
      const contact = payload.contact || payload.email || payload.phone || "";
      const message = payload.message || payload.msg || "Demande d'information";
      const userEmail = contact.includes("@") ? contact : (payload.email || "");

      const staffHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #059669; margin-top: 0;">✉️ Epiqure - Nouveau Message de Contact</h2>
          <p style="font-size: 14px; color: #334155;"><strong>Nom :</strong> ${name}</p>
          <p style="font-size: 14px; color: #334155;"><strong>Contact / Email :</strong> ${contact}</p>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
          <p style="font-size: 14px; color: #1e293b; white-space: pre-wrap;">${message}</p>
        </div>
      `;

      emailToStaffResult = await sendResendEmail({
        to: [staffEmail, "kramartial@gmail.com"],
        subject: `[Epiqure Dabou] Nouveau message de ${name}`,
        html: staffHtml,
        replyTo: userEmail || undefined
      });

      if (userEmail) {
        const userHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #059669; margin: 0;">Merci pour votre message, ${name} !</h2>
              <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Epiqure Dabou · Service d'Itinéraire de Santé et de Proximité</p>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Nous avons bien reçu votre message et nos coordinateurs de santé à Dabou vont vous répondre dans les plus brefs délais (délai moyen sous 24h).
            </p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-size: 13px; color: #166534;">
                Pour toute urgence ou question rapide, notre permanence WhatsApp et téléphonique est joignable au <strong>+225 01 01 68 25 35</strong>.
              </p>
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center;">Epiqure Dabou, Quartier Résidentiel, Côte d'Ivoire.</p>
          </div>
        `;

        emailToUserResult = await sendResendEmail({
          to: userEmail,
          subject: `[Epiqure Dabou] Nous avons bien reçu votre message`,
          html: userHtml,
          replyTo: staffEmail
        });
      }
    }

    res.json({
      success: true,
      userEmailSent: emailToUserResult?.success || false,
      staffEmailSent: emailToStaffResult?.success || false,
      resendStaff: emailToStaffResult,
      resendUser: emailToUserResult,
      formspree: formspreeSuccess
    });
  } catch (error: any) {
    console.error("Error in /api/notify endpoint:", error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
