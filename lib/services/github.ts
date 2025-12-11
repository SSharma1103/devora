import axios from "axios";

export interface GitHubStats {
  login: string;
  createdAt: string;
  bio?: string;
  avatarUrl: string;
  repositories: {
    totalCount: number;
    nodes: Array<{
      isPrivate: boolean;
      stargazerCount: number;
      defaultBranchRef?: {
        target: {
          history: {
            totalCount: number;
          };
        };
      };
    }>;
  };
  repositoriesContributedTo: {
    totalCount: number;
  };
  contributionsCollection: {
    totalCommitContributions: number;
    totalIssueContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{
          contributionCount: number;
          date: string;
        }>;
      }>;
    };
    commitContributionsByRepository: Array<{
      repository: {
        name: string;
        owner: {
          login: string;
        };
        isPrivate: boolean;
      };
      contributions: {
        totalCount: number;
        nodes: Array<{
          occurredAt: string;
          commitCount: number;
        }>;
      };
    }>;
  };
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
}



export async function fetchGitHubStats(accessToken: string): Promise<GitHubStats> {
  const { GITHUB_STATS_QUERY } = await import("@/lib/queries/github-stats");
  
  const response = await axios.post(
    "https://api.github.com/graphql",
    { query: GITHUB_STATS_QUERY },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.errors) {
    throw new Error(`GitHub API Error: ${JSON.stringify(response.data.errors)}`);
  }

  return response.data.data.viewer;
}

export function processGitHubStats(stats: any) {
  const now = new Date();
  const createdAt = new Date(stats.createdAt);
  const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // 1. Calculate Language Stats
  const languageMap = new Map<string, { size: number; color: string }>();
  
  stats.topRepositories.nodes.forEach((repo: any) => {
    repo.languages.edges.forEach((edge: any) => {
      const { name, color } = edge.node;
      const current = languageMap.get(name) || { size: 0, color };
      languageMap.set(name, { size: current.size + edge.size, color });
    });
  });

  // Convert map to percentage array
  let totalSize = 0;
  languageMap.forEach((val) => (totalSize += val.size));
  
  const languages = Array.from(languageMap.entries())
    .map(([name, { size, color }]) => ({
      name,
      color,
      percent: parseFloat(((size / totalSize) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6); // Top 6 languages

  // 2. Process Open Source Contributions (Repos NOT owned by user)
  // The query fetches PR contributions. We map them to a clean format.
  const osContributions = stats.contributionsCollection.pullRequestContributionsByRepository
    .filter((item: any) => item.repository.owner.login !== stats.login) // Exclude own repos
    .map((item: any) => ({
      name: item.repository.name,
      owner: item.repository.owner.login,
      stars: item.repository.stargazerCount,
      desc: item.repository.description,
      url: item.repository.url,
      prCount: item.contributions.totalCount,
      primaryLanguage: item.repository.languages.nodes[0] || null
    }))
    .sort((a: any, b: any) => b.stars - a.stars); // Sort by Star Impact

  // 3. Commit History (Last 365 Days) - Same as before
  const commitHistory = stats.contributionsCollection.contributionCalendar.weeks.flatMap((week: any) =>
    week.contributionDays.map((day: any) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );

  return {
    repos: stats.repositories.totalCount,
    // ... (Keep your existing basic stats logic) ...
    stars: stats.repositories.nodes.reduce((acc: number, repo: any) => acc + repo.stargazerCount, 0),
    followers: stats.followers.totalCount,
    following: stats.following.totalCount,
    privateRepos: stats.repositories.nodes.filter((repo: any) => repo.isPrivate).length,
    commits: stats.contributionsCollection.totalCommitContributions,
    contributionsNotOwned: stats.contributionsCollection.pullRequestContributionsByRepository.filter((item: any) => item.repository.owner.login !== stats.login).length,
    contributionsThisYear: stats.contributionsCollection.contributionCalendar.weeks.filter((week: any) => new Date(week.contributionDays[0].date).getFullYear() === new Date().getFullYear()).length,
    totalContributions: stats.contributionsCollection.contributionCalendar.totalContributions,
    // NEW DATA
    languages, // Json
    osContributions, // Json
    pullRequests: stats.pullRequests.totalCount,
    commitHistory,
    accountAge,
  };
}

