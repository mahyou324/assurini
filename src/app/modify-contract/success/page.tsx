
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES, USER_CONTRACTS_STORAGE_KEY, DEFAULT_CURRENCY } from "@/lib/constants";
import { CheckCircle, FileText, Home, AlertTriangle, Edit, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMockAuth } from "@/hooks/use-mock-auth";
import type { ContractPlanDetails, UserContract } from "@/lib/types";
import { DownloadContractButton } from "@/components/checkout/insurance-contract";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

function ModifySuccessContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useMockAuth();
  const [contractDisplayDetails, setContractDisplayDetails] = useState<ContractPlanDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [actualCostPaid, setActualCostPaid] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const policyNumber = searchParams.get("policyNumber");
    const costPaidParam = searchParams.get("actualModificationCostPaid");
    if(costPaidParam) setActualCostPaid(costPaidParam);

    if (policyNumber && user) { 
      try {
        const storedContractsString = localStorage.getItem(USER_CONTRACTS_STORAGE_KEY);
        if (storedContractsString) {
          const storedContracts: UserContract[] = JSON.parse(storedContractsString);
          const foundContract = storedContracts.find(
            (contract) => contract.policyNumber === policyNumber && contract.userEmail === user.email
          );

          if (foundContract) {
            setContractDisplayDetails({
              policyNumber: foundContract.policyNumber,
              planName: foundContract.planName,
              price: foundContract.originalPrice, 
              currency: foundContract.currency,
              provider: foundContract.provider,
              startDate: foundContract.startDate,
              endDate: foundContract.endDate,
              destination: foundContract.destination,
              policyDocumentLink: foundContract.policyDocumentLink,
              userFullName: foundContract.userFullName,
              userEmail: foundContract.userEmail,
              userPassportNumber: foundContract.userPassportNumber,
              issueDate: foundContract.issueDate, 
              lastModifiedDate: foundContract.lastModifiedDate, 
              coverageDetails: foundContract.coverageDetails,
              actualModificationCostPaid: costPaidParam || undefined, 
            });
          } else {
             console.error("Modified contract not found in localStorage or user mismatch for policy:", policyNumber);
          }
        }
      } catch (error) {
        console.error("Failed to load or parse modified contract from localStorage", error);
      }
    }
    setDetailsLoading(false);
  }, [searchParams, user]);

  const handleSendEmail = () => {
    if (!contractDisplayDetails || !user) return;
    console.log("Simulating sending modified contract by email:", {
      to: user.email,
      policyNumber: contractDisplayDetails.policyNumber,
      planName: contractDisplayDetails.planName,
    });
    toast({
      title: "Contrat Modifié Envoyé (Simulation)",
      description: `Le contrat modifié ${contractDisplayDetails.policyNumber} a été envoyé par e-mail à ${user.email}. (Ceci est une simulation).`,
    });
  };

  if (authLoading || detailsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des détails de votre contrat modifié...</p>
      </div>
    );
  }

  if (!contractDisplayDetails) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-2xl font-semibold mb-2">Erreur de Chargement</CardTitle>
        <CardDescription className="text-muted-foreground mb-6">Impossible de charger les détails de votre contrat modifié.</CardDescription>
        <Button asChild>
          <Link href={ROUTES.HOME}>
            <Home className="mr-2 h-4 w-4" />
            Retour à l'Accueil
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <Card className="w-full max-w-lg shadow-xl p-4 md:p-8">
        <CardHeader className="items-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Modification Réussie !</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Votre contrat <strong className="text-foreground">{contractDisplayDetails.policyNumber}</strong> pour le plan <strong className="text-foreground">{contractDisplayDetails.planName}</strong> a été modifié avec succès.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {actualCostPaid && (
            <p className="text-md">
                Un montant de <strong>{actualCostPaid} {DEFAULT_CURRENCY}</strong> a été (simulé) payé pour cette modification.
            </p>
           )}
          <div className="text-left bg-muted/50 p-4 rounded-md text-sm">
            <p className="font-semibold mb-2">Nouveaux détails du voyage :</p>
            <p><strong>Plan:</strong> {contractDisplayDetails.planName} par {contractDisplayDetails.provider}</p>
            <p><strong>Nouveau Prix Total du Plan:</strong> {contractDisplayDetails.price} {DEFAULT_CURRENCY}</p>
            <p><strong>Destination:</strong> {contractDisplayDetails.destination}</p>
            <p><strong>Période:</strong> Du {contractDisplayDetails.startDate ? format(parseISO(contractDisplayDetails.startDate), "dd MMMM yyyy", { locale: fr }) : 'N/A'} au {contractDisplayDetails.endDate ? format(parseISO(contractDisplayDetails.endDate), "dd MMMM yyyy", { locale: fr }) : 'N/A'}</p>
            {contractDisplayDetails.lastModifiedDate && (
                <p><strong>Date de modification:</strong> {format(parseISO(contractDisplayDetails.lastModifiedDate), "dd MMMM yyyy à HH:mm", { locale: fr })}</p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {user && contractDisplayDetails && (
               <DownloadContractButton 
                  user={{ 
                      email: contractDisplayDetails.userEmail || user.email, 
                      fullName: contractDisplayDetails.userFullName || user.fullName,
                      passportNumber: contractDisplayDetails.userPassportNumber || user.passportNumber,
                  }} 
                  planDetails={contractDisplayDetails} 
              />
            )}
            <Button onClick={handleSendEmail} variant="outline" className="w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" />
              Envoyer par E-mail (Sim)
            </Button>
          </div>


          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Retour à l'Accueil
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={ROUTES.PROFILE}> 
                <FileText className="mr-2 h-4 w-4" />
                Voir mon Profil
              </Link>
            </Button>
             <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={ROUTES.MODIFY_CONTRACT}> 
                <Edit className="mr-2 h-4 w-4" />
                Modifier un autre contrat
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Merci d'avoir choisi {APP_NAME} !
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ModifyContractSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    }>
      <ModifySuccessContent />
    </Suspense>
  );
}
