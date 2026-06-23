export type Status = "active" | "pending" | "archived"
export type Priority = "low" | "medium" | "high"

export type Project = {
  id: string
  name: string
  url: string
  owner: string
  status: Status
  priority: Priority
  enabled: boolean
  progress: number
  budget: number
  notes: string
}

const firstNames = [
  "Olivia",
  "Liam",
  "Emma",
  "Noah",
  "Ava",
  "Ethan",
  "Sophia",
  "Mason",
  "Isabella",
  "Logan",
  "Mia",
  "Lucas",
  "Charlotte",
  "Jackson",
  "Amelia",
  "Aiden",
  "Harper",
  "Elijah",
  "Evelyn",
  "James",
]

const lastNames = [
  "Carter",
  "Reed",
  "Bishop",
  "Hayes",
  "Morgan",
  "Bennett",
  "Foster",
  "Coleman",
  "Reyes",
  "Patel",
  "Nguyen",
  "Brooks",
  "Sullivan",
  "Russell",
  "Diaz",
  "Murphy",
  "Powell",
  "Ramirez",
  "Wood",
  "Barnes",
]

const projectWords = [
  "Atlas",
  "Beacon",
  "Cobalt",
  "Drift",
  "Ember",
  "Falcon",
  "Granite",
  "Harbor",
  "Ignite",
  "Juniper",
  "Keystone",
  "Lumen",
  "Meridian",
  "Nimbus",
  "Onyx",
  "Pioneer",
  "Quartz",
  "Relay",
  "Summit",
  "Tempo",
]

const projectSuffix = [
  "Dashboard",
  "Platform",
  "Migration",
  "Redesign",
  "API",
  "Mobile App",
  "Analytics",
  "Pipeline",
  "Sync",
  "Portal",
]

const statuses: Status[] = ["active", "pending", "archived"]
const priorities: Priority[] = ["low", "medium", "high"]

const noteSamples = [
  "Awaiting design review",
  "Blocked on vendor",
  "On track for Q3",
  "Needs stakeholder sign-off",
  "Ready for QA",
  "Scoping in progress",
  "Dependencies resolved",
  "Pending budget approval",
]

// Simple deterministic pseudo-random generator so the demo data is stable.
function makeRng(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

export function generateProjects(count = 120): Project[] {
  const rng = makeRng(42)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]

  return Array.from({ length: count }, (_, i) => {
    const word = pick(projectWords)
    const suffix = pick(projectSuffix)
    const name = `${word} ${suffix}`
    const owner = `${pick(firstNames)} ${pick(lastNames)}`
    return {
      id: `PRJ-${String(i + 1).padStart(4, "0")}`,
      name,
      url: `https://example.com/projects/${word.toLowerCase()}-${i + 1}`,
      owner,
      status: pick(statuses),
      priority: pick(priorities),
      enabled: rng() > 0.4,
      progress: Math.floor(rng() * 101),
      budget: Math.floor(rng() * 95000) + 5000,
      notes: pick(noteSamples),
    }
  })
}
