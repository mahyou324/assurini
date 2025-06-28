
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
import { Loader2, Search } from "lucide-react";
import type { UserContract } from "@/lib/types";
import { USER_CONTRACTS_STORAGE_KEY } from "@/lib/constants";
import { useMockAuth } from "@/hooks/use-mock-auth";

const findContractSchema = z.object({
  policyNumber: z.string().min(1, { message: "Le numéro de police est requis." }),
});

type FindContractFormValues = z.infer<typeof findContractSchema>;

interface FindContractFormProps {
  onContractFound: (contract: UserContract) => void;
  onContractNotFound: (message: string) => void;
  onSearchStart: () => void;
  isLoading: boolean;
}

export function FindContractForm({ 
  onContractFound, 
  onContractNotFound,
  onSearchStart,
  isLoading 
}: FindContractFormProps) {
  const { user } = useMockAuth();

  const form = useForm<FindContractFormValues>({
    resolver: zodResolver(findContractSchema),
    defaultValues: {
      policyNumber: "",
    },
  });

  const onSubmit = async (values: FindContractFormValues) => {
    onSearchStart();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!user) {
      onContractNotFound("Veuillez vous connecter pour rechercher un contrat.");
      return;
    }

    try {
      const storedContractsString = localStorage.getItem(USER_CONTRACTS_STORAGE_KEY);
      if (!storedContractsString) {
        onContractNotFound("Aucun contrat trouvé. Veuillez vérifier le numéro de police ou souscrire une assurance.");
        return;
      }
      const storedContracts: UserContract[] = JSON.parse(storedContractsString);
      const foundContract = storedContracts.find(
        c => c.policyNumber === values.policyNumber.trim() && c.userEmail === user.email
      );

      if (foundContract) {
        onContractFound(foundContract);
      } else {
        onContractNotFound("Contrat non trouvé pour ce numéro de police et cet utilisateur. Vérifiez les informations ou assurez-vous d'être connecté avec le bon compte.");
      }
    } catch (error) {
      console.error("Error searching for contract:", error);
      onContractNotFound("Une erreur est survenue lors de la recherche du contrat.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="policyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de Police</FormLabel>
              <FormControl>
                <Input placeholder="Ex: DZVA-XXXX-XXXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recherche en cours...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Rechercher le Contrat
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
