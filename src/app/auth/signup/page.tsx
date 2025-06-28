import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Inscription | ${APP_NAME}`,
  description: `Créez votre compte ${APP_NAME} pour assurer vos voyages.`,
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
