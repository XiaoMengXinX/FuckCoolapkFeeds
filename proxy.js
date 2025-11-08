import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  const pathMatch = pathname.match(/^\/(feed|picture|iv)\/([^/]+)$/);
  
  if (pathMatch) {
    const [, routeType, id] = pathMatch;
    const idAsNumber = parseInt(id, 10);
    
    if (isNaN(idAsNumber) || idAsNumber.toString() !== id.replace(/^0+/, '')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return NextResponse.redirect(url, 301);
    }
    
    let needsRedirect = false;
    let normalizedId = id;

    const normalizedIdFromNumber = idAsNumber.toString();
    if (normalizedIdFromNumber !== id) {
      normalizedId = normalizedIdFromNumber;
      needsRedirect = true;
    }

    if (search) {
      needsRedirect = true;
    }

    if (needsRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = `/${routeType}/${normalizedId}`;
      url.search = '';
      
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/feed/:id*',
    '/picture/:id*',
    '/iv/:id*',
  ],
};