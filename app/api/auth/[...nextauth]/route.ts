import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://mail.google.com/",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            console.error("No email provided by Google");
            return false;
          }

          // Check if user exists
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // If user doesn't exist, create user and OAuth account
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? null,
                image: user.image ?? null,
                accounts: {
                  create: {
                    provider: "google",
                    accessToken: account.access_token ?? "",
                    refreshToken: account.refresh_token ?? "",
                    expiresAt: account.expires_at
                      ? new Date(account.expires_at * 1000)
                      : new Date(),
                  },
                },
              },
            });
          } else {
            // User exists, check if OAuth account exists
            const existingAccount = await prisma.oAuthAccount.findFirst({
              where: {
                userId: dbUser.id,
                provider: "google",
              },
            });

            // If OAuth account doesn't exist, create it
            if (!existingAccount) {
              await prisma.oAuthAccount.create({
                data: {
                  userId: dbUser.id,
                  provider: "google",
                  accessToken: account.access_token ?? "",
                  refreshToken: account.refresh_token ?? "",
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : new Date(),
                },
              });
            } else {
              // Update existing OAuth account with new tokens
              await prisma.oAuthAccount.update({
                where: { id: existingAccount.id },
                data: {
                  accessToken: account.access_token ?? "",
                  refreshToken: account.refresh_token ?? "",
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : new Date(),
                },
              });
            }
          }

          return true;
        } catch (error) {
          console.error("Error in Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session }) {
      // Fetch user details to enrich session object
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });

          if (dbUser) {
            // Extend session user with database user info
            session.user = {
              ...session.user,
              id: dbUser.id,
              name: dbUser.name ?? session.user.name ?? null,
              image: dbUser.image ?? session.user.image ?? null,
            } as typeof session.user & { id: string };
          }
        } catch (error) {
          console.error("Error fetching user in session:", error);
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
    newUser: "/signup",
  },
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
