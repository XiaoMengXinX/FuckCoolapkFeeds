import { NextResponse } from 'next/server';

const LOCAL_HOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i;
const RESERVED_PATH_PATTERN = /^\/(?:api|feed|iv|reply|headlines|t|_next|picture)(?:\/|$)/;
const ARCHIVE_UA_PATTERN = /(telegram|archive\.org|ia_archiver)/i;

function redirectToPath(request, url, status = 301) {
  // Some tunnels rewrite Host to an internal localhost address, so prefer the
  // forwarded public host and never redirect visitors to a local origin.
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const origin = forwardedHost && !LOCAL_HOST_PATTERN.test(forwardedHost)
    ? `${forwardedProto || 'https'}://${forwardedHost}`
    : process.env.NODE_ENV === 'development'
      ? request.nextUrl.origin
      : 'https://www.coolapk1s.com';

  return NextResponse.redirect(new URL(`${url.pathname}${url.search}`, origin), status);
}

function redirectTo(request, pathname, status) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return redirectToPath(request, url, status);
}

function isSameOriginReferer(request) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  try {
    return new URL(request.headers.get('referer') || '').host === host;
  } catch {
    return false;
  }
}

// Mirrors the redirects and rewrites in vercel.json for self-hosted deployments.
export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  const isIframeContent =
    pathname.startsWith('/headlines/') ||
    pathname.startsWith('/reply/') ||
    /^\/t\/[^/]+\/\d+$/.test(pathname);

  if (isIframeContent && process.env.NODE_ENV !== 'development' && !isSameOriginReferer(request)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const pathMatch = pathname.match(/^\/(feed|picture|iv)\/([^/]+)$/);

  if (pathMatch) {
    const [, routeType, id] = pathMatch;

    if (routeType !== 'iv') {
      const userAgent = request.headers.get('user-agent') || '';
      const via = request.headers.get('via') || '';
      if (ARCHIVE_UA_PATTERN.test(userAgent) || /archive\.org/i.test(via)) {
        return redirectTo(request, `/iv/${id}`, 307);
      }
    }

    if (!/^\d+$/.test(id) || /^0+$/.test(id)) {
      return redirectTo(request, '/');
    }

    const normalizedId = id.replace(/^0+/, '');

    if (routeType === 'picture') {
      return redirectTo(request, `/feed/${normalizedId}`, 307);
    }

    if (normalizedId !== id || search) {
      return redirectTo(request, `/${routeType}/${normalizedId}`);
    }
  }

  if (search && (pathname === '/' || /^\/(headlines|t|reply)\//.test(pathname))) {
    const url = request.nextUrl.clone();
    url.search = '';
    return redirectToPath(request, url);
  }

  if (pathname !== '/' && !RESERVED_PATH_PATTERN.test(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, 'https://www.coolapk.com'), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
