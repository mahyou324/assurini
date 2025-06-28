
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Edit, ShieldCheck } from 'lucide-react'; 
import { APP_NAME, ROUTES } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href={ROUTES.HOME} className="flex items-center gap-2 mb-2">
              <Image src="/logo.png" alt="logo de assurance voyage" width={28} height={28} className="h-7 w-auto" />
              <h2 className="text-lg font-semibold">{APP_NAME}</h2>
            </Link>
            <p className="text-sm">
              Votre partenaire de confiance pour une assurance voyage sereine et adaptée à vos besoins en Algérie.
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.HOME} className="hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link href={ROUTES.GET_QUOTE} className="hover:text-primary transition-colors">Obtenir un Devis</Link></li>
              <li><Link href={ROUTES.MODIFY_CONTRACT} className="hover:text-primary transition-colors flex items-center"><Edit size={16} className="mr-1.5"/> Modifier un Contrat</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Termes et Conditions</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Politique de Confidentialité</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3">Suivez-nous</h3>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="hover:text-primary transition-colors"><Facebook size={20} /></Link>
              <Link href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter size={20} /></Link>
              <Link href="#" aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram size={20} /></Link>
            </div>
            <h3 className="text-md font-semibold mt-6 mb-3">Contactez-nous</h3>
            <p className="text-sm">support@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.dz</p>
            <p className="text-sm">+213 (0)XX XX XX XX</p>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center text-sm">
          <p>&copy; {currentYear} {APP_NAME}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
