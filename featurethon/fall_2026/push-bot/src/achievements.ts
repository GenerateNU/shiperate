import type { Contributor, PushSummary } from "./push"

export type Badge = { emoji: string, label: string }

type Rule = (c: Contributor, push: PushSummary) => Badge | undefined

const firstLines = (c: Contributor) => c.messages.map((m) => m.split("\n")[0]!.trim())
const anyMessage = (c: Contributor, re: RegExp) => firstLines(c).some((m) => re.test(m))

// Order matters only for display. Add rules freely; each returns a badge or nothing.
const RULES: Rule[] = [
  (c) => c.username?.endsWith("[bot]") ? { emoji: "🤖", label: "Robot Overlord" } : undefined,
  (_, p) => p.forced ? { emoji: "💪", label: "Force Pusher (we saw that)" } : undefined,
  (c) => c.commits >= 10 ? { emoji: "🏭", label: "Commit Factory" } : c.commits >= 5 ? { emoji: "🔁", label: "Combo Streak" } : undefined,
  (c) => c.hours.some((h) => h >= 0 && h < 5) ? { emoji: "🦉", label: "Night Owl" } : undefined,
  (c) => c.hours.some((h) => h >= 5 && h < 8) ? { emoji: "🐓", label: "Early Bird" } : undefined,
  (c) => c.added.size >= 10 ? { emoji: "🌱", label: "File Farmer" } : undefined,
  (c) => c.removed.size > 0 && c.removed.size >= c.added.size ? { emoji: "🧹", label: "Marie Kondo" } : undefined,
  (c) => c.modified.size >= 20 ? { emoji: "🌪️", label: "Blast Radius" } : undefined,
  (c) => [...c.added, ...c.modified].some((f) => /(^|\/)(test|tests|__tests__)\/|\.(test|spec)\.[jt]sx?$|_test\.go$/.test(f)) ? { emoji: "🧪", label: "Actually Wrote Tests" } : undefined,
  (c) => [...c.added, ...c.modified].some((f) => /\.md$/i.test(f)) ? { emoji: "📚", label: "Documentation Enjoyer" } : undefined,
  (c) => [...c.modified].some((f) => /(package\.json|bun\.lock|go\.mod|Podfile|requirements\.txt|pyproject\.toml)$/.test(f)) ? { emoji: "📦", label: "Dependency Wrangler" } : undefined,
  (c) => anyMessage(c, /^merge (pull request|branch)/i) ? { emoji: "🔀", label: "Merge Master" } : undefined,
  (c) => anyMessage(c, /\b(fix|bug|hotfix|patch)\b/i) ? { emoji: "🐛", label: "Bug Exterminator" } : undefined,
  (c) => anyMessage(c, /\b(wip|temp|tmp|asdf|test commit)\b/i) ? { emoji: "🚧", label: "WIP Wizard" } : undefined,
  (c) => anyMessage(c, /\b(revert)\b/i) ? { emoji: "⏪", label: "Time Traveler" } : undefined,
  (c) => anyMessage(c, /!{2,}|\b(finally|please|why)\b/i) ? { emoji: "😤", label: "Emotionally Invested" } : undefined,
  (c) => firstLines(c).some((m) => m.length > 0 && m.length <= 4) ? { emoji: "🤐", label: "Person of Few Words" } : undefined,
  (c) => firstLines(c).some((m) => m.length >= 100) ? { emoji: "📖", label: "Novelist" } : undefined,
  (c) => anyMessage(c, /\p{Extended_Pictographic}/u) ? { emoji: "🎨", label: "Emoji Artist" } : undefined,
]

const MAX_BADGES = 3

// Earned badges, shuffled and capped so one chaotic push doesn't become a wall of emoji.
export function badgesFor(c: Contributor, push: PushSummary): Badge[] {
  const earned = RULES.map((rule) => rule(c, push)).filter((b): b is Badge => b !== undefined)
  for (let i = earned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[earned[i], earned[j]] = [earned[j]!, earned[i]!]
  }
  return earned.slice(0, MAX_BADGES)
}
