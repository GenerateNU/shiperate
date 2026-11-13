export const TARGET_BRANCH = "featurethon"

export type Team = {
  name: string
  emoji: string
}

// repo name (as GitHub reports it) -> team
export const REPO_TEAMS: Record<string, Team> = {
  "boutline": { name: "Boutline", emoji: "🥊" },
  "inspirate-consulting": { name: "Inspirate Consulting", emoji: "💡" },
  "birdie-and-claire": { name: "Birdie & Claire", emoji: "🐦" },
  "tomoji": { name: "Tomoji", emoji: "🍅" },
}

export function teamForRepo(repo: string): Team | undefined {
  return REPO_TEAMS[repo]
}
