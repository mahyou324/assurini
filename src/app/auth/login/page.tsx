import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Connexion | ${APP_NAME}`,
  description: `Connectez-vous à votre compte ${APP_NAME}.`,
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
