// Running per-team tally for the featurethon. Kept in memory, and optionally persisted to a
// JSON file (SCOREBOARD_PATH) so a container restart doesn't wipe the standings.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { COMMIT_MILESTONES } from "./flavor"

type TeamScore = { commits: number, pushes: number }
type State = { teams: Record<string, TeamScore>, firstPushSeen: boolean }

export type RecordResult = {
  firstBlood: boolean
  milestone?: number
  standings: [string, TeamScore][]
}

export class Scoreboard {
  private state: State = { teams: {}, firstPushSeen: false }

  constructor(private readonly path?: string) {
    if (path && existsSync(path)) {
      try {
        this.state = JSON.parse(readFileSync(path, "utf8"))
      } catch (err) {
        console.error(JSON.stringify({ msg: "could not read scoreboard, starting fresh", path, error: String(err) }))
      }
    }
  }

  record(team: string, commits: number): RecordResult {
    const firstBlood = !this.state.firstPushSeen
    this.state.firstPushSeen = true

    const score = (this.state.teams[team] ??= { commits: 0, pushes: 0 })
    const before = score.commits
    score.commits += commits
    score.pushes += 1

    // Highest milestone crossed by this push, if any.
    const milestone = COMMIT_MILESTONES.filter((m) => before < m && score.commits >= m).at(-1)

    this.save()
    return { firstBlood, milestone, standings: this.standings() }
  }

  standings(): [string, TeamScore][] {
    return Object.entries(this.state.teams).sort(([, a], [, b]) => b.commits - a.commits)
  }

  private save() {
    if (!this.path) return
    try {
      mkdirSync(dirname(this.path), { recursive: true })
      writeFileSync(this.path, JSON.stringify(this.state, null, 2))
    } catch (err) {
      console.error(JSON.stringify({ msg: "could not persist scoreboard", path: this.path, error: String(err) }))
    }
  }
}
