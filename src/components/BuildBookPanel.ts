import { Panel } from './Panel';
import { buildBookUrl } from '@/services/build-book-url';
import { LANGUAGES } from '@/services/i18n';
import { isLoggedIn, getCurrentUser } from '@/services/auth';
import { showAuthModal } from '@/components/AuthModal';
import { submitBookRequest } from '@/services/book-request-submit';

const THROTTLE_KEY = 'b5k-request-timestamps';

export class BuildBookPanel extends Panel {
  private topicInput!: HTMLInputElement;
  private codexTypeSelect!: HTMLSelectElement;
  private languageSelect!: HTMLSelectElement;
  private scoreDisplay!: HTMLSpanElement;
  private categoryInput!: HTMLInputElement;
  private countryInput!: HTMLInputElement;
  private currentScore = 0;

  constructor() {
    super({ id: 'build-book', title: 'Request A Book Build', className: '' });
    this.render();
    this.listenForPrefill();
  }

  private createLabel(text: string, className?: string): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = className ?? 'build-book-label';
    label.textContent = text;
    return label;
  }

  private createInput(id: string, placeholder: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'build-book-input';
    input.id = id;
    input.placeholder = placeholder;
    return input;
  }

  private render(): void {
    const content = this.content;
    content.textContent = '';

    const form = document.createElement('form');
    form.className = 'build-book-form';
    form.autocomplete = 'off';

    // Topic
    const topicLabel = this.createLabel('Topic');
    this.topicInput = this.createInput('bbf-topic', 'Enter a topic...');
    topicLabel.appendChild(this.topicInput);
    form.appendChild(topicLabel);

    // CodexType
    const codexTypeLabel = this.createLabel('CodexType');
    this.codexTypeSelect = document.createElement('select');
    this.codexTypeSelect.className = 'build-book-select';
    this.codexTypeSelect.id = 'bbf-codextype';
    const codexTypes: [string, string][] = [
      ['lite-briefing', 'Lite Briefing'],
      ['deep-history', 'Deep History'],
      ['deep-technical', 'Deep Technical'],
      ['executive-summary', 'Executive Summary'],
    ];
    for (const [value, text] of codexTypes) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      this.codexTypeSelect.appendChild(opt);
    }
    codexTypeLabel.appendChild(this.codexTypeSelect);
    form.appendChild(codexTypeLabel);

    // Language
    const languageLabel = this.createLabel('Language');
    this.languageSelect = document.createElement('select');
    this.languageSelect.className = 'build-book-select';
    this.languageSelect.id = 'bbf-language';
    for (const lang of LANGUAGES) {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = `${lang.flag} ${lang.label}`;
      if (lang.code === 'en') opt.selected = true;
      this.languageSelect.appendChild(opt);
    }
    languageLabel.appendChild(this.languageSelect);
    form.appendChild(languageLabel);

    // Category + Country row
    const row = document.createElement('div');
    row.className = 'build-book-row';

    const catLabel = this.createLabel('Category', 'build-book-label build-book-half');
    this.categoryInput = this.createInput('bbf-category', 'Optional');
    catLabel.appendChild(this.categoryInput);
    row.appendChild(catLabel);

    const countryLabel = this.createLabel('Country', 'build-book-label build-book-half');
    this.countryInput = this.createInput('bbf-country', 'Optional');
    countryLabel.appendChild(this.countryInput);
    row.appendChild(countryLabel);

    form.appendChild(row);

    // Footer row -- score + submit
    const footer = document.createElement('div');
    footer.className = 'build-book-row build-book-footer';

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'build-book-score';
    scoreSpan.textContent = 'Score: ';
    this.scoreDisplay = document.createElement('span');
    this.scoreDisplay.id = 'bbf-score';
    this.scoreDisplay.textContent = '0';
    scoreSpan.appendChild(this.scoreDisplay);
    footer.appendChild(scoreSpan);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'build-book-submit';
    submitBtn.textContent = 'Request';
    footer.appendChild(submitBtn);

    form.appendChild(footer);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    content.appendChild(form);
  }

  private async handleSubmit(): Promise<void> {
    const topic = this.topicInput.value.trim();
    if (!topic) {
      this.topicInput.focus();
      return;
    }

    // Auth gate
    if (!isLoggedIn()) {
      await showAuthModal();
      if (!isLoggedIn()) return; // user cancelled
    }

    // Flood throttle
    const timestamps: number[] = JSON.parse(localStorage.getItem(THROTTLE_KEY) || '[]');
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;
    const recentHour = timestamps.filter(t => t > hourAgo);
    const recentDay = timestamps.filter(t => t > dayAgo);

    if (recentHour.length >= 3) {
      const oldestInHour = Math.min(...recentHour);
      const minutesLeft = Math.ceil((oldestInHour + 3600000 - now) / 60000);
      this.showToast(`Hourly limit reached. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`, true);
      return;
    }
    if (recentDay.length >= 10) {
      this.showToast('Daily limit reached (10 requests). Try again tomorrow.', true);
      return;
    }

    // Submit webhook
    const user = getCurrentUser();
    await submitBookRequest({
      topic,
      codexType: this.codexTypeSelect.value,
      score: this.currentScore,
      category: this.categoryInput.value.trim() || undefined,
      country: this.countryInput.value.trim() || undefined,
      language: this.languageSelect.value !== 'en' ? this.languageSelect.value : undefined,
      username: user?.username ?? 'anonymous',
      email: user?.email ?? '',
    });

    // Save timestamp
    timestamps.push(now);
    localStorage.setItem(THROTTLE_KEY, JSON.stringify(timestamps.filter(t => t > dayAgo)));

    // Open Codexes Factory URL
    const url = buildBookUrl({
      topic,
      codexType: this.codexTypeSelect.value,
      score: this.currentScore,
      category: this.categoryInput.value.trim() || undefined,
      country: this.countryInput.value.trim() || undefined,
      language: this.languageSelect.value !== 'en' ? this.languageSelect.value : undefined,
    });
    window.open(url, '_blank', 'noopener');

    this.showToast('Request submitted!');
  }

  private showToast(message: string, isError = false): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      padding: 10px 20px; border-radius: 6px; z-index: 10000;
      color: #fff; font-size: 14px; pointer-events: none;
      background: ${isError ? '#c0392b' : '#27ae60'};
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    setTimeout(() => { toast.remove(); }, 3000);
  }

  /** Listen for custom events from other panels to pre-fill the form. */
  private listenForPrefill(): void {
    window.addEventListener('build-book-prefill', ((e: CustomEvent<{
      topic?: string;
      codexType?: string;
      score?: number;
      category?: string;
      country?: string;
      language?: string;
    }>) => {
      const d = e.detail;
      if (d.topic) this.topicInput.value = d.topic;
      if (d.codexType) this.codexTypeSelect.value = d.codexType;
      if (d.score != null) {
        this.currentScore = d.score;
        this.scoreDisplay.textContent = String(d.score);
      }
      if (d.category) this.categoryInput.value = d.category;
      if (d.country) this.countryInput.value = d.country;
      if (d.language) this.languageSelect.value = d.language;

      // Scroll panel into view
      this.getElement().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }) as EventListener);
  }

  /** Programmatically set the score (called from book-worthiness engine). */
  setScore(score: number): void {
    this.currentScore = score;
    this.scoreDisplay.textContent = String(score);
  }
}
