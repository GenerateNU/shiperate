// Fires a fixture push payload at the local bot.
// Usage: bun run sample [fixture path] [repo override]
//   bun run sample                         -> fixtures/push.json
//   bun run sample fixtures/push.json boutline

import { createHmac } from "node:crypto"

const [fixturePath = "fixtures/push.json", repo] = process.argv.slice(2)
const payload = await Bun.file(fixturePath).json()
if (repo) payload.repository.name = repo
const body = JSON.stringify(payload)

const headers: Record<string, string> = { "Content-Type": "application/json", "X-GitHub-Event": "push" }
const secret = process.env.GITHUB_WEBHOOK_SECRET
if (secret) headers["X-Hub-Signature-256"] = "sha256=" + createHmac("sha256", secret).update(body).digest("hex")

const port = process.env.SERVER_PORT ?? "3000"
const res = await fetch(`http://localhost:${port}/api/webhooks/github`, { method: "POST", headers, body })
console.log(res.status, await res.text())
