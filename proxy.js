import { NextResponse } from 'next/server';

function redirectToPath(request, url, status = 301) {
  // Prefer the original public host provided by a reverse proxy. Some tunnel
  // setups replace Host with localhost:60080, which must never reach visitors.
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const isLocalHost = forwardedHost && /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(forwardedHost);
  const origin = forwardedHost && !isLocalHost
    ? `${forwardedProto || 'https'}://${forwardedHost}`
    : process.env.NODE_ENV === 'development'
      ? request.nextUrl.origin
      : 'https://www.coolapk1s.com';

  const destination = new URL(`${url.pathname}${url.search}`, origin);
  return NextResponse.redirect(destination, status);
}

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // Security Check: Protect iframe-only content from cross-origin access
  // Targeted paths: /headlines/[page], /reply/[id], and /t/[tag]/[page]
  const isIframeContent = 
    pathname.startsWith('/headlines/') || 
    pathname.startsWith('/reply/') || 
    (/^\/t\/[^\/]+\/\d+$/.test(pathname)); // Matches /t/TagName/1 but NOT /t/TagName

  if (isIframeContent) {
    // Get the current host (respecting proxies like Vercel/CDN)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const referer = request.headers.get('referer') || '';
    
    let refererHost = '';
    try {
      if (referer) {
        refererHost = new URL(referer).host;
      }
    } catch (e) {
      // Invalid URL in referer
    }

    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && refererHost !== host) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const pathMatch = pathname.match(/^\/(feed|picture|iv)\/([^/]+)$/);

  if (pathMatch) {
    const [, routeType, id] = pathMatch;

    // Preserve the Vercel redirects for Telegram and archive.org clients.
    if (routeType === 'feed' || routeType === 'picture') {
      const userAgent = request.headers.get('user-agent') || '';
      const via = request.headers.get('via') || '';
      if (/(telegram|archive\.org)/i.test(userAgent) || /archive\.org/i.test(via)) {
        const url = request.nextUrl.clone();
        url.pathname = `/iv/${id}`;
        return redirectToPath(request, url, 307);
      }
    }

    const idAsNumber = parseInt(id, 10);

    if (isNaN(idAsNumber) || idAsNumber.toString() !== id.replace(/^0+/, '')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return redirectToPath(request, url);
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

      return redirectToPath(request, url);
    }

    // Vercel's /picture/:id rewrite is not applied by a self-hosted Next.js
    // server. Redirect to the existing feed page instead of proxying back to
    // the internal localhost origin.
    if (routeType === 'picture') {
      const url = request.nextUrl.clone();
      url.pathname = `/feed/${normalizedId}`;
      return redirectToPath(request, url, 307);
    }
  }

  const otherPagesMatch = pathname === '/' || pathname.match(/^\/(headlines|t|reply)\/.*$/);
  if (otherPagesMatch && search) {
    const url = request.nextUrl.clone();
    url.search = '';
    return redirectToPath(request, url);
  }

  // Match the Vercel catch-all redirect for paths outside the app's reserved
  // prefixes. Keep the path and query string when sending the visitor to Coolapk.
  const isVercelReservedPath = /^\/(api|feed|iv|reply|headlines|t|_next|picture)/.test(pathname);
  if (pathname !== '/' && !isVercelReservedPath) {
    const destination = new URL(`${pathname}${search}`, 'https://www.coolapk.com');
    return NextResponse.redirect(destination, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
