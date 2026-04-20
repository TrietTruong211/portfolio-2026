import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { ChatMessage, ChatApiResponse } from '../../../types/index'

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient)

  private readonly _messages  = signal<ChatMessage[]>([])
  private readonly _isLoading = signal(false)
  private readonly _isPanelOpen = signal(false)

  readonly messages     = this._messages.asReadonly()
  readonly isLoading    = this._isLoading.asReadonly()
  readonly isPanelOpen  = this._isPanelOpen.asReadonly()
  readonly hasMessages  = computed(() => this._messages().length > 0)

  private sessionId: string | null = null

  initSession(): void {
    if (!this.sessionId) {
      this.sessionId = crypto.randomUUID()
    }
  }

  togglePanel(): void {
    this._isPanelOpen.update(v => !v)
  }

  closePanel(): void {
    this._isPanelOpen.set(false)
  }

  async sendMessage(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed || this._isLoading()) return

    this._messages.update(msgs => [...msgs, { role: 'user', content: trimmed }])
    this._isLoading.set(true)

    console.log('Sending message to chat API:', trimmed)
    console.log('Current session ID:', this.sessionId)
    try {
      const res = await firstValueFrom(
        this.http.post<ChatApiResponse>(`${environment.apiUrl}/api/chat`, {
          message: trimmed,
          ...(this.sessionId ? { sessionId: this.sessionId } : {}),
        })
      )
      if (res.sessionId) this.sessionId = res.sessionId
      this._messages.update(msgs => [
        ...msgs,
        { role: 'bot', content: res.reply, flagForHuman: res.flagForHuman },
      ])
    } catch {
      this._messages.update(msgs => [
        ...msgs,
        {
          role: 'bot',
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          isError: true,
        },
      ])
    } finally {
      this._isLoading.set(false)
    }
  }
}
