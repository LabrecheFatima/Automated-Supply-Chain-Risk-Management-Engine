
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials layout profile.");
        }

        // Find the specific operator record
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) {
          throw new Error("No user instance found with those credentials.");
        }

        // Verify cryptographic hash match
        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials passkey.");
        }

        // Return user object (NextAuth builds the session from this)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    // 🌟 CRITICAL FOR MANY USERS: Inject the database ID into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Inject the token ID straight into the accessible frontend session object
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt", // Fast, scalable cookie tokens—perfect for many users
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login", // Points NextAuth directly to your beautiful custom design
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };