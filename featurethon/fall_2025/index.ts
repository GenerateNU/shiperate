import * as dotenv from "dotenv"

const VALID_REPOS = ["prisere", "shiperate", "cinecircle", "specialstandard",
  "karp-backend", "karp-frontend-react", "karp-frontend-react-native"]

function validate_github_repos(repository: any) {
  return VALID_REPOS.includes(repository.name)
}

async function handleIncomingGithubWebhook(req: Request): Promise<Response> {
  const json: any = await req.json()
  const respository = json.repository
  await Bun.write("output.txt", JSON.stringify(respository));
  if (validate_github_repos(respository)) {

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
