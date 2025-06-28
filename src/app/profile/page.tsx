"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { useMockAuth } from "@/hooks/use-mock-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

// No server-side metadata for client-rendered conditional content
// export const metadata: Metadata = { ... }

export default function ProfilePage() {
  const { user, isLoading } = useMockAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Mon Profil</CardTitle>
          <CardDescription>
            Gérez vos informations personnelles et préférences pour {APP_NAME}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
