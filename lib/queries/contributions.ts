export const CONTRIBUTIONS_QUERY = `
query {
  viewer {
    login

    contributionsCollection {
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
          owner { login }
          stargazerCount
        }
        contributions(first: 100) {
          nodes {
            occurredAt
            commitCount
          }
        }
      }

      pullRequestContributionsByRepository(maxRepositories: 100) {
        repository {
          name
          owner { login }
        }
        contributions(first: 100) {
          nodes {
            pullRequest {
              title
              url
              state
              merged
              mergedAt
              createdAt
              additions
              deletions
            }
          }
        }
      }

      issueContributions {
        totalCount
      }
    }
  }
}
`;
