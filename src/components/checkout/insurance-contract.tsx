
"use client";

import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import type { MockUser, ContractPlanDetails } from "@/lib/types";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { QRCodeCanvas } from 'qrcode.react';
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface DownloadContractButtonProps {
  user: MockUser; 
  planDetails: ContractPlanDetails; 
}

export function DownloadContractButton({ user, planDetails }: DownloadContractButtonProps) {
  
  const policyNumber = planDetails.policyNumber;
  
  const qrCodeData = useMemo(() => {
    const startDateFormatted = planDetails.startDate ? format(parseISO(planDetails.startDate), "dd/MM/yy", { locale: fr }) : 'N/A';
    const endDateFormatted = planDetails.endDate ? format(parseISO(planDetails.endDate), "dd/MM/yy", { locale: fr }) : 'N/A';
    let qrData = `Numéro de Police: ${policyNumber}\nAssuré: ${planDetails.userFullName || user.fullName || user.email}\nPasseport: ${planDetails.userPassportNumber || user.passportNumber || 'N/A'}\nPlan: ${planDetails.planName}\nValidité: ${startDateFormatted} - ${endDateFormatted}\nDestination: ${planDetails.destination || 'N/A'}`;
    if (planDetails.lastModifiedDate) {
      qrData += `\nDern. Modif: ${format(parseISO(planDetails.lastModifiedDate), "dd/MM/yy HH:mm", { locale: fr })}`;
    }
     qrData += `\nPrix Plan: ${planDetails.price} ${planDetails.currency}`;
    return qrData;
  }, [policyNumber, user, planDetails]);

  const handleDownloadPdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const FONT_FAMILY = "helvetica"; 

    const insurerName = APP_NAME;
    const insurerAddress = "123 Rue Exemple, Alger, Algérie"; // Generic address
    const insurerContact = `support@${APP_NAME.toLowerCase().replace(/\s+/g, '')}.dz / +213 (0)XX XX XX XX`;


    const issueDateToDisplay = planDetails.issueDate ? format(parseISO(planDetails.issueDate), "dd MMMM yyyy", { locale: fr }) : format(new Date(), "dd MMMM yyyy", { locale: fr });
    const lastModifiedDateDisplay = planDetails.lastModifiedDate ? format(parseISO(planDetails.lastModifiedDate), "dd MMMM yyyy HH:mm", { locale: fr }) : null;


    let qrDataUrl = "";
    const canvasElement = document.getElementById('qr-canvas-for-pdf-hidden') as HTMLCanvasElement | null;
    
    if (canvasElement) {
      try {
        qrDataUrl = canvasElement.toDataURL('image/png');
      } catch (e) {
        console.error("Error generating QR data URL from canvas:", e);
      }
    } else {
      console.warn("QR Canvas element not found.");
    }

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(18);
    pdf.text(insurerName, pageWidth / 2, y, { align: "center" });
    y += 7;
    pdf.setFontSize(12);
    pdf.text("Attestation d'Assurance Voyage", pageWidth / 2, y, { align: "center" });
    y += 10;

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(9);
    pdf.text(insurerAddress, margin, y);
    y += 4;
    pdf.text(insurerContact, margin, y);
    
    if (qrDataUrl) {
      try {
        const qrSize = 30; 
        const qrX = pageWidth - margin - qrSize; 
        const qrY = y - 10; 
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (e) {
        console.error("Error adding QR code image to PDF:", e);
        const qrErrorY = margin + 15;
        pdf.setFont(FONT_FAMILY, "italic");
        pdf.setFontSize(7);
        pdf.text("QR Data (Err EmbImg):\n" + qrCodeData.split('\n').join(' | '), pageWidth - margin - 35, qrErrorY, {align: 'right', maxWidth: 30});
      }
    } else {
      const qrPlaceholderY = margin + 15;
      pdf.setFont(FONT_FAMILY, "italic");
      pdf.setFontSize(8);
      pdf.text("[QR Code non généré]", pageWidth - margin - 35, qrPlaceholderY, {align: 'right', maxWidth: 30});
      pdf.setFontSize(6);
      pdf.text(qrCodeData.split('\n').slice(0,5).join(' | '), pageWidth - margin - 35, qrPlaceholderY + 5, {align: "right", maxWidth: 30}); // Show limited lines
    }

    y += 10;
    pdf.setDrawColor(200, 200, 200); 
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(11);
    pdf.text("Détails de la Police", margin, y);
    y += 6;

    const addDetail = (label: string, value: string | undefined | null, options?: {isPrice?: boolean}) => {
      if (value === undefined || value === null || String(value).trim() === "") return;
      pdf.setFont(FONT_FAMILY, "bold");
      pdf.text(label + ":", margin + 5, y);
      pdf.setFont(FONT_FAMILY, "normal");
      let displayValue = String(value);
      if (options?.isPrice && planDetails.currency) {
        displayValue = `${value} ${planDetails.currency}`;
      }
      const textLines = pdf.splitTextToSize(displayValue, pageWidth - margin - 65 - (margin+5)); 
      pdf.text(textLines, margin + 55, y); 
      y += (textLines.length * 4) + 2; 
    };
    
    addDetail("Numéro de Police", policyNumber);
    addDetail("Date d'Émission", issueDateToDisplay);
    if(lastModifiedDateDisplay) addDetail("Dernière Modification", lastModifiedDateDisplay);
    addDetail("Plan d'Assurance", planDetails.planName);
    addDetail("Fournisseur", planDetails.provider);
    addDetail("Prix du Plan", planDetails.price, {isPrice: true});
    if(planDetails.actualModificationCostPaid) addDetail("Coût de Modification Payé", planDetails.actualModificationCostPaid, {isPrice: true})

    y += 2; 

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.text("Informations de l'Assuré(e)", margin, y);
    y += 6;
    addDetail("Nom Complet", planDetails.userFullName || user.fullName || user.email);
    addDetail("Adresse E-mail", planDetails.userEmail || user.email);
    const passportNum = planDetails.userPassportNumber || user.passportNumber;
    if (passportNum) addDetail("Numéro de Passeport", passportNum);
    if (user.phoneNumber) addDetail("N° de Téléphone", user.phoneNumber);
    if (user.address) addDetail("Adresse Postale", user.address);
    y += 2;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.text("Détails du Voyage Assuré", margin, y);
    y += 6;
    addDetail("Destination", planDetails.destination);
    
    const tripStartDateFormatted = planDetails.startDate ? format(parseISO(planDetails.startDate), "dd MMMM yyyy", { locale: fr }) : "N/A";
    const tripEndDateFormatted = planDetails.endDate ? format(parseISO(planDetails.endDate), "dd MMMM yyyy", { locale: fr }) : "N/A";
    addDetail("Période de Couverture", `Du ${tripStartDateFormatted} au ${tripEndDateFormatted}`);
    y += 5;

    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(10);
    pdf.text("Résumé des Garanties", margin, y);
    y += 5;
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(8);
    const coverageText = planDetails.coverageDetails || "Les détails de la couverture sont spécifiés dans le document de police complet.";
    const coverageLines = pdf.splitTextToSize(coverageText, pageWidth - margin * 2);
    pdf.text(coverageLines, margin, y);
    y += (coverageLines.length * 3.5) + 5;
    
    if (y > pageHeight - 30) { // Check if new page is needed
        pdf.addPage();
        y = margin;
    }

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(10);
    pdf.text("Conditions Générales et Informations Importantes", margin, y);
    y += 5;
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(8);
    const termsText = `Ceci est une attestation d'assurance voyage simulée. Elle est soumise aux conditions générales du plan "${planDetails.planName}" fourni par ${planDetails.provider}. Le document de police complet est disponible via le lien: ${planDetails.policyDocumentLink && planDetails.policyDocumentLink !== "MOCK_POLICY_LINK_PLACEHOLDER" ? planDetails.policyDocumentLink : '(document de police standard disponible sur demande)'}. Pour toute réclamation ou assistance, veuillez contacter notre service client aux coordonnées fournies. Ce document est émis par ${insurerName}.`;
    const termsLines = pdf.splitTextToSize(termsText, pageWidth - margin * 2);
    pdf.text(termsLines, margin, y);
    y += (termsLines.length * 3.5) + 5;


    const disclaimer = "Ce document est une simulation et n'a aucune valeur contractuelle réelle. Généré par " + APP_NAME + ".";
    pdf.setFont(FONT_FAMILY, "italic");
    pdf.setFontSize(8);
    // Position disclaimer at the bottom of the current page
    const disclaimerY = pdf.internal.pageSize.getHeight() - margin + 8;
    if (y > disclaimerY - 5) { // If content is too close to disclaimer position, add new page for disclaimer
        pdf.addPage();
        y = margin; // Reset y for new page, though disclaimer is last
         pdf.text(disclaimer, pageWidth / 2, pdf.internal.pageSize.getHeight() - margin + 8, { align: "center" });
    } else {
        pdf.text(disclaimer, pageWidth / 2, disclaimerY, { align: "center" });
    }
   

    pdf.save(`contrat_assurance_${policyNumber}${lastModifiedDateDisplay ? '_modifie' : ''}.pdf`);
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '256px', height: '256px' }}>
        {/* Render QRCodeCanvas only on client-side after mount to ensure document is available */}
        {typeof window !== 'undefined' && (
            <QRCodeCanvas
            value={qrCodeData}
            size={256} 
            level="M" 
            id="qr-canvas-for-pdf-hidden" 
            bgColor="#ffffff"
            fgColor="#000000"
            />
        )}
      </div>
      <Button onClick={handleDownloadPdf} variant="default" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
        <Download className="mr-2 h-4 w-4" />
        Télécharger mon Contrat (PDF)
      </Button>
    </>
  );
}
