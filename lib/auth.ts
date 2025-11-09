import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { Session, Account, Profile } from "next-auth";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { OAuthProfile } from "@/types/next-auth";


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
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ account, profile }: { account: Account | null; profile?: Profile }) {
      if (!account || !profile) {
        console.log("Missing account or profile");
        return false;
      }
    
      const provider = account.provider;
      const oauthProfile = profile as OAuthProfile;
    
      let providerId: string;
      let email: string | null = null;
      let name: string | null = null;
      let pfp: string | null = null;
    
      if ("sub" in oauthProfile) {
        providerId = oauthProfile.sub;
        email = oauthProfile.email ?? null;
        name = oauthProfile.name ?? null;
        pfp = oauthProfile.picture ?? null;
      } else {
        providerId = oauthProfile.id.toString();
        email = oauthProfile.email ?? null;
        name = oauthProfile.name ?? oauthProfile.login ?? null;
        pfp = oauthProfile.avatar_url ?? null;
      }
    
      const whereClause =
        provider === "google"
          ? { googleId: providerId }
          : provider === "github"
          ? { githubId: providerId }
          : email
          ? { email }
          : { email: "__no_email__" };
    
      await prisma.user.upsert({
        where: whereClause,
        update: {
          name,
          pfp,
          email: email ?? undefined,
        },
        create: {
          name,
          pfp,
          email,
          googleId: provider === "google" ? providerId : undefined,
          githubId: provider === "github" ? providerId : undefined,
        },
      });
    
      return true;
    } ,
    
    
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ token, session }: { token: JWT; session: Session }) {
      session.accessToken = token.accessToken as string;
      session.userId = token.userId as string;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
