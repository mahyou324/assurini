
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { UserCircle, LogIn, LogOut, ShieldCheck } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMockAuth } from '@/hooks/use-mock-auth';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout, isLoading } = useMockAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.HOME);
  };

  const getInitials = (name?: string) => {
    if (!name) return APP_NAME.substring(0,2).toUpperCase(); 
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
 <Link href={ROUTES.HOME} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="logo de assurance voyage" width={32} height={32} className="h-8 w-auto" />
          <h1 className="text-xl font-bold tracking-tight text-accent">{APP_NAME}</h1>
        </Link>
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <Link href={ROUTES.HOME} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Accueil
          </Link>
          <Link href={ROUTES.GET_QUOTE} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Obtenir un Devis
          </Link>
          {user && (
            <Link href={ROUTES.PROFILE} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Mon Profil
            </Link>
          )}
           <Link href={ROUTES.MODIFY_CONTRACT} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Modifier Contrat
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {isLoading ? (
             <div className="h-8 w-20 bg-muted rounded-md animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.fullName || user.email} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName || 'Utilisateur'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.PROFILE}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>
                  <LogIn className="mr-2 h-4 w-4" /> Se connecter
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                 <Link href={ROUTES.SIGNUP}>S'inscrire</Link>
              </Button>
            </>
          )}
           {/* Mobile Menu Trigger - Future Enhancement */}
        </div>
      </div>
    </header>
  );
}
