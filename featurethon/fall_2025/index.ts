import * as dotenv from "dotenv"

type MappingType = Map<string, {
  messages: string[],
  addedFiles: Set<string>
  removedFiles: Set<string>
  modifiedFiles: Set<string>
  numberOfCommits: number
  teamName: string
  headCommitMessage: string
}>

const ADJECTIVES = [
  "Sherm Goblin",
  "Sherm Warrior",
  "Dragon Warrior",
  "Sherm Dweller",
  "Github Wizard",
  "Mountain Moving",
  "Slack Lurker",
  "LinkedIn Doom Scroller",
  "Feature Producer"
]

const DESCRIPTORS = [
  "went absolutely crazy and",
  "went clinically insane and",
  "is truly 10000x engineers and",
  "did not hold back and",
  "is crushing it and",
  "achieved nirvana and",
]

const VALID_REPOS = ["prisere", "shiperate", "cinecircle", "specialstandard",
  "karp-backend", "karp-frontend-react", "karp-frontend-react-native"]

const TARGET_BRANCH = "featurethon"

const REPO_TEAM_MAPPINGS: Record<string, string> = {
  "prisere": "Prisere", "shiperate": "Chiefs", "cinecircle": "CineCircle", "specialstandard": "Special Standard",
  "karp-backend": "Karp", "karp-frontend-react": "Karp", "karp-frontend-react-native": "Karp"
}

function randomChoice<T>(array: T[]): T {
  const val = array[Math.floor(Math.random() * array.length)];
  if (val === undefined) throw new Error("What even happened")
  return val
}

function validate_github_repos(json: any) {
  const repository_name = json.repository.name
  const branch_name: string = json.ref.split("/").slice(2).join("/");
  return VALID_REPOS.includes(repository_name) && branch_name.startsWith(TARGET_BRANCH)
}

function processFeaturethon(json: any): MappingType {
  const commits: any[] = json.commits
  // Create a mapping of a name
  const mappings: MappingType = new Map()

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
        teamName: REPO_TEAM_MAPPINGS[json.repository.name]!,
        headCommitMessage: json.head_commit.message!
      })
    }
  }
  return mappings
}

function buildExcitingSlackMessage(contributors: MappingType): string[] {
  const messages: string[] = []
  for (const contributorName of contributors.keys()) {
    const info = contributors.get(contributorName)!
    const adjectifiedName = randomChoice(ADJECTIVES) + " " + contributorName
    const descriptor = randomChoice(DESCRIPTORS)
    const message = `${adjectifiedName} ${descriptor} commited ${info.numberOfCommits} 
          commit(s) they said ${info.headCommitMessage}`
    messages.push(message)
  }
  return messages
}

async function handleIncomingGithubWebhook(req: Request): Promise<Response> {
  const json: any = await req.json()
  console.log(validate_github_repos(json))
  if (validate_github_repos(json)) {
    await Bun.write("output.txt", JSON.stringify(json, null, 2));
    const contributors = processFeaturethon(json)
    const msgs = buildExcitingSlackMessage(contributors)
    msgs.forEach((msg) => { console.log(msg) })
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
