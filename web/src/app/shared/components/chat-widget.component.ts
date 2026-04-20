import type { ElementRef, OnInit } from '@angular/core'
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ChatService } from '../../core/services/chat.service'

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styleUrl: './chat-widget.component.scss',
  template: `
    @if (isBrowser) {
      <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        <!-- ── Chat panel ──────────────────────────────────────────── -->
        @if (chat.isPanelOpen()) {
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chat with Chris's AI"
            class="chat-panel"
          >
            <!-- Header -->
            <div class="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
              <div
                aria-hidden="true"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              >
                CA
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-foreground">Chris's AI</p>
                <p class="text-xs text-muted-foreground">Ask me anything about Chris</p>
              </div>
              <button
                type="button"
                (click)="chat.closePanel()"
                aria-label="Close chat"
                class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground
                       transition-colors hover:bg-muted hover:text-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Messages -->
            <div
              #messagesContainer
              class="chat-messages flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions"
            >
              <!-- Starter prompts (shown before first message) -->
              @if (!chat.hasMessages() && !chat.isLoading()) {
                <div class="flex flex-col gap-2">
                  <p class="mb-1 text-center text-xs text-muted-foreground">Try asking:</p>
                  @for (prompt of starterPrompts; track prompt) {
                    <button
                      type="button"
                      class="starter-chip rounded-lg border border-border bg-muted/50 px-3 py-2
                             text-left text-xs text-muted-foreground transition-all duration-150
                             hover:border-primary/50 hover:bg-muted hover:text-foreground
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      (click)="sendStarter(prompt)"
                    >
                      {{ prompt }}
                    </button>
                  }
                </div>
              }

              <!-- Message list -->
              @for (msg of chat.messages(); track $index) {
                @if (msg.role === 'user') {
                  <div class="flex justify-end">
                    <div class="max-w-[72%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else {
                  <div class="flex items-start gap-2">
                    <div
                      aria-hidden="true"
                      class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                             bg-primary text-xs font-bold text-primary-foreground"
                    >
                      CA
                    </div>
                    <div class="flex max-w-[78%] flex-col gap-1">
                      <div
                        class="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-foreground leading-relaxed"
                        [class.text-destructive]="msg.isError"
                        [innerHTML]="renderMarkdown(msg.content)"
                      ></div>
                      @if (msg.flagForHuman) {
                        <p class="px-1 text-xs text-amber-500">
                          For a more personal response,
                          <a
                            href="mailto:triet.truongminh211@gmail.com"
                            class="underline underline-offset-2 hover:text-amber-400"
                          >email me directly</a>.
                        </p>
                      }
                    </div>
                  </div>
                }
              }

              <!-- Typing indicator -->
              @if (chat.isLoading()) {
                <div class="flex items-start gap-2" aria-label="Chris's AI is typing">
                  <div
                    aria-hidden="true"
                    class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                           bg-primary text-xs font-bold text-primary-foreground"
                  >
                    CA
                  </div>
                  <div class="rounded-2xl rounded-tl-sm bg-muted px-3 py-2.5">
                    <div class="flex items-center gap-1">
                      <span class="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                      <span class="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                      <span class="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                    </div>
                  </div>
                </div>
              }

              <!-- Scroll anchor -->
              <div #scrollAnchor></div>
            </div>

            <!-- Input -->
            <form
              (ngSubmit)="handleSubmit()"
              class="shrink-0 border-t border-border p-3"
              aria-label="Chat input"
            >
              <div class="flex items-center gap-2">
                <label for="chat-input" class="sr-only">Type your message</label>
                <input
                  #chatInput
                  id="chat-input"
                  type="text"
                  name="chatInput"
                  [(ngModel)]="inputValue"
                  placeholder="Ask me anything..."
                  autocomplete="off"
                  [disabled]="chat.isLoading()"
                  class="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm
                         text-foreground placeholder:text-muted-foreground
                         focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary
                         transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  [disabled]="!inputValue.trim() || chat.isLoading()"
                  aria-label="Send message"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary
                         text-primary-foreground transition-all hover:brightness-110
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                         focus-visible:ring-offset-2 focus-visible:ring-offset-background
                         disabled:pointer-events-none disabled:opacity-35"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        }

        <!-- ── FAB toggle button ────────────────────────────────────── -->
        <button
          type="button"
          (click)="chat.togglePanel()"
          [attr.aria-expanded]="chat.isPanelOpen()"
          [attr.aria-label]="chat.isPanelOpen() ? 'Close chat' : 'Chat with Chris\\'s AI'"
          class="flex h-14 w-14 items-center justify-center rounded-full bg-primary
                 text-primary-foreground shadow-lg shadow-primary/30
                 transition-all duration-200 hover:scale-105 hover:brightness-110
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          @if (chat.isPanelOpen()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          }
        </button>

      </div>
    }
  `,
})
export class ChatWidgetComponent implements OnInit {
  protected readonly chat = inject(ChatService)
  private readonly platformId = inject(PLATFORM_ID)
  protected readonly isBrowser = isPlatformBrowser(this.platformId)

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLElement>
  @ViewChild('chatInput')    private chatInputEl?: ElementRef<HTMLInputElement>

  protected inputValue = ''

  protected readonly starterPrompts = [
    "What technologies does Chris work with?",
    "Tell me about Chris's experience",
    "What projects has Chris built?",
    "Is Chris open to new opportunities?",
    "How can I contact Chris?",
  ]

  constructor() {
    effect(() => {
      this.chat.messages()
      this.chat.isLoading()
      setTimeout(() => { this.scrollToBottom() }, 0)
    })

    effect(() => {
      if (this.chat.isPanelOpen()) {
        setTimeout(() => this.chatInputEl?.nativeElement.focus(), 50)
      }
    })
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.chat.initSession()
    }
  }

  protected handleSubmit(): void {
    const text = this.inputValue.trim()
    if (!text) return
    this.inputValue = ''
    void this.chat.sendMessage(text)
  }

  protected sendStarter(prompt: string): void {
    void this.chat.sendMessage(prompt)
  }

  protected renderMarkdown(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:brightness-110">$1</a>',
      )
      .replace(/\n/g, '<br>')
  }

  private scrollToBottom(): void {
    this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' })
  }
}
