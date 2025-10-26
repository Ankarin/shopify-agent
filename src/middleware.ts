import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isSignupRoute = createRouteMatcher(["/sign-up(.*)"]);
const isPublicRoute = createRouteMatcher([
    "/widget(.*)",
    "/chat/(.*)",
    "/api/chat(.*)",
    "/api/organizations/(.+)/widget-settings",
    "/iframe-test(.*)"
]);
const isCronRoute = createRouteMatcher(["/api/cron/(.*)"]);
export default clerkMiddleware(async (auth, req) => {
    console.log('[Middleware] Request:', req.url);

    if (isCronRoute(req)) {
        console.log('[Middleware] Cron route detected');
        return NextResponse.next();
    }

    if (isPublicRoute(req)) {
        console.log('[Middleware] Public route detected');
        const response = NextResponse.next();
        response.headers.delete('X-Frame-Options');
        response.headers.set('Content-Security-Policy', 'frame-ancestors *');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        return response;
    }

    console.log('[Middleware] Protected route, checking auth');
    const { userId } = await auth();
    if (isSignupRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if (!userId && !isAuthRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|chat|iframe-test|widget|api/cron|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/api/organizations/:path*',
    ],
};
