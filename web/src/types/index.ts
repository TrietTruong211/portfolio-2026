export type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: string
  children: Array<{ _type: 'span'; _key: string; text: string; marks: string[] }>
  markDefs: Array<{ _type: string; _key: string; href?: string }>
}

export type Miscellaneous = {
  name: string
  greeting: string
  title: string
  resume: string | null
  profileImage: string | null
}

export type About = {
  title: string
  description: string
  imgUrl: string | null
}

export type Work = {
  title: string
  description: string
  projectLink: string | null
  codeLink: string | null
  imgUrl: string | null
  tags: string[]
}

export type WorkExperienceItem = {
  name: string
  company: string
  desc: string
}

export type Experience = {
  year: string
  works: WorkExperienceItem[]
}

export type Skill = {
  name: string
  bgColor: string | null
  icon: string | null
}

export type Testimonial = {
  feedback: string
  name: string
  company: string
  imgUrl: string | null
}

export type Brand = {
  name: string
  imgUrl: string | null
  url: string | null
}

export type FooterInfo = {
  email: string | null
  phoneNumber: string | null
}

export type ContactFormData = {
  name: string
  email: string
  message: string
}

export type ApiUser = {
  id: string
  role: 'user' | 'admin'
}

export type ContactSubmission = {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

export type ChatMessage = {
  role: 'user' | 'bot'
  content: string
  flagForHuman?: boolean
  isError?: boolean
}

export type ChatApiResponse = {
  reply: string
  sessionId: string
  flagForHuman?: boolean
}
