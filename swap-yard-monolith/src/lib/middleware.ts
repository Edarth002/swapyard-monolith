import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

export type Role = "BUYER" | "SELLER" | "ADMIN";

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

  { methods: ["GET"], pattern: /^\/api\/listing(\/|$)/, roles: [], public: true },
  { methods: ["GET"], pattern: /^\/api\/category(\/|$)/, roles: [], public: true },
  { methods: ["GET"], pattern: /^\/api\/shop(\/|$)/, roles: [], public: true },
  { methods: ["POST"], pattern: /^\/api\/auth\/(login|signup|resetpassword|token|oauth|)$/, roles: [], public: true },

  { methods: ["POST"], pattern: /^\/api\/listing$/, roles: ["SELLER", "ADMIN"] },

  { methods: ["PUT", "PATCH", "DELETE"], pattern: /^\/api\/listing\/[^/]+$/, roles: ["SELLER", "ADMIN"] },

  { methods: ["POST"], pattern: /^\/api\/orders\/checkout(\/|$)/, roles: ["BUYER"] },

  { methods: ["GET"], pattern: /^\/api\/orders(\/|$)/, roles: ["BUYER", "SELLER", "ADMIN"] },

  { methods: ["POST"], pattern: /^\/api\/orders\/[^/]+\/(cancel|refund)$/, roles: ["ADMIN"] },


  { methods: ["GET", "PUT", "PATCH"], pattern: /^\/api\/auth\/me(\/|$)/, roles: ["BUYER", "SELLER", "ADMIN"] },

  { methods: ["POST"], pattern: /^\/api\/review$/, roles: ["BUYER"] },
  { methods: ["DELETE", "PATCH"], pattern: /^\/api\/review\/[^/]+$/, roles: ["ADMIN"] },

  { methods: ["POST"], pattern: /^\/api\/verification\/payout$/, roles: ["SELLER"] },
];


async function extractUser(
  req: NextRequest
): Promise<MarketplaceJWTPayload | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : req.cookies.get("session")?.value ?? "";

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

function matchRoute(method: string, pathname: string) {
  return ROUTE_PERMISSIONS.find(
    (rule) =>
      rule.methods.includes(method.toUpperCase()) &&
      rule.pattern.test(pathname)
  ) ?? null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  const rule = matchRoute(method, pathname);

  if (!rule) {
    const user = await extractUser(req);
    if (!user) return unauthorized("Authentication required.");

    const response = NextResponse.next();
    response.headers.set("x-user-id", user.userId);
    response.headers.set("x-user-role", user.role);
    return response;
  }

  if (rule.public) {
    return NextResponse.next();
  }

  const user = await extractUser(req);
  if (!user) {
    return unauthorized(
      "You must be logged in to access this resource."
    );
  }

  if (!rule.roles.includes(user.role)) {
    return forbidden(
      `Access denied. Required role(s): ${rule.roles.join(", ")}. ` +
      `Your role: ${user.role}.`
    );
  }

  const listingEditMatch =
    /^\/api\/listings\/([^/]+)$/.test(pathname) &&
    ["PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

  const response = NextResponse.next();

  response.headers.set("x-user-id", user.userId);
  response.headers.set("x-user-role", user.role);

  if (user.role === "SELLER" && user.sellerId) {
    response.headers.set("x-seller-id", user.sellerId);
  }

  if (listingEditMatch && user.role === "SELLER") {
    response.headers.set("x-ownership-required", "true");
  }

  return response;
}


export const config = {
  matcher: ["/api/:path*"],
};