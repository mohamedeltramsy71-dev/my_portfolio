import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, signal, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-ask-me',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ask-me.component.html',
  styleUrls: ['./ask-me.component.scss'],
})
export class AskMeComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hey! I'm Mohamed's AI. Ask me anything about his projects, skills, or availability 👋",
    },
  ]);

  input = '';
  loading = signal(false);
  streaming = signal(false);

  readonly suggestions = [
    "What's your strongest project?",
    "Frontend or backend — which do you prefer?",
    "Are you available for freelance?",
    "What's your experience with AI?",
  ];

  get isLight(): boolean {
    return document.documentElement.hasAttribute('data-theme');
  }

  overlayVisible = false;
  overlayWord = '';
  overlayPhase: 'in' | 'hold' | 'out' = 'in';
  private scrollLocked = false;
  private t1: any; private t2: any; private t3: any;
  private wheelHandler = (e: WheelEvent) => this.onWheel(e);

  constructor(private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.scrollLocked = true;
    setTimeout(() => { this.scrollLocked = false; }, 700);
    window.addEventListener('wheel', this.wheelHandler, { passive: true });
  }

  ngOnDestroy() {
    clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3);
    window.removeEventListener('wheel', this.wheelHandler);
  }

  onWheel(e: WheelEvent) {
    if (this.scrollLocked) return;
    const atTop = window.scrollY <= 0;
    if (e.deltaY < -30 && atTop) this.triggerTransition('Projects', '/projects');
  }

  private triggerTransition(word: string, route: string) {
    this.scrollLocked = true;
    this.overlayWord = word;
    this.overlayPhase = 'in';
    this.overlayVisible = true;
    this.t1 = setTimeout(() => { this.overlayPhase = 'hold'; }, 250);
    this.t2 = setTimeout(() => { this.overlayPhase = 'out'; }, 900);
    this.t3 = setTimeout(() => {
      this.overlayVisible = false;
      this.router.navigate([route]);
    }, 1300);
  }

  async send(text?: string) {
    const message = (text ?? this.input).trim();
    if (!message || this.loading()) return;

    this.input = '';
    this.messages.update(msgs => [...msgs, { role: 'user', content: message }]);
    this.loading.set(true);
    this.scrollToBottom();

    // أضف message فاضية للـ assistant هتتملى بالـ streaming
    this.messages.update(msgs => [...msgs, { role: 'assistant', content: '' }]);
    const aiIndex = this.messages().length - 1;

    try {
      const history = this.messages()
        .slice(0, -1)
        .filter(m => m.content)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error('Bad response');

      this.loading.set(false);
      this.streaming.set(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const { token } = JSON.parse(line.replace('data: ', '').trim());
            if (token) {
              fullText += token;
              // تحديث الـ message الأخيرة بالـ streaming
              this.messages.update(msgs => {
                const updated = [...msgs];
                updated[aiIndex] = { role: 'assistant', content: fullText };
                return updated;
              });
              this.scrollToBottom();
            }
          } catch { }
        }
      }

      // لو الرد فضي (حاجة غلط)
      if (!fullText) {
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiIndex] = { role: 'assistant', content: "Hmm, couldn't get a response — try again!" };
          return updated;
        });
      }

    } catch {
      this.messages.update(msgs => {
        const updated = [...msgs];
        updated[aiIndex] = {
          role: 'assistant',
          content: 'Something went wrong on my end. Please try again!',
        };
        return updated;
      });
    } finally {
      this.loading.set(false);
      this.streaming.set(false);
      this.scrollToBottom();
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }
}