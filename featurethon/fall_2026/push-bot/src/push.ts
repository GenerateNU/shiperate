// Turns a GitHub push webhook payload into per-contributor stats.

export type Contributor = {
  name: string
  username?: string
  messages: string[]
  added: Set<string>
  removed: Set<string>
  modified: Set<string>
  commits: number
  // Committer-local hour of day (0-23) for each commit, parsed from the ISO timestamp offset.
  hours: number[]
}

export type PushSummary = {
  repo: string
  branch: string
  forced: boolean
  compareUrl?: string
  contributors: Map<string, Contributor>
  totalCommits: number
}

function addAll(target: Set<string>, items: string[] | undefined) {
  for (const item of items ?? []) target.add(item)
}

function localHour(timestamp: string | undefined): number | undefined {
  // GitHub sends e.g. "2026-11-13T03:12:45-05:00" — the hour is already in the committer's local time.
  const match = timestamp?.match(/T(\d{2}):/)
  return match ? parseInt(match[1]!, 10) : undefined
}

export function branchOf(payload: any): string {
  return String(payload?.ref ?? "").replace(/^refs\/heads\//, "")
}

export function summarizePush(payload: any): PushSummary {
  const contributors = new Map<string, Contributor>()
  const commits: any[] = payload.commits ?? []

  for (const commit of commits) {
    const name: string = commit.author?.name ?? "Mystery Contributor"
    const username: string | undefined = commit.author?.username
    const key = username ?? name

    let info = contributors.get(key)
    if (!info) {
      info = { name, username, messages: [], added: new Set(), removed: new Set(), modified: new Set(), commits: 0, hours: [] }
      contributors.set(key, info)
    }
    info.commits += 1
    info.messages.push(String(commit.message ?? ""))
    addAll(info.added, commit.added)
    addAll(info.removed, commit.removed)
    addAll(info.modified, commit.modified)
    const hour = localHour(commit.timestamp)
    if (hour !== undefined) info.hours.push(hour)
  }

  return {
    repo: payload.repository?.name,
    branch: branchOf(payload),
    forced: Boolean(payload.forced),
    compareUrl: payload.compare,
    contributors,
    totalCommits: commits.length,
  }
}
