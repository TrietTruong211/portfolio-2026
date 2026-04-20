export type ContactFormData = {
  name: string
  email: string
  message: string
}

export type ChatRequest = {
  message: string
  sessionId?: string
}

export type ChatResponse = {
  response: string
  sessionId: string
  flagForHuman?: boolean
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
