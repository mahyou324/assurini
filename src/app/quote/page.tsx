"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TripDetailsForm } from "@/components/quote/trip-details-form";
import { PlanCard } from "@/components/quote/plan-card";
import type { SelectedPlanWithTripDetails } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// No server-side metadata for client-rendered conditional content

export default function QuotePage() {
  const [recommendedPlanData, setRecommendedPlanData] = useState<SelectedPlanWithTripDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handlePlanRecommended = (data: SelectedPlanWithTripDetails) => {
    setRecommendedPlanData(data);
    setError(null);
    toast({
      title: "Recommandation Prête !",
      description: "Nous avons trouvé un plan adapté à vos besoins.",
    });
  };

  const handleFormError = (errorMessage: string) => {
    setError(errorMessage);
    setRecommendedPlanData(null); // Clear previous plan if error
  };

  const handleSelectPlan = (selectedData: SelectedPlanWithTripDetails) => {
    try {
      localStorage.setItem('selectedInsurancePlan', JSON.stringify(selectedData));
      router.push(ROUTES.CHECKOUT);
    } catch (e) {
      console.error("Failed to save plan to localStorage", e);
      toast({
        title: "Erreur",
        description: "Impossible de procéder au paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const resetFormAndPlan = () => {
    setRecommendedPlanData(null);
    setError(null);
    // Potentially clear form fields if TripDetailsForm exposes a reset method or re-mounts
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            {recommendedPlanData ? "Votre Plan d'Assurance Recommandé" : `Obtenez votre Devis ${APP_NAME}`}
          </CardTitle>
          <CardDescription>
            {recommendedPlanData 
              ? "Voici le plan que nous avons sélectionné pour vous. Vous pouvez consulter les détails et procéder au paiement."
              : "Remplissez les détails de votre voyage ci-dessous pour recevoir une recommandation personnalisée."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur de Recommandation</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!recommendedPlanData ? (
            <TripDetailsForm onPlanRecommended={handlePlanRecommended} onError={handleFormError} />
          ) : (
            <div className="space-y-6">
              <PlanCard 
                plan={recommendedPlanData.plan} 
                onSelectPlan={() => handleSelectPlan(recommendedPlanData)} 
              />
              <Button variant="outline" onClick={resetFormAndPlan} className="w-full md:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Modifier les informations du voyage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
