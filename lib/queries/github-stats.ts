export const GITHUB_STATS_QUERY = `
query {
  viewer {
    login
    createdAt
    avatarUrl
    
    # 1. Total PRs and Reviews
    pullRequests(first: 1) { totalCount }
    issueComments(first: 1) { totalCount }
    
    # 2. Contributions (The detailed breakdown)
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      
      # The Heatmap Data
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
      
      # Repos they contributed to (Open Source Section)
      pullRequestContributionsByRepository(maxRepositories: 10) {
        repository {
          name
          owner { login }
          stargazerCount
          description
          url
          languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {
            nodes { name color }
          }
        }
        contributions(first: 1) { totalCount }
      }
    }

    # 3. Their Top Repos (Hero Section)
    repositories(first: 6, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}, isFork: false) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        forkCount
        url
        languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {
          nodes { name color }
        }
      }
    }
    
    # 4. Language Breakdown (Calculated from top 50 repos)
    topRepositories: repositories(first: 50, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes {
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node { name color }
          }
        }
      }
    }
    
    followers { totalCount }
    following { totalCount }
  }
}
`;

export const REPOSITORY_CONTRIBUTIONS_QUERY = `
query($cursor: String) {
  viewer {
    repositoriesContributedTo(first: 100, after: $cursor, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE]) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        owner {
          login
        }
        stargazerCount
      }
    }
  }
}
`;

