import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { OAuthProfile } from "@/types/next-auth";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      const provider = account.provider;
      const oauth = profile as OAuthProfile;

      let providerId: string;
      let email: string | null = null;
      let name: string | null = null;
      let pfp: string | null = null;
      let banner: string | null = null;

      const isGoogle = "sub" in oauth;
      const providerIdField: "googleId" | "githubId" = isGoogle
        ? "googleId"
        : "githubId";

      if (isGoogle) {
        providerId = oauth.sub;
        email = oauth.email ?? null;
        name = oauth.name ?? null;
        pfp = oauth.picture ?? null;
      } else {
        providerId = oauth.id.toString();
        email = oauth.email ?? null;
        name = oauth.name ?? oauth.login ?? null;
        pfp = oauth.avatar_url ?? null;
      }

      // Explicit account linking using cookie
      if (provider === "github") {
        try {
          const cookieStore = await cookies();
          const linkUserId = cookieStore.get("link_account_user_id")?.value;

          if (linkUserId) {
            const userToLink = await prisma.user.findUnique({
              where: { id: parseInt(linkUserId) },
            });

            if (userToLink && !userToLink.githubId) {
              await prisma.user.update({
                where: { id: userToLink.id },
                data: {
                  githubId: providerId,
                  name: userToLink.name ?? name,
                  pfp: userToLink.pfp ?? pfp,
                },
              });

              cookieStore.delete("link_account_user_id");
              return true;
            }
          }
        } catch (e) {
          console.error("Link cookie error", e);
        }
      }

      // 1. Lookup by provider
      let user = await prisma.user.findUnique({
        where: { [providerIdField]: providerId } as any,
      });

      if (user) return true;

      // 2. Lookup by email
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { [providerIdField]: providerId },
          });

          return true;
        }
      }

      // 3. Create new user
      await prisma.user.create({
        data: {
          [providerIdField]: providerId,
          email,
          name,
          pfp,
          banner,
        },
      });

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        // 1. Generic access token (updates on every login)
        if (account.access_token) {
          token.accessToken = account.access_token;
        }

        // 2. Store GitHub token specifically and persistently [FIX]
        if (account.provider === "github" && account.access_token) {
          token.githubAccessToken = account.access_token;
        }

        if (profile) {
          const oauth = profile as OAuthProfile;
          const provider = account.provider;

          let providerId: string;
          let email: string | null = null;

          if ("sub" in oauth) {
            providerId = oauth.sub;
            email = oauth.email ?? null;
          } else {
            providerId = oauth.id.toString();
            email = oauth.email ?? null;
          }

          let whereInput: Prisma.UserWhereUniqueInput | null = null;

          if (provider === "google") {
            whereInput = { googleId: providerId };
          } else if (provider === "github") {
            whereInput = { githubId: providerId };
          } else if (email) {
            whereInput = { email };
          }

          if (!whereInput) return token;

          // Lookup by provider
          let user = await prisma.user.findUnique({
            where: whereInput,
            select: { id: true },
          });

          // Fallback email
          if (!user && email) {
            user = await prisma.user.findUnique({
              where: { email },
              select: { id: true },
            });
          }

          if (user) {
            token.userId = String(user.id);
          }
        }
      }

      return token;
    },

    async session({ token, session }) {
      if (token.userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(token.userId) },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            githubId: true,
            googleId: true,
            pfp: true,
            banner: true,
          },
        });

        if (user) {
          session.userId = String(user.id);
          session.username = user.username;
          session.hasGitHub = !!user.githubId;
          session.hasGoogle = !!user.googleId;

          session.user = {
            ...session.user,
            name: user.name ?? session.user?.name,
            email: user.email ?? session.user?.email,
            image: user.pfp ?? session.user?.image,
            banner: user.banner ?? session.user?.banner,
          };
        }
      }

      session.accessToken = token.accessToken as string;
      // Pass the specific GitHub token to the session [FIX]
      session.githubAccessToken = token.githubAccessToken as string;
      
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};