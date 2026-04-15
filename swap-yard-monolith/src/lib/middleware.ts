import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

export type Role = "buyer" | "seller" | "admin";

interface MarketplaceJWTPayload extends JWTPayload {
  userId: string;
  role: Role;
  sellerId?: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ""
);


const ROUTE_PERMISSIONS: Array<{
  methods: string[];
  pattern: RegExp;
  roles: Role[];
  public?: boolean;
}> = [

 //Public routes:no auth required

  { methods: ["GET"], pattern: /^\/api\/listings(\/|$)/, roles: [], public: true },
  { methods: ["GET"], pattern: /^\/api\/categories(\/|$)/, roles: [], public: true },
  { methods: ["GET"], pattern: /^\/api\/products(\/|$)/, roles: [], public: true },
  { methods: ["POST"], pattern: /^\/api\/auth\/(login|register|refresh)$/, roles: [], public: true },

  { methods: ["POST"], pattern: /^\/api\/listings$/, roles: ["seller", "admin"] },

  { methods: ["PUT", "PATCH", "DELETE"], pattern: /^\/api\/listings\/[^/]+$/, roles: ["seller", "admin"] },

  { methods: ["POST"], pattern: /^\/api\/checkout(\/|$)/, roles: ["buyer"] },

  // View own orders — buyers see their purchases, sellers see their sales
  { methods: ["GET"], pattern: /^\/api\/orders(\/|$)/, roles: ["buyer", "seller", "admin"] },

  // Cancel / refund an order — admin only
  { methods: ["POST"], pattern: /^\/api\/orders\/[^/]+\/(cancel|refund)$/, roles: ["admin"] },

  // ── Seller dashboard ───────────────────────────────────────────────────────
  { methods: ["GET", "PUT", "PATCH"], pattern: /^\/api\/seller\/dashboard(\/|$)/, roles: ["seller", "admin"] },
  { methods: ["GET"], pattern: /^\/api\/seller\/analytics(\/|$)/, roles: ["seller", "admin"] },

  // ── Buyer profile & wishlist ───────────────────────────────────────────────
  { methods: ["GET", "PUT", "PATCH"], pattern: /^\/api\/buyer\/profile(\/|$)/, roles: ["buyer", "admin"] },
  { methods: ["GET", "POST", "DELETE"], pattern: /^\/api\/buyer\/wishlist(\/|$)/, roles: ["buyer"] },

  // ── Reviews ────────────────────────────────────────────────────────────────
  // Only buyers who completed a purchase can leave reviews (handler enforces purchase check)
  { methods: ["POST"], pattern: /^\/api\/reviews$/, roles: ["buyer"] },
  { methods: ["DELETE", "PATCH"], pattern: /^\/api\/reviews\/[^/]+$/, roles: ["admin"] },

  // ── Admin-only routes ──────────────────────────────────────────────────────
  { methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], pattern: /^\/api\/admin(\/|$)/, roles: ["admin"] },
  { methods: ["GET", "PATCH"], pattern: /^\/api\/users(\/|$)/, roles: ["admin"] },

  // ── Payments ───────────────────────────────────────────────────────────────
  // Webhook from payment provider — verified by signature in handler, not JWT
  { methods: ["POST"], pattern: /^\/api\/payments\/webhook$/, roles: [], public: true },

  // Payout requests — sellers only
  { methods: ["POST"], pattern: /^\/api\/payments\/payout$/, roles: ["seller"] },
];


/** Extract and verify the Bearer JWT from the Authorization header. */
async function extractUser(
  req: NextRequest
): Promise<MarketplaceJWTPayload | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : req.cookies.get("marketplace_token")?.value ?? "";

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as MarketplaceJWTPayload;
  } catch {
    return null;
  }
}

function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Find the first matching route rule for a given method + pathname. */
function matchRoute(method: string, pathname: string) {
  return ROUTE_PERMISSIONS.find(
    (rule) =>
      rule.methods.includes(method.toUpperCase()) &&
      rule.pattern.test(pathname)
  ) ?? null;
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // 1. Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // 2. Find the matching route rule
  const rule = matchRoute(method, pathname);

  // 3. No rule found → treat as a protected catch-all requiring authentication
  if (!rule) {
    const user = await extractUser(req);
    if (!user) return unauthorized("Authentication required.");

    const response = NextResponse.next();
    response.headers.set("x-user-id", user.userId);
    response.headers.set("x-user-role", user.role);
    return response;
  }

  // 4. Public route → pass through immediately
  if (rule.public) {
    return NextResponse.next();
  }

  // 5. Protected route → verify JWT
  const user = await extractUser(req);
  if (!user) {
    return unauthorized(
      "You must be logged in to access this resource."
    );
  }

  // 6. Role check
  if (!rule.roles.includes(user.role)) {
    return forbidden(
      `Access denied. Required role(s): ${rule.roles.join(", ")}. ` +
      `Your role: ${user.role}.`
    );
  }

  // 7. Seller listing ownership pre-check
  //    For PUT/PATCH/DELETE on /api/listings/:id, inject sellerId so the
  //    route handler can verify the seller owns the resource.
  const listingEditMatch =
    /^\/api\/listings\/([^/]+)$/.test(pathname) &&
    ["PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

  const response = NextResponse.next();

  // Forward user identity to route handlers via headers
  response.headers.set("x-user-id", user.userId);
  response.headers.set("x-user-role", user.role);

  if (user.role === "seller" && user.sellerId) {
    response.headers.set("x-seller-id", user.sellerId);
  }

  if (listingEditMatch && user.role === "seller") {
    // Signal to the handler that it must confirm ownership
    response.headers.set("x-ownership-required", "true");
  }

  return response;
}

// ─────────────────────────────────────────────
// Route matcher config (Next.js)
// ─────────────────────────────────────────────

export const config = {
  /*
   * Run middleware on all /api/* routes.
   * Excludes Next.js internals automatically via the negative lookahead.
   */
  matcher: ["/api/:path*"],
};