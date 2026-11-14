import type { Contributor, PushSummary } from "./push"

export type Badge = { emoji: string, label: string }

type Rule = (c: Contributor, push: PushSummary) => Badge | undefined

const firstLines = (c: Contributor) => c.messages.map((m) => m.split("\n")[0]!.trim())

// Only rare things get a badge, so one showing up means something. Each rule returns a badge or nothing.
const RULES: Rule[] = [
  (_, p) => p.forced ? { emoji: "💪", label: "Force Pusher" } : undefined,
  (c) => c.commits >= 10 ? { emoji: "🏭", label: "Commit Factory" } : undefined,
  (c) => c.hours.some((h) => h >= 0 && h < 5) ? { emoji: "🦉", label: "Night Owl" } : undefined,
  (c) => c.hours.some((h) => h >= 5 && h < 8) ? { emoji: "🐓", label: "Early Bird" } : undefined,
  (c) => c.removed.size > 0 && c.removed.size >= c.added.size ? { emoji: "🧹", label: "Marie Kondo" } : undefined,
  (c) => c.modified.size >= 20 ? { emoji: "🌪️", label: "Blast Radius" } : undefined,
  (c) => firstLines(c).some((m) => m.length > 0 && m.length <= 4) ? { emoji: "🤐", label: "Person of Few Words" } : undefined,
  (c) => firstLines(c).some((m) => m.length >= 100) ? { emoji: "📖", label: "Novelist" } : undefined,
]

const MAX_BADGES = 1

// Earned badges, shuffled and capped at MAX_BADGES per contributor.
export function badgesFor(c: Contributor, push: PushSummary): Badge[] {
  const earned = RULES.map((rule) => rule(c, push)).filter((b): b is Badge => b !== undefined)
  for (let i = earned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[earned[i], earned[j]] = [earned[j]!, earned[i]!]
  }
  return earned.slice(0, MAX_BADGES)
}
