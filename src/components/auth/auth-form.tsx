"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { MockUser } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "signup";
}

const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(1, { message: "Le mot de passe est requis." }),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Le nom complet est requis." }),
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
  passportNumber: z.string().min(6, { message: "Le numéro de passeport doit comporter au moins 6 caractères."}).optional().or(z.literal('')),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function AuthForm({ mode }: AuthFormProps) {
  const { login } = useMockAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = mode === "login" ? loginSchema : signupSchema;
  type FormValues = LoginFormValues | SignupFormValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === "login"
      ? { email: "", password: "" }
      : { fullName: "", email: "", password: "", passportNumber: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userData: MockUser = {
      email: values.email,
      fullName: (values as SignupFormValues).fullName, // Only for signup
      passportNumber: (values as SignupFormValues).passportNumber || undefined, // Only for signup
    };

    login(userData); // Store user in mock auth

    toast({
      title: mode === "login" ? "Connexion réussie !" : "Inscription réussie !",
      description: mode === "login" ? `Bienvenue de retour, ${userData.email}` : `Bienvenue sur ${APP_NAME}, ${userData.fullName || userData.email} !`,
    });
    router.push(ROUTES.PROFILE); // Redirect to profile or dashboard
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {mode === "login" ? "Se Connecter" : "Créer un Compte"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? `Accédez à votre espace ${APP_NAME}.`
              : `Rejoignez ${APP_NAME} pour assurer vos voyages.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mode === "signup" && (
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
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="exemple@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de Passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "signup" && (
                 <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de Passeport</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre numéro de passeport (Optionnel)" {...field} />
                      </FormControl>
                       <FormDescription>
                        Requis pour la souscription à certaines polices.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Se Connecter" : "S'inscrire"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <Link href={ROUTES.SIGNUP} className="font-medium text-primary hover:underline">
                  S'inscrire
                </Link>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
