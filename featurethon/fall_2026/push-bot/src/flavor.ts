// All the silly words. Add more freely — everything here is picked at random.

export function pick<T>(array: readonly T[]): T {
  const val = array[Math.floor(Math.random() * array.length)]
  if (val === undefined) throw new Error("pick() called on an empty array")
  return val
}

export const TITLES = [
  "🍂 Leaf Pile Diver",
  "🎃 Pumpkin Spice Programmer",
  "🍎 Apple Cider Architect",
  "🧣 Cozy Sweater Coder",
  "🦃 Turkey Day Tryhard",
  "🍁 Maple Syrup Merger",
  "🌰 Acorn Hoarder",
  "🕯️ Candlelit Committer",
  "🧙 GitHub Wizard",
  "💀 Database Necromancer",
  "✨ Vibe Coder",
  "🐉 Dragon Warrior",
  "👀 Slack Lurker",
  "🏭 Feature Factory",
  "🦝 Trash Panda of Prod",
  "🐿️ Squirrel Who Found the Bug",
  "🧪 Mad Scientist",
  "🛸 Galaxy Brain",
  "🪿 Untitled Goose",
  "🫖 Steeped Senior Engineer",
  "🥾 Hiking Boot Hacker",
  "🌽 Corn Maze Navigator",
  "🧛 Night Shift Vampire",
  "🦉 Wise Old Owl",
] as const

export const DESCRIPTORS = [
  "went absolutely feral and",
  "went clinically insane and",
  "did not hold back and",
  "is cooking with gas and",
  "ascended to another plane and",
  "entered flow state and",
  "channeled raw autumnal chaos and",
  "touched grass (it was crunchy) then immediately",
  "drank four pumpkin spice lattes and",
  "jumped into a leaf pile and emerged having",
  "raked up every bug in sight and",
  "ignored every linter warning and",
  "consulted the ancient scrolls and",
  "put on a cozy sweater and",
  "rewrote it in Rust (in their head) and",
  "transcended technical debt and",
  "carved a jack-o'-lantern out of the codebase and",
  "said 'one more commit' four hours ago and",
  "fell into the corn maze and somehow",
  "heard the call of the void and",
] as const

export const VERBS_FOR_COMMITS = [
  "shipped", "unleashed", "yeeted", "harvested", "conjured", "smuggled in",
  "dropped", "lovingly hand-crafted", "slammed down", "deployed",
] as const

// Each template takes the pieces and returns a line of mrkdwn.
export type LineParts = {
  who: string
  commits: number
  team: string
  quote: string
}

export const TEMPLATES: ((p: LineParts) => string)[] = [
  (p) => `*${pick(TITLES)} ${p.who}* ${pick(DESCRIPTORS)} ${pick(VERBS_FOR_COMMITS)} ${plural(p.commits, "commit")}: ${p.quote}.`,
  (p) => `Breaking news from the ${p.team} camp: *${p.who}* (${pick(TITLES)}) just ${pick(VERBS_FOR_COMMITS)} ${plural(p.commits, "commit")}. Witnesses report: ${p.quote}.`,
  (p) => `📜 _And lo, *${p.who}* ${pick(VERBS_FOR_COMMITS)} ${plural(p.commits, "commit")} unto ${p.team}, proclaiming_ ${p.quote}.`,
  (p) => `🎙️ Sources close to *${p.who}* confirm they ${pick(DESCRIPTORS)} ${pick(VERBS_FOR_COMMITS)} ${plural(p.commits, "commit")}. Statement: ${p.quote}.`,
  (p) => `🍂 Fall forecast for ${p.team}: ${plural(p.commits, "commit")} incoming from *${p.who}*, with a high chance of ${p.quote}.`,
]

export const FIRST_BLOOD = [
  "🩸 *FIRST BLOOD!* The featurethon has officially begun.",
  "🔔 *Ding ding ding!* First push of the featurethon is in.",
  "🚀 *Liftoff.* Somebody finally pushed something.",
] as const

export const MILESTONE_LINES = [
  (team: string, n: number) => `🎉 *${team} just hit ${n} commits!* Somebody get them a slice of pie.`,
  (team: string, n: number) => `🏔️ *${team} has climbed to ${n} commits.* The air is thin up here.`,
  (team: string, n: number) => `🎃 *${n} commits for ${team}!* That's one commit per pumpkin in a very large patch.`,
]

export const COMMIT_MILESTONES = [10, 25, 50, 75, 100, 150, 200, 300, 500]

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`
}
