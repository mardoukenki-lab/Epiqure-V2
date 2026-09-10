import { jsPDF } from 'jspdf';
import { VitalSign, Appointment, MedicalRecord } from '../types';

export interface MedicalSummaryPdfData {
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  neighborhood?: string;
  activePlanName?: string;
  vitals: VitalSign[];
  appointments: Appointment[];
  reports: Array<{
    id: string;
    beneficiaryName: string;
    date: string;
    tension: string;
    glycemie: number;
    notes: string;
    recommandations: string;
    sentVia?: string;
  }>;
  medicalRecords?: MedicalRecord[];
  options?: {
    includeVitals?: boolean;
    includeVisits?: boolean;
    includeReports?: boolean;
    includeRecords?: boolean;
  };
}

/**
 * Generate and trigger download of a certified medical dossier summary PDF
 */
export function generateMedicalSummaryPdf(data: MedicalSummaryPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight; // 182mm
  const bottomThreshold = 270;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const documentRef = `EPC-DM-${now.getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  let currentY = 15;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > bottomThreshold) {
      doc.addPage();
      currentY = 18;
      drawPageMiniHeader();
    }
  };

  const drawPageMiniHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('EPICURE DABOU · DOSSIER MÉDICAL & HISTORIQUE DES SOINS', marginLeft, currentY);
    doc.text(`Réf: ${documentRef}`, pageWidth - marginRight, currentY, { align: 'right' });
    currentY += 3;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 6;
  };

  // --- HEADER BANNER ---
  // Top green brand bar
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Main Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginLeft, currentY, contentWidth, 32, 3, 3, 'F');

  // Top sub-header inside box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('RÉPUBLIQUE DE CÔTE D\'IVOIRE · RÉGION DES GRANDS-PONTS (DABOU)', marginLeft + 5, currentY + 7);

  // Institution Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('EPICURE · ITINÉRAIRE DE SANTÉ DE PROXIMITÉ', marginLeft + 5, currentY + 15);

  // Document Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('RÉSUMÉ OFFICIEL DU DOSSIER MÉDICAL ET DES VISITES À DOMICILE', marginLeft + 5, currentY + 22);

  // Right-aligned reference pill
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Édité le : ${dateFormatted} à ${timeFormatted}`, pageWidth - marginRight - 5, currentY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Réf. Unique : ${documentRef}`, pageWidth - marginRight - 5, currentY + 16, { align: 'right' });
  doc.setTextColor(52, 211, 153);
  doc.text('✓ Document Sécurisé & Certifié', pageWidth - marginRight - 5, currentY + 22, { align: 'right' });

  currentY += 37;

  // --- PATIENT IDENTIFICATION CARD ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(marginLeft, currentY, contentWidth, 25, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('INFORMATIONS DU PATIENT / ADHÉRENT', marginLeft + 4, currentY + 6);

  doc.setDrawColor(226, 232, 240);
  doc.line(marginLeft + 4, currentY + 8, pageWidth - marginRight - 4, currentY + 8);

  const col1X = marginLeft + 4;
  const col2X = marginLeft + 65;
  const col3X = marginLeft + 125;

  // Column 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Nom complet :', col1X, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.patientName || 'Adhérent EPICURE', col1X, currentY + 18);

  // Column 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Secteur / Quartier Dabou :', col2X, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.neighborhood || 'Dabou Centre / Résidentiel', col2X, currentY + 18);

  // Column 3
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Formule souscrite :', col3X, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(data.activePlanName || 'Suivi Personnalisé / Visites', col3X, currentY + 18);

  currentY += 31;

  // --- SECTION 1: CONSTANTES VITALES ---
  const includeVitals = data.options?.includeVitals !== false;
  if (includeVitals) {
    checkPageBreak(40);

    // Section Header
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(20, 184, 166); // teal-500
    doc.roundedRect(marginLeft, currentY, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text('1. RELEVÉ ET SUIVI DES CONSTANTES VITALES (Tension, Glycémie, Poids)', marginLeft + 3, currentY + 5);

    currentY += 11;

    // Combine vitals from VitalSign collection and reports from agents
    const combinedVitalsList: Array<{
      date: string;
      patient: string;
      tension: string;
      glycemie: string;
      weightRate: string;
      notes: string;
    }> = [];

    // From vital sign tracker entries
    data.vitals.forEach((v) => {
      let t = '--/--';
      if (v.bloodPressureText) t = v.bloodPressureText;
      else if (v.systolic && v.diastolic) t = `${v.systolic}/${v.diastolic}`;

      let g = '--';
      if (v.bloodSugar) {
        g = `${v.bloodSugar} g/L`;
        if (v.bloodSugarContext === 'fasting') g += ' (à jeun)';
        else if (v.bloodSugarContext === 'post_meal') g += ' (post-repas)';
      }

      let wr = '';
      if (v.weight) wr += `${v.weight} kg `;
      if (v.heartRate) wr += `${v.heartRate} bpm`;

      combinedVitalsList.push({
        date: v.date + (v.time ? ` à ${v.time}` : ''),
        patient: v.patientName || data.patientName,
        tension: t,
        glycemie: g,
        weightRate: wr.trim() || '—',
        notes: v.notes || (v.source === 'agent' ? 'Mesure agent soignant' : 'Relevé personnel'),
      });
    });

    // From clinical reports
    data.reports.forEach((r) => {
      combinedVitalsList.push({
        date: r.date || 'Récemment',
        patient: r.beneficiaryName || data.patientName,
        tension: r.tension || '--/--',
        glycemie: r.glycemie ? `${r.glycemie} g/L` : '—',
        weightRate: 'Visite soignant',
        notes: r.notes || r.recommandations || 'Bilan clinique à domicile',
      });
    });

    // Sort by date descending
    combinedVitalsList.sort((a, b) => (a.date < b.date ? 1 : -1));

    if (combinedVitalsList.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginLeft, currentY, contentWidth, 12, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Aucune constante vitale enregistrée dans le dossier pour cette période.', marginLeft + 4, currentY + 7);
      currentY += 16;
    } else {
      // Summary KPIs Box
      const latest = combinedVitalsList[0];
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginLeft, currentY, contentWidth, 15, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Dernière mesure enregistrée :', marginLeft + 4, currentY + 5);
      doc.text('Tension Artérielle :', marginLeft + 60, currentY + 5);
      doc.text('Glycémie Capillaire :', marginLeft + 110, currentY + 5);
      doc.text('Total des relevés :', marginLeft + 155, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(latest.date, marginLeft + 4, currentY + 11);

      doc.setTextColor(5, 150, 105); // emerald
      doc.text(latest.tension, marginLeft + 60, currentY + 11);

      doc.setTextColor(13, 148, 136); // teal
      doc.text(latest.glycemie, marginLeft + 110, currentY + 11);

      doc.setTextColor(15, 23, 42);
      doc.text(`${combinedVitalsList.length} prise(s)`, marginLeft + 155, currentY + 11);

      currentY += 18;

      // Table Header
      checkPageBreak(25);
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(marginLeft, currentY, contentWidth, 6, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(marginLeft, currentY + 6, pageWidth - marginRight, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // slate-600

      const tDateX = marginLeft + 2;
      const tPatX = marginLeft + 35;
      const tTaX = marginLeft + 72;
      const tGlyX = marginLeft + 98;
      const tWrX = marginLeft + 128;
      const tObsX = marginLeft + 155;

      doc.text('Date / Heure', tDateX, currentY + 4.2);
      doc.text('Bénéficiaire', tPatX, currentY + 4.2);
      doc.text('Tension (TA)', tTaX, currentY + 4.2);
      doc.text('Glycémie', tGlyX, currentY + 4.2);
      doc.text('Poids / Rythme', tWrX, currentY + 4.2);
      doc.text('Observations', tObsX, currentY + 4.2);

      currentY += 7;

      // Render rows (max 10 recent entries to avoid overflowing unnecessarily)
      const rowsToShow = combinedVitalsList.slice(0, 10);
      rowsToShow.forEach((row, idx) => {
        checkPageBreak(8);
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginLeft, currentY - 0.5, contentWidth, 6.5, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        doc.text(doc.splitTextToSize(row.date, 30)[0] || '', tDateX, currentY + 4);
        doc.text(doc.splitTextToSize(row.patient, 34)[0] || '', tPatX, currentY + 4);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(5, 150, 105);
        doc.text(row.tension, tTaX, currentY + 4);

        doc.setTextColor(13, 148, 136);
        doc.text(row.glycemie, tGlyX, currentY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(doc.splitTextToSize(row.weightRate, 24)[0] || '', tWrX, currentY + 4);
        doc.text(doc.splitTextToSize(row.notes, 25)[0] || '—', tObsX, currentY + 4);

        currentY += 6.5;
      });

      currentY += 4;
    }
  }

  // --- SECTION 2: HISTORIQUE DES VISITES À DOMICILE ---
  const includeVisits = data.options?.includeVisits !== false;
  if (includeVisits) {
    checkPageBreak(40);

    // Section Header
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(marginLeft, currentY, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('2. HISTORIQUE DES VISITES ET CONSULTATIONS À DOMICILE (DABOU)', marginLeft + 3, currentY + 5);

    currentY += 11;

    if (data.appointments.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginLeft, currentY, contentWidth, 12, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Aucune visite médicale à domicile répertoriée dans ce dossier.', marginLeft + 4, currentY + 7);
      currentY += 16;
    } else {
      // Table Header for visits
      doc.setFillColor(241, 245, 249);
      doc.rect(marginLeft, currentY, contentWidth, 6, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(marginLeft, currentY + 6, pageWidth - marginRight, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      const vDateX = marginLeft + 2;
      const vPrestaX = marginLeft + 42;
      const vLocX = marginLeft + 95;
      const vStatX = marginLeft + 140;
      const vRefX = marginLeft + 165;

      doc.text('Date & Heure', vDateX, currentY + 4.2);
      doc.text('Type de Soin / Prestation', vPrestaX, currentY + 4.2);
      doc.text('Quartier / Adresse', vLocX, currentY + 4.2);
      doc.text('Statut', vStatX, currentY + 4.2);
      doc.text('Réf.', vRefX, currentY + 4.2);

      currentY += 7;

      data.appointments.forEach((app, idx) => {
        checkPageBreak(12);

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(marginLeft, currentY - 0.5, contentWidth, 8, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        const dateStr = `${app.preferredDate || '—'} à ${app.preferredTime || '09:00'}`;
        doc.text(dateStr, vDateX, currentY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize(app.serviceType || 'Visite préventive', 50)[0] || '', vPrestaX, currentY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const loc = app.neighborhood || (app as any).beneficiaryNeighborhood || 'Dabou';
        doc.text(doc.splitTextToSize(loc, 42)[0] || '', vLocX, currentY + 4.5);

        // Status badge
        const st = (app.status || 'pending').toLowerCase();
        if (st === 'confirmed' || st === 'completed') {
          doc.setTextColor(5, 150, 105); // emerald
          doc.setFont('helvetica', 'bold');
          doc.text('Effectué / Confirmé', vStatX, currentY + 4.5);
        } else if (st === 'cancelled') {
          doc.setTextColor(225, 29, 72); // rose
          doc.setFont('helvetica', 'bold');
          doc.text('Annulé', vStatX, currentY + 4.5);
        } else {
          doc.setTextColor(217, 119, 6); // amber
          doc.setFont('helvetica', 'bold');
          doc.text('En attente', vStatX, currentY + 4.5);
        }

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(app.id ? app.id.slice(0, 8) : `VIS-${idx + 1}`, vRefX, currentY + 4.5);

        currentY += 8;
      });

      currentY += 4;
    }
  }

  // --- SECTION 3: RECOMMANDATIONS SOIGNANTES & OBSERVATIONS ---
  const includeReports = data.options?.includeReports !== false;
  if (includeReports && data.reports.length > 0) {
    checkPageBreak(35);

    doc.setFillColor(243, 244, 246); // slate-100
    doc.setDrawColor(156, 163, 175); // slate-400
    doc.roundedRect(marginLeft, currentY, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55); // slate-800
    doc.text('3. SYNTHÈSE CLINIQUES & RECOMMANDATIONS DES SOIGNANTS RÉFÉRENTS', marginLeft + 3, currentY + 5);

    currentY += 11;

    data.reports.slice(0, 3).forEach((rep) => {
      checkPageBreak(22);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginLeft, currentY, contentWidth, 19, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Consultation du ${rep.date} · Bénéficiaire : ${rep.beneficiaryName}`, marginLeft + 3, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      const notesLine = rep.notes ? `Observation clinique : ${rep.notes}` : 'Examen de routine des constantes vitales réalisé à domicile sans anomalie aiguë.';
      const recomLine = rep.recommandations ? `Consignes médicales : ${rep.recommandations}` : 'Poursuivre la bonne observance du traitement et une hydratation adaptée.';

      doc.text(doc.splitTextToSize(notesLine, contentWidth - 8).slice(0, 1), marginLeft + 3, currentY + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(doc.splitTextToSize(recomLine, contentWidth - 8).slice(0, 1), marginLeft + 3, currentY + 15);

      currentY += 23;
    });
  }

  // --- SECTION 4: PIÈCES JOINTES & ORDONNANCES (si disponibles) ---
  const includeRecords = data.options?.includeRecords !== false;
  if (includeRecords && data.medicalRecords && data.medicalRecords.length > 0) {
    checkPageBreak(25);

    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(marginLeft, currentY, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text('4. DOCUMENTS ET ORDONNANCES ENREGISTRÉS DANS LE DOSSIER', marginLeft + 3, currentY + 5);

    currentY += 10;

    data.medicalRecords.slice(0, 5).forEach((rec) => {
      checkPageBreak(7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`• [${rec.category}] ${rec.title}`, marginLeft + 3, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Date : ${rec.recordDate} · Patient : ${rec.patientName}`, marginLeft + 110, currentY + 4);

      currentY += 6;
    });

    currentY += 4;
  }

  // --- CACHET & CERTIFICATION OFFICIELLE ---
  checkPageBreak(35);
  currentY += 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginLeft, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATION DU SERVICE DE SANTÉ DE PROXIMITÉ (DABOU)', marginLeft + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const legalNotice = 'Ce document constitue une synthèse informative certifiée des données et relevés de santé à domicile. ' +
    'Il est remis au patient pour faciliter la coordination de ses soins avec ses médecins traitants et spécialistes hospitaliers.';
  doc.text(doc.splitTextToSize(legalNotice, 115), marginLeft + 4, currentY + 10);

  // Digital Stamp Box on the right
  doc.setDrawColor(5, 150, 105);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(pageWidth - marginRight - 55, currentY + 3, 51, 20, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('EPICURE DABOU', pageWidth - marginRight - 52, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Pôle Soignants Référents', pageWidth - marginRight - 52, currentY + 12);
  doc.text('Validation & Suivi Médical', pageWidth - marginRight - 52, currentY + 16);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certifié #${documentRef.slice(-6)}`, pageWidth - marginRight - 52, currentY + 20);

  currentY += 30;

  // --- FOOTER ON EVERY PAGE ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12);

    doc.text(
      'EPICURE DABOU · Service d\'Itinéraire de Santé et de Proximité · Tél / Urgence : +225 01 01 68 25 35 · Email : direction@epiqure.online',
      marginLeft,
      pageHeight - 7
    );
    doc.text(
      `Page ${i} sur ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  // Sanitize filename
  const cleanName = (data.patientName || 'Adherent_EPICURE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = now.toISOString().split('T')[0];
  const filename = `Dossier_Medical_EPICURE_${cleanName}_${dateStr}.pdf`;

  // Trigger download directly in the browser
  doc.save(filename);
}

/**
 * Generate a single consultation summary report PDF
 */
export function generateSingleReportPdf(
  rep: {
    id: string;
    beneficiaryName: string;
    date: string;
    tension: string;
    glycemie: number;
    notes: string;
    recommandations: string;
    sentVia?: string;
  },
  patientLocation = 'Dabou, Côte d\'Ivoire'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Top green stripe
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginLeft, 15, contentWidth, 30, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153);
  doc.text('RÉPUBLIQUE DE CÔTE D\'IVOIRE · RÉGION DES GRANDS-PONTS (DABOU)', marginLeft + 5, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('EPICURE · SYNTHÈSE CLINIQUE DE CONSULTATION', marginLeft + 5, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Consultation à domicile du : ${rep.date} · Réf. ${rep.id}`, marginLeft + 5, 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(52, 211, 153);
  doc.text('✓ Acte Médical Validé', pageWidth - marginRight - 5, 29, { align: 'right' });

  // Patient Info
  let currentY = 50;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Bénéficiaire / Patient :', marginLeft + 4, currentY + 7);
  doc.text('Localisation des soins :', marginLeft + 80, currentY + 7);
  doc.text('Praticien référent :', marginLeft + 130, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(rep.beneficiaryName, marginLeft + 4, currentY + 14);
  doc.text(patientLocation, marginLeft + 80, currentY + 14);
  doc.setTextColor(5, 150, 105);
  doc.text('Équipe Soignante EPICURE', marginLeft + 130, currentY + 14);

  currentY += 26;

  // Vitals Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSTANTES MESURÉES LORS DE CETTE VISITE', marginLeft, currentY);
  currentY += 4;

  const cardW = (contentWidth - 6) / 2;
  // Card 1: TA
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(20, 184, 166);
  doc.roundedRect(marginLeft, currentY, cardW, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(13, 148, 136);
  doc.text('Tension Artérielle', marginLeft + 4, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(rep.tension || 'Non mesurée', marginLeft + 4, currentY + 16);

  // Card 2: Glycemie
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(marginLeft + cardW + 6, currentY, cardW, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('Glycémie Capillaire', marginLeft + cardW + 10, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(rep.glycemie ? `${rep.glycemie} g/L` : 'Non mesurée', marginLeft + cardW + 10, currentY + 16);

  currentY += 26;

  // Observations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('OBSERVATIONS ET AUSCULTATION CLINIQUES', marginLeft, currentY);
  currentY += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginLeft, currentY, contentWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const obsText = rep.notes || 'Visite clinique de surveillance à domicile. Auscultation générale et constantes stables.';
  doc.text(doc.splitTextToSize(obsText, contentWidth - 8), marginLeft + 4, currentY + 8);

  currentY += 30;

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSIGNES MÉDICALES & RECOMMANDATIONS', marginLeft, currentY);
  currentY += 4;

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(marginLeft, currentY, contentWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  const recText = rep.recommandations || 'Poursuivre le traitement habituel, assurer une hydratation régulière et une marche modérée.';
  doc.text(doc.splitTextToSize(recText, contentWidth - 8), marginLeft + 4, currentY + 8);

  currentY += 32;

  // Certification Stamp
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginLeft, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('SERVICE MÉDICAL EPICURE DABOU', marginLeft + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Validation effectuée par l\'infirmier référent de garde.', marginLeft + 4, currentY + 12);
  doc.text(`Transmis via : ${rep.sentVia || 'Portail & WhatsApp'} · Édité le ${dateFormatted}`, marginLeft + 4, currentY + 18);

  // Stamp Box
  doc.setDrawColor(5, 150, 105);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(pageWidth - marginRight - 50, currentY + 3, 46, 20, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('EPICURE DABOU', pageWidth - marginRight - 47, currentY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Pôle Soignants', pageWidth - marginRight - 47, currentY + 14);
  doc.setTextColor(100, 116, 139);
  doc.text(`Réf: ${rep.id}`, pageWidth - marginRight - 47, currentY + 19);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.line(marginLeft, 285, pageWidth - marginRight, 285);
  doc.text('EPICURE DABOU · Service d\'Itinéraire de Santé et de Proximité · Tél: +225 01 01 68 25 35', marginLeft, 290);
  doc.text('Page 1 sur 1', pageWidth - marginRight, 290, { align: 'right' });

  const cleanName = rep.beneficiaryName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Synthese_Consultation_${cleanName}_${rep.date || 'Dabou'}.pdf`);
}
