
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES, USER_CONTRACTS_STORAGE_KEY } from "@/lib/constants";
import { CheckCircle, FileText, Home, AlertTriangle, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMockAuth } from "@/hooks/use-mock-auth";
import type { ContractPlanDetails, UserContract } from "@/lib/types";
import { DownloadContractButton } from "@/components/checkout/insurance-contract";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useMockAuth();
  const [contractDisplayDetails, setContractDisplayDetails] = useState<ContractPlanDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const policyNumber = searchParams.get("policyNumber");

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
              coverageDetails: foundContract.coverageDetails,
            });
          } else {
            console.error("Contract not found in localStorage or mismatch user for policy: ", policyNumber);
          }
        }
      } catch (error) {
        console.error("Failed to load or parse contract from localStorage", error);
      }
    }
    setDetailsLoading(false);
  }, [searchParams, user]);

  const handleSendEmail = () => {
    if (!contractDisplayDetails || !user) return;
    console.log("Simulating sending contract by email:", {
      to: user.email,
      policyNumber: contractDisplayDetails.policyNumber,
      planName: contractDisplayDetails.planName,
    });
    toast({
      title: "Contrat Envoyé (Simulation)",
      description: `Le contrat ${contractDisplayDetails.policyNumber} a été envoyé par e-mail à ${user.email}. (Ceci est une simulation).`,
    });
  };


  if (authLoading || detailsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des détails de votre commande...</p>
      </div>
    );
  }

  if (!contractDisplayDetails) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-2xl font-semibold mb-2">Erreur de Chargement</CardTitle>
        <CardDescription className="text-muted-foreground mb-6">Impossible de charger les détails de votre commande. Veuillez vérifier le numéro de police ou réessayer.</CardDescription>
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
          <CardTitle className="text-3xl font-bold text-primary">Félicitations !</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Votre souscription à <strong className="text-foreground">{contractDisplayDetails.planName}</strong> a été confirmée avec succès.
            <br/> Numéro de Police: <strong className="text-foreground">{contractDisplayDetails.policyNumber}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {contractDisplayDetails.price && contractDisplayDetails.currency && (
            <p className="text-md">
              Un montant de <strong>{contractDisplayDetails.price} {contractDisplayDetails.currency}</strong> a été (simulé) débité.
            </p>
          )}
          <p className="text-md">
            Vous recevrez bientôt un e-mail de confirmation avec les détails de votre police et les documents importants.
            (Ceci est une simulation, aucun e-mail ne sera envoyé).
          </p>
          
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
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Merci d'avoir choisi {APP_NAME} pour votre assurance voyage !
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
