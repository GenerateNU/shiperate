export const TARGET_BRANCH = "featurethon"

export type Team = {
  name: string
  emoji: string
}

// Several repos can share a team; the scoreboard is keyed by team name, so their pushes add up.
const INFRA: Team = { name: "Infra", emoji: "🛠️" }

// repo name (as GitHub reports it) -> team
export const REPO_TEAMS: Record<string, Team> = {
  "boutline": { name: "Boutline", emoji: "🥊" },
  "inspirate-consulting": { name: "Inspirate Consulting", emoji: "💡" },
  "birdie-and-claire": { name: "Birdie & Claire", emoji: "🐦" },
  "tomoji": { name: "Tomoji", emoji: "🍅" },
  "website": INFRA,
  "finops": INFRA,
  "apportal": INFRA,
}

export function teamForRepo(repo: string): Team | undefined {
  return REPO_TEAMS[repo]
}
