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
