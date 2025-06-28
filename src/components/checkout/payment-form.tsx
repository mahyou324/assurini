
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { APP_NAME, ROUTES, USER_CONTRACTS_STORAGE_KEY, INSURANCE_POLICY_NUMBER_PREFIX } from "@/lib/constants";
import type { UserContract, SelectedPlanWithTripDetails } from "@/lib/types";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { format } from "date-fns";

const paymentSchema = z.object({
  paymentMethod: z.enum(["cib", "edahabia", "bank_transfer", "baridi_mob"], {
    required_error: "Veuillez sélectionner une méthode de paiement.",
  }),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les termes et conditions pour continuer."
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  planName: string;
  price: number;
  currency: string;
  provider: string;
  selectedPlanData: SelectedPlanWithTripDetails;
}

function generatePolicyNumber(): string {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  const timestampPart = Date.now().toString().slice(-4);
  return `${INSURANCE_POLICY_NUMBER_PREFIX}-${timestampPart}-${randomNumber}`;
}

export function PaymentForm({ 
  selectedPlanData
}: PaymentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useMockAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const { plan: aiPlan, userInput } = selectedPlanData;
  const { currency, price, planName } = aiPlan; // Destructure from aiPlan for clarity

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "cib",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous connecter pour finaliser la souscription.",
        variant: "destructive",
      });
      setIsProcessing(false);
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!selectedPlanData || !userInput || !aiPlan) {
        toast({
            title: "Erreur de données du plan",
            description: "Les informations du plan sélectionné sont incomplètes. Veuillez recommencer.",
            variant: "destructive",
        });
        setIsProcessing(false);
        router.push(ROUTES.GET_QUOTE);
        return;
    }
    
    const policyNumber = generatePolicyNumber();
    const newContract: UserContract = {
      policyNumber,
      planName: aiPlan.planName,
      provider: aiPlan.provider,
      originalPrice: aiPlan.price.toString(),
      currency,
      
      startDate: userInput.startDate,
      endDate: userInput.endDate,
      destination: userInput.destination,
      travelerCount: userInput.travelerCount,
      travelerAge: userInput.travelerAge,
      preExistingConditions: userInput.preExistingConditions,
      tripPurpose: userInput.tripPurpose,
      originalBudget: userInput.budget,

      coverageDetails: aiPlan.coverageDetails,
      policyDocumentLink: aiPlan.policyDocumentLink,
      
      userEmail: user.email,
      userFullName: user.fullName || user.email,
      userPassportNumber: user.passportNumber,
      issueDate: format(new Date(), "yyyy-MM-dd"),
    };

    try {
      const existingContractsString = localStorage.getItem(USER_CONTRACTS_STORAGE_KEY);
      const existingContracts: UserContract[] = existingContractsString ? JSON.parse(existingContractsString) : [];
      existingContracts.push(newContract);
      localStorage.setItem(USER_CONTRACTS_STORAGE_KEY, JSON.stringify(existingContracts));
    } catch (error) {
      console.error("Failed to save contract to localStorage", error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder votre contrat. Veuillez réessayer.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }
    
    toast({
      title: "Paiement Réussi !",
      description: `Votre souscription au plan "${aiPlan.planName}" a été confirmée.`,
      duration: 5000,
    });
    
    localStorage.removeItem('selectedInsurancePlan');

    const queryParams = new URLSearchParams({
      policyNumber: policyNumber,
    });

    router.push(`${ROUTES.POLICY_SUCCESS}?${queryParams.toString()}`);
    setIsProcessing(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Choisissez votre méthode de paiement :</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2 md:flex-row md:flex-wrap md:space-y-0 md:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="cib" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Carte CIB
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="edahabia" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Carte EDAHABIA
                    </FormLabel>
                  </FormItem>
                   <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="baridi_mob" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Baridi Mob
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <FormControl>
                      <RadioGroupItem value="bank_transfer" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Virement Bancaire
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("paymentMethod") === "cib" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground">Veuillez noter : Ceci est une simulation. N'entrez pas de vraies informations de carte.</p>
            <Input placeholder="Numéro de Carte CIB (simulation)" disabled />
            <div className="flex gap-4">
              <Input placeholder="Date d'Expiration (MM/AA)" className="w-1/2" disabled />
              <Input placeholder="CVV (simulation)" className="w-1/2" disabled />
            </div>
          </div>
        )}
        {form.watch("paymentMethod") === "edahabia" && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
             <p className="text-sm text-muted-foreground">Veuillez noter : Ceci est une simulation. N'entrez pas de vraies informations de carte.</p>
            <Input placeholder="Numéro de Carte EDAHABIA (simulation)" disabled />
             <Input placeholder="Code PIN (simulation)" type="password" disabled />
          </div>
        )}
        {form.watch("paymentMethod") === "baridi_mob" && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium mb-2">Instructions pour Baridi Mob (Simulation)</h4>
            <p className="text-sm text-muted-foreground">
              Pour payer avec Baridi Mob (simulation) :<br />
              1. Ouvrez votre application Baridi Mob.<br />
              2. Recherchez l'option de paiement marchand ou scannez un QR code (simulé).<br />
              3. Entrez le montant de <strong>{price} {currency}</strong>.<br />
              4. Confirmez le paiement sur votre application.<br />
              Le marchand est <strong>{APP_NAME}</strong>.
            </p>
            <p className="text-xs mt-2">Votre police sera activée après confirmation du paiement (simulation instantanée).</p>
          </div>
        )}
        {form.watch("paymentMethod") === "bank_transfer" && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium mb-2">Instructions pour le Virement Bancaire</h4>
            <p className="text-sm text-muted-foreground">
              Veuillez effectuer un virement de <strong>{price} {currency}</strong> au compte suivant :<br />
              <strong>Banque:</strong> Banque Fictive d'Algérie<br />
              <strong>RIB:</strong> 001 00203 0300400500 06<br />
              <strong>Bénéficiaire:</strong> {APP_NAME}<br />
              <strong>Motif:</strong> Souscription Assurance Voyage - {planName}
            </p>
            <p className="text-xs mt-2">Votre police sera activée après confirmation de la réception des fonds (simulation instantanée).</p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                 />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  J'accepte les <a href={aiPlan.policyDocumentLink || "/terms"} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">termes et conditions</a> de la police d'assurance.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Payer {price} {currency} en toute sécurité
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

