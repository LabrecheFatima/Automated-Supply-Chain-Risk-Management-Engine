import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
  
  },
  {
    // 🔐 Pass the secret directly into the configuration block to fix the "Configuration" loop
    secret: process.env.NEXTAUTH_SECRET || "development-fallback-secret-string-32-chars-long",
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
      error: "/login"
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/shipments/:path*"
  ]
};