import * as dotenv from "dotenv"

const VALID_REPOS = ["prisere", "shiperate", "cinecircle", "specialstandard",
  "karp-backend", "karp-frontend-react", "karp-frontend-react-native"]

const TARGET_BRANCH = "featurethon"

function validate_github_repos(json: any) {
  const repository_name = json.repository.name
  const branch_name: string = json.ref.split("/").slice(2).join("/");
  return VALID_REPOS.includes(repository_name) && branch_name.startsWith(TARGET_BRANCH)
}

async function handleIncomingGithubWebhook(req: Request): Promise<Response> {
  const json: any = await req.json()
  await Bun.write("output.txt", JSON.stringify(json));
  if (validate_github_repos(json)) {
    console.log("Should be valid")
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
