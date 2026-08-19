import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — Auth Guard, Lock Screen, Orphan Check & Department Context
 *
 * Runs on the Edge runtime BEFORE any page is rendered. Responsibilities:
 *
 *  1. Auth guard        — redirect unauthenticated users to sign-in.
 *  2. Login redirect    — bounce already-authenticated users away from auth pages.
 *  3. Lock screen guard — if `screen_locked=1` cookie is present, any protected
 *                         route is redirected to the lock screen. The user CANNOT
 *                         bypass it via back button, refresh, or manual URL entry.
 *  4. Orphan redirect   — authenticated users with no department assignment are
 *                         redirected to /pending-assignment/ until an admin
 *                         creates their Employee record.
 *  5. Dept forwarding   — forward the active_dept cookie as X-Department-Id so
 *                         Laravel's SetDepartmentContext middleware picks it up.
 *
 * Cookie contract (written by api.js login() / DepartmentContext / Profile.tsx):
 *   token         – Sanctum opaque token  (presence ≡ authenticated)
 *   active_dept   – active department ID  (set immediately at login)
 *   user_perms    – comma-separated permission names for active department
 *   user_roles    – comma-separated global role names (e.g. "Super Admin")
 *   screen_locked – "1" when the lock screen is active; cleared on unlock
 */

// Redirect orphan users here until they are assigned a department
const PENDING_PATH = "/pending-assignment/";

// The lock screen page path
const LOCK_SCREEN_PATH = "/authentication/lock-screen/";

// Global roles that bypass the department requirement.
const GLOBAL_ADMIN_ROLES = ["Super Admin", "SuperAdmin", "admin"];

// Paths that never require authentication
const PUBLIC_PREFIXES = [
  "/authentication/",
  "/front-pages/",
  "/coming-soon/",
];

// Static asset paths — always allow through
const STATIC_PREFIXES = ["/_next/", "/favicon.ico", "/images/", "/api/"];

// Auth pages where logged-in users should be bounced to dashboard
const AUTH_PAGES = [
  "/authentication/sign-in/",
  "/authentication/sign-up/",
  "/authentication/forgot-password/",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStatic(pathname: string): boolean {
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static files, API proxies, Next.js internals — pass through immediately
  if (isStatic(pathname)) {
    return NextResponse.next();
  }

  const token        = request.cookies.get("token")?.value;
  const activeDept   = request.cookies.get("active_dept")?.value;
  const userRoles    = request.cookies.get("user_roles")?.value ?? "";
  const screenLocked = request.cookies.get("screen_locked")?.value === "1";

  // Whether the user holds a global admin role that bypasses dept requirement
  const isGlobalAdmin = GLOBAL_ADMIN_ROLES.some((r) => userRoles.includes(r));

  // 2. LOCK SCREEN GUARD — must run before all other checks.
  //    If the screen is locked AND the user is NOT already on the lock screen,
  //    hard-redirect to lock screen. This catches back-button, refresh, and
  //    manual URL changes. The lock screen page itself is always accessible.
  if (screenLocked && token && !pathname.startsWith(LOCK_SCREEN_PATH)) {
    return NextResponse.redirect(new URL(LOCK_SCREEN_PATH, request.url));
  }

  // 3. Already authenticated and hitting a login/register page → dashboard
  //    (but NOT if the screen is locked — lock screen is under /authentication/)
  if (!screenLocked && token && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard/", request.url));
  }

  // 4. Public paths — no token required
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 5. No token → sign-in (preserve redirect destination)
  if (!token) {
    const loginUrl = new URL("/authentication/sign-in/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated from here ───────────────────────────────────────────────

  // 6. No department assigned and not a global admin → pending-assignment page
  if (!activeDept && !isGlobalAdmin && !pathname.startsWith(PENDING_PATH)) {
    return NextResponse.redirect(new URL(PENDING_PATH, request.url));
  }

  // 7. Has a department (or is global admin) but landed on pending page → dashboard
  if ((activeDept || isGlobalAdmin) && pathname.startsWith(PENDING_PATH)) {
    return NextResponse.redirect(new URL("/dashboard/", request.url));
  }

  // 8. Fully authenticated — forward department context header to Laravel
  const response = NextResponse.next();
  if (activeDept) {
    response.headers.set("X-Department-Id", activeDept);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
