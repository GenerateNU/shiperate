// Random "bonus content" attached to each push announcement.
// Each source is a small async function; one is picked at random, and if it fails we fall back to http.cat.

import { pick } from "./flavor"

export type Bonus =
  | { kind: "image", url: string, alt: string, caption: string }
  | { kind: "text", text: string, caption: string }

const TIMEOUT_MS = 3000

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "featurethon-bot", ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`${url} responded ${res.status}`)
  return res.json()
}

const MEME_SUBREDDITS = ["ProgrammerHumor", "softwaregore", "techhumor", "programmingmemes"]

const HTTP_CODES = [100, 200, 201, 202, 204, 301, 302, 304, 400, 401, 403, 404, 405, 409, 410, 418, 420, 429, 500, 501, 502, 503, 504, 508, 599]

type Source = { name: string, weight: number, fetch: () => Promise<Bonus> }

const SOURCES: Source[] = [
  {
    name: "meme", weight: 4, fetch: async () => {
      const sub = pick(MEME_SUBREDDITS)
      const json = await getJson(`https://meme-api.com/gimme/${sub}`)
      if (json.nsfw || json.spoiler || !json.url) throw new Error(`meme from r/${sub} unusable`)
      return { kind: "image", url: json.url, alt: json.title ?? "meme", caption: `🖼️ Meme tax, courtesy of r/${sub}` }
    },
  },
  {
    name: "programming-joke", weight: 2, fetch: async () => {
      const json = await getJson("https://v2.jokeapi.dev/joke/Programming?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit")
      if (json.error) throw new Error("jokeapi error")
      const text = json.type === "twopart" ? `${json.setup}\n${json.delivery}` : json.joke
      return { kind: "text", text, caption: "🃏 Programming joke of the push" }
    },
  },
  {
    name: "dad-joke", weight: 2, fetch: async () => {
      const json = await getJson("https://icanhazdadjoke.com/")
      return { kind: "text", text: json.joke, caption: "👨 Dad joke dispensary" }
    },
  },
  {
    name: "useless-fact", weight: 1, fetch: async () => {
      const json = await getJson("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en")
      return { kind: "text", text: json.text, caption: "🧠 Useless fact you now know" }
    },
  },
  {
    name: "advice", weight: 1, fetch: async () => {
      const json = await getJson("https://api.adviceslip.com/advice")
      return { kind: "text", text: json.slip.advice, caption: "🔮 Unsolicited advice" }
    },
  },
  {
    name: "dog", weight: 1, fetch: async () => {
      const json = await getJson("https://dog.ceo/api/breeds/image/random")
      return { kind: "image", url: json.message, alt: "a very good dog", caption: "🐶 Emotional support dog" }
    },
  },
  {
    name: "http-cat", weight: 1, fetch: async () => httpCat(),
  },
]

function httpCat(): Bonus {
  const code = pick(HTTP_CODES)
  return { kind: "image", url: `https://http.cat/${code}.jpg`, alt: `HTTP ${code} cat`, caption: `🐱 Today's status code: ${code}` }
}

function weightedPick(sources: Source[]): Source {
  const total = sources.reduce((sum, s) => sum + s.weight, 0)
  let roll = Math.random() * total
  for (const s of sources) {
    roll -= s.weight
    if (roll <= 0) return s
  }
  return sources[sources.length - 1]!
}

export async function randomBonus(): Promise<Bonus> {
  const source = weightedPick(SOURCES)
  try {
    return await source.fetch()
  } catch (err) {
    console.warn(JSON.stringify({ msg: "bonus content source failed, falling back to http.cat", source: source.name, error: String(err) }))
    return httpCat()
  }
}
