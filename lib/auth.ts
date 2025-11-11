import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { Session, Account, Profile } from "next-auth";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { OAuthProfile } from "@/types/next-auth";
import { cookies } from "next/headers";


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
    
      // Handle account linking for GitHub
      if (provider === "github") {
        // Check if GitHub account is already linked
        const existingGitHubUser = await prisma.user.findUnique({
          where: { githubId: providerId },
        });
        
        if (existingGitHubUser) {
          // GitHub account already linked to a user
          return true;
        }
        
        // Try to get current user ID from cookie (set when user clicks "Connect GitHub")
        try {
          const cookieStore = await cookies();
          const linkUserId = cookieStore.get("link_account_user_id")?.value;
          
          if (linkUserId) {
            // User is trying to link GitHub to existing account
            const existingUser = await prisma.user.findUnique({
              where: { id: parseInt(linkUserId) },
            });
            
            if (existingUser && !existingUser.githubId) {
              // Link GitHub account to existing user
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  githubId: providerId,
                  name: name || existingUser.name,
                  pfp: pfp || existingUser.pfp,
                },
              });
              
              // Clear the cookie
              cookieStore.delete("link_account_user_id");
              return true;
            }
          }
        } catch {
          // Cookie access might fail in some environments, fall through to email matching
          console.log("Could not access cookies for account linking");
        }
        
        // Fallback: Check if user exists by email and doesn't have GitHub linked
        if (email) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });
          
          // If user exists with same email and doesn't have GitHub, link it
          if (existingUser && !existingUser.githubId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                githubId: providerId,
                name: name || existingUser.name,
                pfp: pfp || existingUser.pfp,
              },
            });
            return true;
          }
        }
      }
    
      // Check if user exists by provider ID
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
    
    
    async jwt({ token, account, profile }: { token: JWT; account: Account | null; profile?: Profile }) {
      // On first sign in (when account is present), look up user and store ID
      if (account) {
        if (account.access_token) {
          token.accessToken = account.access_token;
        }
        
        // Look up user by provider ID or email to get user ID
        if (profile) {
          const oauthProfile = profile as OAuthProfile;
          const provider = account.provider;
          
          let providerId: string;
          let email: string | null = null;
          
          if ("sub" in oauthProfile) {
            providerId = oauthProfile.sub;
            email = oauthProfile.email ?? null;
          } else {
            providerId = oauthProfile.id.toString();
            email = oauthProfile.email ?? null;
          }
          
          // First try to find by provider ID
          let user = await prisma.user.findUnique({
            where: provider === "google" 
              ? { googleId: providerId }
              : provider === "github"
              ? { githubId: providerId }
              : { email: "__no_email__" },
            select: { id: true },
          });
          
          // If not found and email exists, try by email (for account linking)
          if (!user && email) {
            user = await prisma.user.findUnique({
              where: { email },
              select: { id: true },
            });
          }
          
          if (user) {
            token.userId = user.id.toString();
          }
        }
      }
      
      return token;
    },

    async session({ token, session }: { token: JWT; session: Session }) {
      // Fetch user data including username and GitHub connection status
      if (token.userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(token.userId) },
          select: { id: true, username: true, name: true, email: true, githubId: true, googleId: true },
        });
        
        if (user) {
          session.userId = user.id.toString();
          session.username = user.username;
          session.hasGitHub = !!user.githubId;
          session.hasGoogle = !!user.googleId;
          session.user = {
            ...session.user,
            name: user.name || session.user?.name,
            email: user.email || session.user?.email,
          };
        }
      }
      
      session.accessToken = token.accessToken as string;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
