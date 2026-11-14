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
  "🤪 Goofy Goober",
  "👺 Sherm Goblin",
  "⚔️ Sherm Warrior",
  "🏚️ Sherm Dweller",
  "⛰️ Mountain Moving",
  "📱 LinkedIn Doom Scroller",
  "🏭 Feature Producer",
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
  "went absolutely crazy and",
  "is truly a 10000x engineer and",
  "is crushing it and",
  "achieved nirvana and",
  "absolutely shipped it and",
  "channeled raw chaos and",
  "touched grass then immediately",
  "deleted production accidentally but still",
  "rage-coded at 3am and",
  "ignored all warnings and",
  "merged directly to main and",
  "refactored the entire codebase and",
  "solved P=NP while also",
] as const

export const VERBS_FOR_COMMITS = [
  "shipped", "unleashed", "yeeted", "harvested", "conjured", "smuggled in",
  "dropped", "lovingly hand-crafted", "slammed down", "deployed",
] as const

// How the team feels about it.
export const PAST_TENSE_VERBS = [
  "mystified", "bamboozled", "flabbergasted", "bewildered", "stunned",
  "amazed", "astounded", "shocked", "impressed", "gobsmacked",
  "devastated", "heartbroken", "crushed", "disappointed", "dejected",
  "dismayed", "disheartened", "crestfallen", "despondent", "melancholy",
] as const

// One line per contributor:
// *TITLE Name* DESCRIPTOR VERB N commits: "message" The TEAM team is absolutely FEELING.
export function contributorLine(who: string, commits: number, quote: string, team: string): string {
  return `*${pick(TITLES)} ${who}* ${pick(DESCRIPTORS)} ${pick(VERBS_FOR_COMMITS)} ${plural(commits, "commit")}: ${quote} The ${team} team is absolutely ${pick(PAST_TENSE_VERBS)}.`
}

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
