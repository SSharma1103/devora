import { Gitdata, User, WorkExp, Project, Pdata } from "@prisma/client";

export type { Gitdata, User, WorkExp, Project, Pdata };

export type BasicUser = Pick<User, "id" | "name" | "username" | "pfp">;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateWorkExpReq{
    title: string;
  duration?: string | null;    
  companyName?: string | null;
  description?: string | null;
  image?: string | null;
}

export interface CreateProjectReq{
    title: string,
    description?: string|null,
    link?: string|null,
    gitlink?: string|null,
}
export interface Socials {
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
  email?: string;
  leetcode?: string;
  [key: string]: string | undefined; // Allows other keys just in case
}
export type FeedUser = {
  name: string | null;
  username: string | null;
  pfp: string | null;
};

// Specific Item Types
export type ProjectItem = {
  type: "project";
  timestamp: Date;
  item: Project & { user: FeedUser };
};

export type WorkExpItem = {
  type: "workexp";
  timestamp: Date;
  item: WorkExp & { user: FeedUser };
};

// The Union Type
export type FeedItem = ProjectItem | WorkExpItem;

export interface LeetCodeProfile {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
  contributionPoint: number;
  reputation: number;
  submissionCalendar: Record<string, number>;
}

export interface Badge {
  id: string;
  displayName: string;
  icon: string;
  creationDate?: string;
}

export interface LeetCodeBadges {
  badges: Badge[];
  activeBadge: Badge | null;
  upcomingBadges: Badge[];
}
export interface PdataForm {
  about: string;
  devstats: string;
  stack: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    portfolio: string;
  };
}
export interface UserProfile {
  id: number;
  name: string | null;
  username: string;
  pfp: string | null;
  banner: string | null;
  gitdata: any;
  pdata: any;
  projects: any[];
  workExp: any[];
  _count: {
    followers: number;
    following: number;
  };
  isFollowedByCurrentUser: boolean;
  isCurrentUser: boolean;
}
export interface UserType {
  id: number;
  name: string | null;
  username: string;
  pfp?: string | null;
}
