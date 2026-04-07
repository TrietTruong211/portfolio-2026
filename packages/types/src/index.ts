// ── Sanity / Content ─────────────────────────────────────────────────────────

export type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: string
  children: Array<{ _type: 'span'; _key: string; text: string; marks: string[] }>
  markDefs: Array<{ _type: string; _key: string; href?: string }>
}

// Hero / site identity
export type Miscellaneous = {
  name: string
  greeting: string
  title: string
  resume: string | null
  profileImage: string | null
}

// About cards
export type About = {
  title: string
  description: string
  imgUrl: string | null
}

// Portfolio works / projects
export type Work = {
  title: string
  description: string
  projectLink: string | null
  codeLink: string | null
  imgUrl: string | null
  tags: string[]
}

// Work experience nested item (referenced inside Experience)
export type WorkExperienceItem = {
  name: string
  company: string
  desc: string
}

// Experience year group (contains array of WorkExperienceItem)
export type Experience = {
  year: string
  works: WorkExperienceItem[]
}

// Skills
export type Skill = {
  name: string
  bgColor: string | null
  icon: string | null
}

// Contact form submission payload (sent to our API)
export type ContactFormData = {
  name: string
  email: string
  message: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export type ApiUser = {
  id: string
  role: 'owner'
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export type ChatRequest = {
  message: string
  sessionId?: string
}

export type ChatResponse = {
  reply: string
  sessionId: string
}

export type DocumentQueryRequest = {
  message: string
  documentKey?: string
}

export type UploadResponse = {
  ok: true
  key: string
}

export type ApiError = {
  error: string
}

// ── Utility types ─────────────────────────────────────────────────────────────

export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export type Nullable<T> = T | null

export type Optional<T> = T | undefined
