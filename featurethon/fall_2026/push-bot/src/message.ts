// Builds the Slack Block Kit payload for one push.

import { badgesFor } from "./achievements"
import type { Bonus } from "./content"
import { FIRST_BLOOD, MILESTONE_LINES, contributorLine, pick, plural } from "./flavor"
import type { PushSummary } from "./push"
import type { RecordResult } from "./scoreboard"
import type { Team } from "./teams"

const MAX_QUOTE = 280
const MAX_SECTION = 2900 // Slack caps section text at 3000 chars

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…"
}

function quoteOf(messages: string[]): string {
  const lines = messages.map((m) => m.split("\n")[0]!.trim()).filter(Boolean)
  return `"${escape(truncate(lines.join(" / ") || "(no commit message, just vibes)", MAX_QUOTE))}"`
}

export function buildSlackPayload(push: PushSummary, team: Team, score: RecordResult, bonus: Bonus) {
  const blocks: any[] = []
  const teamLabel = `${team.emoji} ${team.name}`

  blocks.push({ type: "header", text: { type: "plain_text", text: `${teamLabel} pushed ${plural(push.totalCommits, "commit")}`, emoji: true } })

  if (score.firstBlood) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: pick(FIRST_BLOOD) } })
  }

  const lines = [...push.contributors.values()].map((c) => {
    const line = contributorLine(escape(c.name), c.commits, quoteOf(c.messages))
    const badges = badgesFor(c, push).map((b) => `${b.emoji} _${b.label}_`)
    return badges.length ? `${line}  ${badges.join("  ")}` : line
  })
  blocks.push({ type: "section", text: { type: "mrkdwn", text: truncate(lines.join("\n\n"), MAX_SECTION) } })

  if (score.milestone) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: pick(MILESTONE_LINES)(team.name, score.milestone) } })
  }

  blocks.push({ type: "divider" })
  if (bonus.kind === "image") {
    blocks.push({ type: "image", image_url: bonus.url, alt_text: truncate(bonus.alt, 2000), title: { type: "plain_text", text: truncate(bonus.caption, 2000), emoji: true } })
  } else {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${bonus.caption}*\n>${escape(bonus.text).replace(/\n/g, "\n>")}` } })
  }

  if (push.compareUrl) {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: `<${push.compareUrl}|view the diff>` }] })
  }

  // `text` is the notification / fallback text.
  return { text: `${teamLabel} pushed ${plural(push.totalCommits, "commit")} to ${push.repo}`, blocks }
}
