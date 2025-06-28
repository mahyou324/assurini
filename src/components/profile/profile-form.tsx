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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useToast } from "@/hooks/use-toast";
import type { MockUser } from "@/lib/types";
import { APP_NAME } from "@/lib/constants"; // Import APP_NAME
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const profileSchema = z.object({
  email: z.string().email(), // Readonly
  fullName: z.string().min(2, { message: "Le nom complet est requis." }),
  passportNumber: z.string().min(6, { message: "Le numéro de passeport doit comporter au moins 6 caractères." }).optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')), // Add more specific validation if needed
  address: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateProfile, isLoading: authIsLoading } = useMockAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      fullName: "",
      passportNumber: "",
      phoneNumber: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        fullName: user.fullName || "",
        passportNumber: user.passportNumber || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user, form]);

  if (authIsLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    // This should ideally be handled by route protection, but good for robustness
    return <p className="text-center text-destructive">Veuillez vous connecter pour voir votre profil.</p>;
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUserData: Partial<MockUser> = {
      fullName: values.fullName,
      passportNumber: values.passportNumber || undefined,
      phoneNumber: values.phoneNumber || undefined,
      address: values.address || undefined,
    };
    
    updateProfile(updatedUserData);
    toast({
      title: "Profil mis à jour !",
      description: "Vos informations ont été enregistrées avec succès.",
    });
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse E-mail</FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-muted/50 cursor-not-allowed" />
              </FormControl>
              <FormDescription>
                Votre adresse e-mail ne peut pas être modifiée.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom Complet</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom et prénom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passportNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de Passeport</FormLabel>
              <FormControl>
                <Input placeholder="Votre numéro de passeport" {...field} />
              </FormControl>
              <FormDescription>
                Ce numéro est utilisé pour la validation de votre identité.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de Téléphone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+213 XX XX XX XX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse Postale</FormLabel>
              <FormControl>
                <Input placeholder="Votre adresse complète" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  );
}
