import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    userId?: string;
    username?: string | null;
    hasGitHub?: boolean;
    hasGoogle?: boolean;
    accessToken?: string;
    user?: DefaultSession["user"] & {
      banner?: string | null;
      followersCount?: number;
      followingCount?: number;
      leetcode?: string | null;
    };
  }
  }


declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
  }
}


  interface GoogleProfile {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
  }
  
  interface GithubProfile {
    id: number;
    name?: string;
    login?: string;
    email?: string | null;
    avatar_url?: string;
  }
  
  type OAuthProfile = GoogleProfile | GithubProfile;
  
  