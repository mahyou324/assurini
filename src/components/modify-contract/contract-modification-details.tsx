
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO, isValid, differenceInMilliseconds, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, Edit3, DollarSign, ShieldCheck, FileText, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import type { UserContract, ModifiableContractFields, InsurancePlan, RecommendInsurancePlanInput } from "@/lib/types";
import { DEFAULT_CURRENCY, MODIFICATION_FEE, ROUTES, USER_CONTRACTS_STORAGE_KEY } from "@/lib/constants";
import { getInsuranceRecommendationAction } from "@/app/actions/insurance-actions";
import { COMMON_COUNTRIES } from "@/lib/countries";

interface ContractModificationDetailsProps {
  contract: UserContract;
  onModificationSuccess: () => void;
}

const modificationSchema = z.object({
  startDate: z.date({ required_error: "La nouvelle date de début est requise." }),
  endDate: z.date({ required_error: "La nouvelle date de fin est requise." }),
  destination: z.string().min(2, { message: "La nouvelle destination est requise." }),
}).refine(data => data.endDate >= data.startDate, {
  message: "La date de fin ne peut pas être antérieure à la date de début.",
  path: ["endDate"],
});

export function ContractModificationDetails({ contract, onModificationSuccess }: ContractModificationDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [canModify, setCanModify] = useState(false);
  const [modificationDisabledReason, setModificationDisabledReason] = useState<string | null>(null);
  
  const [newPlanRecommendation, setNewPlanRecommendation] = useState<InsurancePlan | null>(null);
  const [calculatedPaymentDue, setCalculatedPaymentDue] = useState<number | null>(null);
  const [modificationCostBreakdown, setModificationCostBreakdown] = useState<{
    fixedFee: number;
    additionalDaysSurcharge: number;
    totalDue: number;
    newBasePlanPrice: number;
    additionalDays: number;
    dailyRateForNewPlan?: number;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const initialStartDate = isValid(parseISO(contract.startDate)) ? parseISO(contract.startDate) : new Date();
  const initialEndDate = isValid(parseISO(contract.endDate)) ? parseISO(contract.endDate) : new Date();

  const form = useForm<ModifiableContractFields>({
    resolver: zodResolver(modificationSchema),
    defaultValues: {
      startDate: initialStartDate,
      endDate: initialEndDate,
      destination: contract.destination,
    },
  });

  useEffect(() => {
    const contractStartDateObj = parseISO(contract.startDate);
    if (!isValid(contractStartDateObj)) {
      setModificationDisabledReason("Date de début du contrat actuelle invalide.");
      setCanModify(false);
      return;
    }

    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const now = new Date();
    
    if (differenceInMilliseconds(contractStartDateObj, now) < fortyEightHoursInMs) {
      setModificationDisabledReason("La modification n'est possible que jusqu'à 48 heures avant le début du contrat.");
      setCanModify(false);
    } else {
      setModificationDisabledReason(null);
      setCanModify(true);
    }
  }, [contract.startDate]);

  const handleCalculateModificationCost = async (values: ModifiableContractFields) => {
    setIsCalculatingCost(true);
    setAiError(null);
    setNewPlanRecommendation(null);
    setCalculatedPaymentDue(null);
    setModificationCostBreakdown(null); 

    const inputForAI: RecommendInsurancePlanInput = {
      destination: values.destination,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      endDate: format(values.endDate, "yyyy-MM-dd"),
      travelerCount: contract.travelerCount,
      travelerAge: contract.travelerAge,
      preExistingConditions: contract.preExistingConditions,
      tripPurpose: contract.tripPurpose,
      budget: contract.originalBudget, 
    };

    const result = await getInsuranceRecommendationAction(inputForAI);
    setIsCalculatingCost(false);

    if (result && "planName" in result) {
      const newAiPlanPrice = result.price;
      setNewPlanRecommendation(result);
      
      const originalContractStartDate = parseISO(contract.startDate);
      const originalContractEndDate = parseISO(contract.endDate);
      
      let originalDurationInDays = -1; 
      if (isValid(originalContractStartDate) && isValid(originalContractEndDate)) {
         originalDurationInDays = differenceInDays(originalContractEndDate, originalContractStartDate) + 1;
      } else {
        setAiError("Les dates du contrat original sont invalides. Modification impossible.");
        toast({ title: "Erreur de Dates", description: "Dates du contrat original invalides.", variant: "destructive"});
        return;
      }

      const newProposedStartDate = values.startDate;
      const newProposedEndDate = values.endDate;
      const newProposedDurationInDays = differenceInDays(newProposedEndDate, newProposedStartDate) + 1;

      let additionalDaysSurcharge = 0;
      const additionalDays = newProposedDurationInDays - originalDurationInDays;
      let dailyRateForNewPlan: number | undefined = undefined;

      if (additionalDays > 0) {
        if (newProposedDurationInDays > 0) {
          dailyRateForNewPlan = newAiPlanPrice / newProposedDurationInDays;
          additionalDaysSurcharge = additionalDays * dailyRateForNewPlan;
        } else {
          // This case should ideally not happen if form validation is correct (endDate >= startDate)
          // but as a fallback, consider it as a significant change without a clear daily rate.
          // For now, it will result in additionalDaysSurcharge = 0 if newProposedDurationInDays is 0 or less.
          // A more robust handling might involve a specific penalty or preventing this state.
          console.warn("New proposed duration is zero or negative, cannot calculate daily rate for surcharge.");
        }
      }

      const totalDueForModification = MODIFICATION_FEE + additionalDaysSurcharge;
      
      setCalculatedPaymentDue(totalDueForModification);
      setModificationCostBreakdown({
        fixedFee: MODIFICATION_FEE,
        additionalDaysSurcharge,
        totalDue: totalDueForModification,
        newBasePlanPrice: newAiPlanPrice,
        additionalDays: additionalDays > 0 ? additionalDays : 0,
        dailyRateForNewPlan: dailyRateForNewPlan
      });

      let toastDescription = `Montant total à payer pour cette modification : ${totalDueForModification.toFixed(2)} ${DEFAULT_CURRENCY}. `;
      toastDescription += `Nouveau prix total du plan : ${newAiPlanPrice.toFixed(2)} ${DEFAULT_CURRENCY}.`;

      toast({ 
        title: "Coût de modification calculé", 
        description: toastDescription, 
        duration: 10000
      });

    } else if (result && "error" in result) {
      setAiError(result.error || "Erreur lors du calcul du coût.");
      toast({ title: "Erreur de calcul", description: result.error, variant: "destructive" });
    } else {
      setAiError("Réponse inattendue du service de calcul.");
      toast({ title: "Erreur", description: "Réponse inattendue du service de calcul.", variant: "destructive" });
    }
  };


  const handleConfirmAndPay = async () => {
    if (!newPlanRecommendation || calculatedPaymentDue === null || !modificationCostBreakdown) {
      toast({ title: "Erreur", description: "Veuillez d'abord calculer le coût de modification.", variant: "destructive"});
      return;
    }
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 1500)); 

    try {
      const storedContractsString = localStorage.getItem(USER_CONTRACTS_STORAGE_KEY);
      if (!storedContractsString) throw new Error("Base de données des contrats non trouvée.");
      let storedContracts: UserContract[] = JSON.parse(storedContractsString);
      
      const contractIndex = storedContracts.findIndex(c => c.policyNumber === contract.policyNumber);
      if (contractIndex === -1) throw new Error("Contrat non trouvé pour la mise à jour.");

      const modifiedValues = form.getValues();

      storedContracts[contractIndex] = {
        ...storedContracts[contractIndex], 
        startDate: format(modifiedValues.startDate, "yyyy-MM-dd"),
        endDate: format(modifiedValues.endDate, "yyyy-MM-dd"),
        destination: modifiedValues.destination,
        planName: newPlanRecommendation.planName,
        provider: newPlanRecommendation.provider,
        originalPrice: newPlanRecommendation.price.toString(), 
        coverageDetails: newPlanRecommendation.coverageDetails,
        policyDocumentLink: newPlanRecommendation.policyDocumentLink,
        lastModifiedDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"), 
      };

      localStorage.setItem(USER_CONTRACTS_STORAGE_KEY, JSON.stringify(storedContracts));
      
      toast({
        title: "Modification Réussie !",
        description: `Le contrat ${contract.policyNumber} a été mis à jour. Montant payé: ${calculatedPaymentDue.toFixed(2)} ${DEFAULT_CURRENCY}.`,
      });
      
      router.push(`${ROUTES.MODIFY_CONTRACT_SUCCESS}?policyNumber=${contract.policyNumber}&actualModificationCostPaid=${calculatedPaymentDue.toFixed(2)}`);
      onModificationSuccess();

    } catch (error: any) {
      console.error("Error modifying contract:", error);
      toast({ title: "Erreur de Modification", description: error.message || "Erreur lors de la modification.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><ShieldCheck className="mr-2"/>Contrat Actuel: {contract.policyNumber}</CardTitle>
          <CardDescription>Plan: {contract.planName} par {contract.provider}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Assuré:</strong> {contract.userFullName} ({contract.userEmail})</p>
          <p><strong>N° Passeport:</strong> {contract.userPassportNumber || "N/A"}</p>
          <p><strong>Destination Actuelle:</strong> {contract.destination}</p>
          <p><strong>Dates Actuelles:</strong> Du {isValid(parseISO(contract.startDate)) ? format(parseISO(contract.startDate), "dd/MM/yyyy", { locale: fr }) : "Date invalide"} au {isValid(parseISO(contract.endDate)) ? format(parseISO(contract.endDate), "dd/MM/yyyy", { locale: fr }) : "Date invalide"}</p>
          <p><strong>Prix Actuel du Plan:</strong> {parseFloat(contract.originalPrice).toFixed(2)} {contract.currency}</p>
          <p><strong>Date d'Émission:</strong> {isValid(parseISO(contract.issueDate)) ? format(parseISO(contract.issueDate), "dd/MM/yyyy", { locale: fr }): "Date invalide"}</p>
          {contract.lastModifiedDate && <p><strong>Dernière Modification:</strong> {isValid(parseISO(contract.lastModifiedDate)) ? format(parseISO(contract.lastModifiedDate), "dd/MM/yyyy HH:mm", { locale: fr }) : "Date invalide"}</p>}
        </CardContent>
      </Card>

      <Separator />

       {!canModify && modificationDisabledReason && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Modification Non Disponible</AlertTitle>
          <AlertDescription>{modificationDisabledReason}</AlertDescription>
        </Alert>
      )}

      <h3 className="text-xl font-semibold text-primary flex items-center"><Edit3 className="mr-2"/>Modifier les Détails du Voyage</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCalculateModificationCost)} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nouvelle Date de Début</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                          disabled={!canModify || isCalculatingCost || isProcessing}
                        >
                          {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setNewPlanRecommendation(null); setCalculatedPaymentDue(null); setModificationCostBreakdown(null);}}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || !canModify || isCalculatingCost || isProcessing}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nouvelle Date de Fin</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                           disabled={!canModify || isCalculatingCost || isProcessing}
                        >
                          {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisissez une date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => { field.onChange(date); setNewPlanRecommendation(null); setCalculatedPaymentDue(null); setModificationCostBreakdown(null);}}
                        disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0))) || !canModify || isCalculatingCost || isProcessing}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouvelle Destination</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Madrid, Espagne" {...field} 
                    disabled={!canModify || isCalculatingCost || isProcessing}
                    onChange={(e) => { field.onChange(e); setNewPlanRecommendation(null); setCalculatedPaymentDue(null); setModificationCostBreakdown(null);}}
                    list="country-suggestions-modify"
                  />
                </FormControl>
                <datalist id="country-suggestions-modify">
                  {COMMON_COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" variant="outline" disabled={!canModify || isCalculatingCost || isProcessing || !!newPlanRecommendation}>
            {isCalculatingCost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {newPlanRecommendation ? "Coût calculé (Modifiez les critères pour recalculer)" : "Calculer les Frais de Modification"}
          </Button>

          {aiError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur de Calcul</AlertTitle>
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}

          {modificationCostBreakdown && newPlanRecommendation && (
            <Card className="mt-4 bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-700 flex items-center"><CheckCircle className="mr-2"/>Récapitulatif des Frais de Modification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-green-600">
                <p><strong>Nouveau Plan Suggéré:</strong> {newPlanRecommendation.planName} par {newPlanRecommendation.provider}</p>
                <p><strong>Nouveau Prix Total du Plan:</strong> {modificationCostBreakdown.newBasePlanPrice.toFixed(2)} {DEFAULT_CURRENCY}</p>
                <Separator className="bg-green-200"/>
                <div className="space-y-1">
                    <p>Frais de Modification Fixes: <span className="font-semibold">{modificationCostBreakdown.fixedFee.toFixed(2)} {DEFAULT_CURRENCY}</span></p>
                    {modificationCostBreakdown.additionalDaysSurcharge > 0 && modificationCostBreakdown.additionalDays > 0 && modificationCostBreakdown.dailyRateForNewPlan !== undefined && (
                         <p className="hidden">
                           Surcharge pour {modificationCostBreakdown.additionalDays} Jour(s) Supplémentaire(s) (à {modificationCostBreakdown.dailyRateForNewPlan.toFixed(2)} {DEFAULT_CURRENCY}/jour): 
                           <span className="font-semibold"> {modificationCostBreakdown.additionalDaysSurcharge.toFixed(2)} {DEFAULT_CURRENCY}</span>
                         </p>
                    )}
                </div>
                 <Separator className="bg-green-200"/>
                <p className="font-bold text-md text-green-700">MONTANT TOTAL À PAYER: {modificationCostBreakdown.totalDue.toFixed(2)} {DEFAULT_CURRENCY}</p>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>

      {newPlanRecommendation && calculatedPaymentDue !== null && modificationCostBreakdown &&(
        <Button onClick={handleConfirmAndPay} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-6" disabled={isProcessing || isCalculatingCost || !canModify}>
          {isProcessing ? (
            <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement en cours... </>
          ) : (
            <> <FileText className="mr-2 h-4 w-4" /> Confirmer la Modification et Payer {calculatedPaymentDue.toFixed(2)} {DEFAULT_CURRENCY} </>
          )}
        </Button>
      )}
       <Alert className="mt-6">
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Information sur les Frais de Modification</AlertTitle>
          <AlertDescription>
            Des frais de modification fixes de <strong>{MODIFICATION_FEE} {DEFAULT_CURRENCY}</strong> s'appliquent à toute modification.
            <br />Si le nombre de jours assurés augmente, une surcharge pro-rata (basée sur le tarif journalier du nouveau plan) sera ajoutée au montant total à payer pour la modification.
            Le nouveau prix total du plan reflétera la nouvelle destination et durée.
          </AlertDescription>
        </Alert>
    </div>
  );
}

