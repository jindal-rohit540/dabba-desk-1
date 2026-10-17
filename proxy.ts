import { clerkMiddleware } from "@clerk/nextjs/server";

// Makes the Clerk session available to auth() everywhere. It does NOT protect anything by itself:
// every owner page and Server Action calls auth.protect() / auth() where the data is accessed.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
