export const GITHUB_STATS_QUERY = `
query {
  viewer {
    login
    createdAt
    bio
    avatarUrl
    repositories(first: 100) {
      totalCount
      nodes {
        isPrivate
        stargazerCount
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 1) {
                totalCount
              }
            }
          }
        }
      }
    }
    repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE]) {
      totalCount
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          name
          owner {
            login
          }
          isPrivate
        }
        contributions(first: 100) {
          totalCount
          nodes {
            occurredAt
            commitCount
          }
        }
      }
    }
    followers {
      totalCount
    }
    following {
      totalCount
    }
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

