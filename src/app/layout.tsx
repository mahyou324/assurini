import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ClientProviders } from '@/components/providers/client-providers';
import { ChatbotWidget } from '@/components/chatbot/chatbot-widget'; // Ajout du widget Chatbot
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${GeistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <ClientProviders>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <ChatbotWidget /> {/* Ajout du widget Chatbot ici */}
        </ClientProviders>
      </body>
    </html>
  );
}
