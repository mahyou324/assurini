
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Users, ShieldCheck } from 'lucide-react'; 
import { APP_NAME, ROUTES } from '@/lib/constants';

export default function HomePage() {
  const features = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Couverture Complète",
      description: "Des plans d'assurance voyage adaptés à tous vos besoins, où que vous alliez.",
    },
    {
      icon: <Plane className="h-8 w-8 text-primary" />,
      title: "Assistance Mondiale 24/7",
      description: "Une assistance disponible à tout moment pour vous aider en cas d'imprévu.",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Pour Tous les Algériens",
      description: "Conçu spécialement pour les résidents algériens, avec des services localisés.",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative text-primary-foreground py-20 md:py-32 rounded-lg overflow-hidden shadow-xl">
        <Image
          src="/airplane_hero_background.jpg" 
          alt="Arrière-plan de voyage avec un avion"
          fill
          style={{objectFit: "cover"}}
          data-ai-hint="travel airplane"
          priority={true}
        />
        <div className="absolute inset-0 bg-black opacity-30 z-0"></div> {/* Overlay for readability */}
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            Voyagez l'esprit tranquille avec <span className="text-accent">{APP_NAME}</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            L'assurance voyage simple, rapide et fiable pour tous vos déplacements depuis l'Algérie.
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
            <Link href={ROUTES.GET_QUOTE}>Obtenir un Devis Gratuit</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-primary">Pourquoi nous choisir ?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground flex-grow">
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-secondary text-secondary-foreground py-16 rounded-lg shadow-md">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold w-12 h-12 flex items-center justify-center">1</div>
              <h3 className="text-xl font-semibold mb-2">Décrivez votre voyage</h3>
              <p className="text-sm">Entrez les détails de votre destination, dates et voyageurs.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold w-12 h-12 flex items-center justify-center">2</div>
              <h3 className="text-xl font-semibold mb-2">Recevez une recommandation</h3>
              <p className="text-sm">Notre IA vous propose le plan le plus adapté à vos besoins.</p>
            </div>
            <div className="flex flex-col items-center">
             <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4 text-2xl font-bold w-12 h-12 flex items-center justify-center">3</div>
              <h3 className="text-xl font-semibold mb-2">Souscrivez en ligne</h3>
              <p className="text-sm">Payez de manière sécurisée et recevez votre police instantanément.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 text-center py-16">
        <h2 className="text-3xl font-bold mb-6">Prêt à partir en toute sécurité ou besoin de modifier un contrat ?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Ne laissez pas les imprévus gâcher votre voyage. Obtenez votre devis personnalisé ou modifiez votre contrat existant en quelques minutes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
            <Link href={ROUTES.GET_QUOTE}>Je simule mon tarif</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 shadow-md transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/10">
            <Link href={ROUTES.MODIFY_CONTRACT}>Modifier mon Contrat</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
