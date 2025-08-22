import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Controlla se l'utente ha già inserito la password corretta
  const isAuthenticated = request.cookies.get('auth')?.value === 'fabiodavide';
  
  // Se è già autenticato, lascia passare
  if (isAuthenticated) {
    return NextResponse.next();
  }
  
  // Se sta già nella pagina di login, lascia passare
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }
  
  // Se sta accedendo alla pagina admin, richiedi autenticazione
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Per tutte le altre pagine (inclusa la pagina principale), lascia passare
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - giocatori2 (player images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|giocatori2).*)',
  ],
};
