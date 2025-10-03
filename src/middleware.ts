import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isSignupRoute = createRouteMatcher(["/sign-up(.*)"]);
const isPublicRoute = createRouteMatcher(["/widget(.*)", "/chat/(.*)"]);
export default clerkMiddleware(async (auth, req) => {
    const { userId, orgId, orgRole } = await auth();
    if (isSignupRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if (!userId && !isAuthRoute(req) && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const response = NextResponse.next();

    if (req.nextUrl.pathname.startsWith('/chat/')) {
        response.headers.delete('X-Frame-Options');
        response.headers.set('Content-Security-Policy', 'frame-ancestors *');
    }

    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};