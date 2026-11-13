import * as dotenv from "dotenv"
import { createHmac, timingSafeEqual } from "node:crypto"
import { randomBonus } from "./src/content"
import { buildSlackPayload } from "./src/message"
import { summarizePush } from "./src/push"
import { Scoreboard } from "./src/scoreboard"
import { TARGET_BRANCH, teamForRepo } from "./src/teams"

dotenv.config()

const config = {
  port: process.env.SERVER_PORT ?? "3000",
  slackWebhook: process.env.SLACK_WEBHOOK,
  githubSecret: process.env.GITHUB_WEBHOOK_SECRET,
  scoreboardPath: process.env.SCOREBOARD_PATH,
  // DRY_RUN=1 prints the Slack payload instead of posting it — handy for iterating on content.
  dryRun: process.env.DRY_RUN === "1" || !process.env.SLACK_WEBHOOK,
}

const scoreboard = new Scoreboard(config.scoreboardPath)

function log(fields: Record<string, unknown>) {
  console.log(JSON.stringify(fields))
}

function signatureValid(body: string, header: string | null): boolean {
  if (!config.githubSecret) return true // verification disabled
  if (!header) return false
  const expected = Buffer.from("sha256=" + createHmac("sha256", config.githubSecret).update(body).digest("hex"))
  const actual = Buffer.from(header)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

async function postToSlack(payload: unknown) {
  if (config.dryRun) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }
  const res = await fetch(config.slackWebhook!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`slack responded ${res.status}: ${await res.text()}`)
}

async function handleGithubWebhook(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Ayo don't be here", { status: 405 })

  const body = await req.text()
  if (!signatureValid(body, req.headers.get("x-hub-signature-256"))) {
    log({ msg: "rejected webhook: bad signature" })
    return new Response("bad signature", { status: 401 })
  }

  const event = req.headers.get("x-github-event") ?? "push"
  if (event === "ping") return new Response("pong 🏓")
  if (event !== "push") return new Response(`ignoring ${event}`)

  const payload = JSON.parse(body)
  const push = summarizePush(payload)
  const team = teamForRepo(push.repo)
  if (!team || push.branch !== TARGET_BRANCH || push.totalCommits === 0) {
    log({ msg: "ignored push", repo: push.repo, branch: push.branch, commits: push.totalCommits, known_team: Boolean(team) })
    return new Response("ignored")
  }

  const score = scoreboard.record(team.name, push.totalCommits)
  const bonus = await randomBonus()
  try {
    await postToSlack(buildSlackPayload(push, team, score, bonus))
  } catch (err) {
    log({ msg: "failed to post to slack", repo: push.repo, team: team.name, error: String(err) })
    return new Response("slack post failed", { status: 502 })
  }
  log({ msg: "announced push", repo: push.repo, team: team.name, commits: push.totalCommits, contributors: push.contributors.size, bonus: bonus.caption, dry_run: config.dryRun })
  return new Response("Successfully Hit Response")
}

const server = Bun.serve({
  port: parseInt(config.port, 10),
  routes: {
    "/api/webhooks/github": handleGithubWebhook,
    "/api/scoreboard": () => Response.json(scoreboard.standings()),
  },
  fetch() { return new Response("🍂 nothing to see here") },
})

log({ msg: "featurethon bot running", url: String(server.url), dry_run: config.dryRun, signature_check: Boolean(config.githubSecret) })
