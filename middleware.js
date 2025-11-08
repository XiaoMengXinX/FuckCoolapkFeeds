import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const pathRegex = /^\/(feed|picture|iv)\/[^/]+$/;
  
  if (pathRegex.test(pathname) && search) {
    const url = request.nextUrl.clone();
    url.search = '';
    return NextResponse.redirect(url, 301);
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