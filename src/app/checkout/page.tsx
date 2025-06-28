
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentForm } from '@/components/checkout/payment-form';
import type { SelectedPlanWithTripDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ShieldCheck, Users, CalendarDays, Tag, AlertTriangle, Loader2, MapPin, Building } from 'lucide-react';
import { ROUTES, DEFAULT_CURRENCY } from '@/lib/constants';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// No server-side metadata for client-rendered conditional content

export default function CheckoutPage() {
  const [selectedPlanData, setSelectedPlanData] = useState<SelectedPlanWithTripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem('selectedInsurancePlan');
      if (storedPlan) {
        const parsedPlan: SelectedPlanWithTripDetails = JSON.parse(storedPlan);
        setSelectedPlanData(parsedPlan);
      } else {
        // No plan selected, redirect to quote page
        router.replace(ROUTES.GET_QUOTE);
      }
    } catch (error) {
        console.error("Failed to parse plan from localStorage", error);
        router.replace(ROUTES.GET_QUOTE); // Redirect on error
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de votre commande...</p>
      </div>
    );
  }

  if (!selectedPlanData) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)]">
         <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Aucun plan sélectionné</h2>
        <p className="text-muted-foreground mb-6">Il semble que vous n'ayez pas encore sélectionné de plan d'assurance.</p>
        <Button asChild>
          <Link href={ROUTES.GET_QUOTE}>Retourner aux devis</Link>
        </Button>
      </div>
    );
  }
  
  const { plan, userInput } = selectedPlanData;

  const formattedStartDate = userInput.startDate ? format(new Date(userInput.startDate), "dd MMMM yyyy", { locale: fr }) : "N/A";
  const formattedEndDate = userInput.endDate ? format(new Date(userInput.endDate), "dd MMMM yyyy", { locale: fr }) : "N/A";


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="outline" onClick={() => router.push(ROUTES.GET_QUOTE)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux recommandations
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Plan Summary Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-2xl flex items-center">
              <ShieldCheck className="mr-3 h-7 w-7" /> Récapitulatif de votre Plan
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">Vérifiez les détails de votre plan avant de payer.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">{plan.planName}</h3>
              <p className="text-sm text-muted-foreground flex items-center"><Building className="h-4 w-4 mr-2"/>Fournisseur: {plan.provider}</p>
            </div>

            {userInput.destination && (
              <p className="text-sm text-muted-foreground flex items-center"><MapPin className="h-4 w-4 mr-2"/>Destination: {userInput.destination}</p>
            )}
             {(userInput.startDate || userInput.endDate) && (
              <p className="text-sm text-muted-foreground flex items-center">
                <CalendarDays className="h-4 w-4 mr-2"/>
                Période: Du {formattedStartDate} au {formattedEndDate}
              </p>
            )}


            <div className="border-t pt-4">
              <h4 className="font-medium mb-1">Détails principaux de la couverture :</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {plan.coverageDetails.split('\n').slice(0, 4).map((detail, index) => detail.trim() && <li key={index}>{detail.trim().replace(/^- /, '')}</li>)}
                {plan.coverageDetails.split('\n').length > 4 && <li>Et plus...</li>}
              </ul>
            </div>
            <div className="border-t pt-4">
                <a 
                    href={plan.policyDocumentLink || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-sm text-primary hover:underline"
                >
                    <FileText className="mr-2 h-4 w-4" /> Consulter le document de police complet (PDF)
                </a>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6">
            <div className="w-full flex justify-between items-center">
              <p className="text-lg font-semibold">Total à Payer :</p>
              <p className="text-2xl font-bold text-accent">
                {plan.price} {DEFAULT_CURRENCY}
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Payment Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Informations de Paiement</CardTitle>
            <CardDescription>Complétez le formulaire ci-dessous pour finaliser votre souscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm 
              planName={plan.planName} // Kept for potential direct use or can be removed if selectedPlanData is always used
              price={plan.price} // Same as above
              currency={DEFAULT_CURRENCY}
              provider={plan.provider} // Same as above
              selectedPlanData={selectedPlanData} // Pass the full object
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

