
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { TRIP_PURPOSES, DEFAULT_CURRENCY } from "@/lib/constants";
import type { TripDetailsFormData, SelectedPlanWithTripDetails } from "@/lib/types";
import { useState } from "react";
import { getInsuranceRecommendationAction } from "@/app/actions/insurance-actions";
import type { RecommendInsurancePlanInput } from "@/ai/flows/recommend-insurance-plan";
import { COMMON_COUNTRIES } from "@/lib/countries";

const BUDGET_OPTIONS = [
  { value: 150000, label: `150,000 ${DEFAULT_CURRENCY}` },
  { value: 300000, label: `300,000 ${DEFAULT_CURRENCY}` },
  { value: 600000, label: `600,000 ${DEFAULT_CURRENCY}` },
];

const tripDetailsSchema = z.object({
  destination: z.string().min(2, { message: "La destination est requise." }),
  startDate: z.date({ required_error: "La date de début est requise." }),
  endDate: z.date({ required_error: "La date de fin est requise." }),
  travelerCount: z.coerce.number().min(1, { message: "Au moins un voyageur est requis." }).int(),
  travelerAge: z.coerce.number().min(1, { message: "L'âge du voyageur principal est requis." }).max(100).int(),
  preExistingConditions: z.string().optional(),
  tripPurpose: z.string({ required_error: "Le motif du voyage est requis." }),
  budget: z.coerce
    .number({required_error: "Le budget est requis."})
    .refine(value => BUDGET_OPTIONS.map(opt => opt.value).includes(value), {
      message: "Veuillez sélectionner un budget valide dans la liste.",
    }),
}).refine(data => data.endDate >= data.startDate, {
  message: "La date de fin ne peut pas être antérieure à la date de début.",
  path: ["endDate"],
});

interface TripDetailsFormProps {
  onPlanRecommended: (data: SelectedPlanWithTripDetails) => void;
  onError: (errorMessage: string) => void;
}

export function TripDetailsForm({ onPlanRecommended, onError }: TripDetailsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TripDetailsFormData>({
    resolver: zodResolver(tripDetailsSchema),
    defaultValues: {
      destination: "",
      travelerCount: 1,
      travelerAge: 30,
      preExistingConditions: "",
      tripPurpose: TRIP_PURPOSES[0].value,
      budget: BUDGET_OPTIONS[0].value,
    },
  });

  const onSubmit = async (values: TripDetailsFormData) => {
    setIsLoading(true);
    onError(""); // Clear previous errors

    const inputForAI: RecommendInsurancePlanInput = {
      ...values,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      endDate: format(values.endDate, "yyyy-MM-dd"),
      preExistingConditions: values.preExistingConditions || "Aucune", 
    };
    
    const result = await getInsuranceRecommendationAction(inputForAI);

    if (result && "planName" in result) {
      const planWithTripDetails: SelectedPlanWithTripDetails = {
        plan: result,
        userInput: { // Capture all form values for localStorage
          destination: values.destination,
          startDate: format(values.startDate, "yyyy-MM-dd"),
          endDate: format(values.endDate, "yyyy-MM-dd"),
          travelerCount: values.travelerCount,
          travelerAge: values.travelerAge,
          preExistingConditions: values.preExistingConditions || "Aucune",
          tripPurpose: values.tripPurpose,
          budget: values.budget,
        }
      };
      onPlanRecommended(planWithTripDetails);
    } else if (result && "error" in result) {
      console.error("AI Error:", result.error, result.details);
      onError(result.error || "Une erreur inconnue est survenue lors de la recommandation.");
    } else {
      onError("Réponse inattendue du service de recommandation.");
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Paris, France" {...field} list="country-suggestions" />
                </FormControl>
                <datalist id="country-suggestions">
                  {COMMON_COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tripPurpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif du Voyage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le motif" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRIP_PURPOSES.map(purpose => (
                      <SelectItem key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de Début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisissez une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
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
                <FormLabel>Date de Fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisissez une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
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
        
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="travelerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de Voyageurs</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="travelerAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Âge du Voyageur Principal</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Assurance</FormLabel>
                 <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Sélectionnez votre budget (${DEFAULT_CURRENCY})`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUDGET_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choisissez une option budgétaire.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preExistingConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conditions Médicales Préexistantes (Optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Listez les conditions médicales pertinentes (ex: Diabète, Asthme). Si aucune, laissez vide ou écrivez 'Aucune'."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Ces informations nous aident à trouver la meilleure couverture pour vous.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recherche en cours...
            </>
          ) : "Obtenir ma Recommandation"}
        </Button>
      </form>
    </Form>
  );
}

