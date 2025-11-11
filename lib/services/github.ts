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

export function processGitHubStats(stats: GitHubStats) {
  const now = new Date();
  const createdAt = new Date(stats.createdAt);
  const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate total and private repos
  const totalRepos = stats.repositories.totalCount;
  const privateRepos = stats.repositories.nodes.filter((repo) => repo.isPrivate).length;
  const publicRepos = totalRepos - privateRepos;

  // Calculate total stars (received)
  const totalStars = stats.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  // Calculate total commits (approximation from repositories)
  const totalCommits = stats.repositories.nodes.reduce((sum, repo) => {
    return sum + (repo.defaultBranchRef?.target.history.totalCount || 0);
  }, 0);

  // Total contributions this year
  const totalContributionsThisYear = stats.contributionsCollection.contributionCalendar.totalContributions;

  // Contributions in repos not owned by user
  const contributionsNotOwned = stats.repositoriesContributedTo.totalCount;

  // Total contributions (all time)
  const totalContributions =
    stats.contributionsCollection.totalCommitContributions +
    stats.contributionsCollection.totalIssueContributions +
    stats.contributionsCollection.totalPullRequestContributions +
    stats.contributionsCollection.totalPullRequestReviewContributions;

  // Process commit history (last 365 days from contribution calendar)
  const commitHistory = stats.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );

  // Process contributions by repository
  const contributionsByRepo = stats.contributionsCollection.commitContributionsByRepository.map((repoContrib) => ({
    repository: `${repoContrib.repository.owner.login}/${repoContrib.repository.name}`,
    isPrivate: repoContrib.repository.isPrivate,
    contributions: repoContrib.contributions.totalCount,
    commits: repoContrib.contributions.nodes.map((node) => ({
      date: node.occurredAt,
      count: node.commitCount,
    })),
  }));

  return {
    repos: totalRepos,
    privateRepos,
    publicRepos: publicRepos, // Not stored in DB, but useful for display
    commits: totalCommits,
    followers: stats.followers.totalCount,
    following: stats.following.totalCount,
    stars: totalStars,
    totalContributions,
    contributionsThisYear: totalContributionsThisYear,
    contributionsNotOwned,
    accountAge,
    commitHistory,
    contributionsByRepo, // Not stored in DB, but useful for display
  };
}

