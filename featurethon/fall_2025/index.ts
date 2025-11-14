import * as dotenv from "dotenv"

type MappingType = Map<string, {
  messages: string[],
  addedFiles: Set<string>
  removedFiles: Set<string>
  modifiedFiles: Set<string>
  numberOfCommits: number
  teamName: string
}>

const VALID_REPOS = ["prisere", "shiperate", "cinecircle", "specialstandard",
  "karp-backend", "karp-frontend-react", "karp-frontend-react-native"]

const TARGET_BRANCH = "featurethon"

const REPO_TEAM_MAPPINGS: Record<string, string> = {
  "prisere": "Prisere", "shiperate": "Chiefs", "cinecircle": "CineCircle", "specialstandard": "Special Standard",
  "karp-backend": "Karp", "karp-frontend-react": "Karp", "karp-frontend-react-native": "Karp"
}

function validate_github_repos(json: any) {
  const repository_name = json.repository.name
  const branch_name: string = json.ref.split("/").slice(2).join("/");
  return VALID_REPOS.includes(repository_name) && branch_name.startsWith(TARGET_BRANCH)
}

function process_featurethon(json: any): MappingType {
  const commits: any[] = json.commits
  // Create a mapping of a name
  const mappings = new Map<string, {
    messages: string[],
    addedFiles: Set<string>
    removedFiles: Set<string>
    modifiedFiles: Set<string>
    numberOfCommits: number
    teamName: string
  }>()

  for (const commit of commits) {
    const author = commit.author
    const name = author.name
    const message: string = commit.message
    const addedFiles: string[] = commit.added
    const removedFiles: string[] = commit.removed
    const modifiedFiles: string[] = commit.modified

    if (mappings.has(name)) {
      const info = mappings.get(name)!
      info.messages.push(message)
      info.addedFiles.union(new Set(addedFiles))
      info.removedFiles.union(new Set(removedFiles))
      info.modifiedFiles.union(new Set(modifiedFiles))
      info.numberOfCommits = info.numberOfCommits + 1
    } else {
      mappings.set(name, {
        messages: [message],
        addedFiles: new Set<string>(addedFiles),
        removedFiles: new Set<string>(removedFiles),
        modifiedFiles: new Set<string>(modifiedFiles),
        numberOfCommits: 1,
        teamName: REPO_TEAM_MAPPINGS[json.repository.name]!
      })
    }
  }
  return mappings
}

async function handleIncomingGithubWebhook(req: Request): Promise<Response> {
  const json: any = await req.json()
  await Bun.write("output.txt", JSON.stringify(json, null, 2));
  if (validate_github_repos(json)) {
    const contributors = process_featurethon(json)
    console.log(contributors)
  }
  return new Response("Successfully Hit Response")
}

function main(config: Record<string, string | undefined>) {
  if (config.port === undefined) {
    throw new Error("No Port Found")
  }
  const routes = {
    "/api/webhooks/github": handleIncomingGithubWebhook
  }
  const server = Bun.serve({
    port: parseInt(config.port), routes: routes,
    fetch(req) { return new Response("Yo Mama.") }
  })
  console.log(`Server running at ${server.url}`);
}

dotenv.config()

const config = {
  port: process.env.SERVER_PORT
}

main(config)
