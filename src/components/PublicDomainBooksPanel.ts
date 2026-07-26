import { Panel } from './Panel';
import { LANGUAGES } from '@/services/i18n';
import { getApiBaseUrl } from '@/services/runtime';

interface PublicDomainBook {
  title: string;
  author: string;
  language: string;
  url: string;
  downloadUrl?: string;
  source: 'gutenberg' | 'standard-ebooks' | 'internet-archive';
}

// Curated list of popular public domain titles across 30+ languages
const CURATED_BOOKS: PublicDomainBook[] = [
  // English
  { title: 'Pride and Prejudice', author: 'Jane Austen', language: 'en', url: 'https://www.gutenberg.org/ebooks/1342', downloadUrl: 'https://www.gutenberg.org/files/1342/1342-h/1342-h.htm', source: 'gutenberg' },
  { title: 'Moby Dick', author: 'Herman Melville', language: 'en', url: 'https://www.gutenberg.org/ebooks/2701', downloadUrl: 'https://www.gutenberg.org/files/2701/2701-h/2701-h.htm', source: 'gutenberg' },
  { title: 'A Tale of Two Cities', author: 'Charles Dickens', language: 'en', url: 'https://www.gutenberg.org/ebooks/98', source: 'gutenberg' },
  { title: 'Frankenstein', author: 'Mary Shelley', language: 'en', url: 'https://www.gutenberg.org/ebooks/84', source: 'gutenberg' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', language: 'en', url: 'https://www.gutenberg.org/ebooks/64317', source: 'gutenberg' },
  { title: 'Adventures of Huckleberry Finn', author: 'Mark Twain', language: 'en', url: 'https://www.gutenberg.org/ebooks/76', source: 'gutenberg' },
  { title: 'Dracula', author: 'Bram Stoker', language: 'en', url: 'https://www.gutenberg.org/ebooks/345', source: 'gutenberg' },
  { title: 'Jane Eyre', author: 'Charlotte Brontë', language: 'en', url: 'https://www.gutenberg.org/ebooks/1260', source: 'gutenberg' },
  { title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', language: 'en', url: 'https://www.gutenberg.org/ebooks/174', source: 'gutenberg' },
  { title: 'Wuthering Heights', author: 'Emily Brontë', language: 'en', url: 'https://www.gutenberg.org/ebooks/768', source: 'gutenberg' },
  { title: 'The War of the Worlds', author: 'H. G. Wells', language: 'en', url: 'https://www.gutenberg.org/ebooks/36', source: 'gutenberg' },
  { title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', language: 'en', url: 'https://www.gutenberg.org/ebooks/11', source: 'gutenberg' },
  { title: 'The Odyssey', author: 'Homer (tr. Butler)', language: 'en', url: 'https://www.gutenberg.org/ebooks/1727', source: 'gutenberg' },
  { title: 'The Iliad', author: 'Homer (tr. Butler)', language: 'en', url: 'https://www.gutenberg.org/ebooks/2199', source: 'gutenberg' },
  { title: 'Heart of Darkness', author: 'Joseph Conrad', language: 'en', url: 'https://www.gutenberg.org/ebooks/219', source: 'gutenberg' },
  // French
  { title: 'Les Misérables', author: 'Victor Hugo', language: 'fr', url: 'https://www.gutenberg.org/ebooks/17489', source: 'gutenberg' },
  { title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', language: 'fr', url: 'https://www.gutenberg.org/ebooks/17989', source: 'gutenberg' },
  { title: 'Vingt mille lieues sous les mers', author: 'Jules Verne', language: 'fr', url: 'https://www.gutenberg.org/ebooks/5097', source: 'gutenberg' },
  { title: 'Madame Bovary', author: 'Gustave Flaubert', language: 'fr', url: 'https://www.gutenberg.org/ebooks/14155', source: 'gutenberg' },
  { title: 'Les Fleurs du mal', author: 'Charles Baudelaire', language: 'fr', url: 'https://www.gutenberg.org/ebooks/6099', source: 'gutenberg' },
  // German
  { title: 'Faust', author: 'Johann Wolfgang von Goethe', language: 'de', url: 'https://www.gutenberg.org/ebooks/2229', source: 'gutenberg' },
  { title: 'Die Verwandlung', author: 'Franz Kafka', language: 'de', url: 'https://www.gutenberg.org/ebooks/22367', source: 'gutenberg' },
  { title: 'Also sprach Zarathustra', author: 'Friedrich Nietzsche', language: 'de', url: 'https://www.gutenberg.org/ebooks/7205', source: 'gutenberg' },
  { title: 'Die Leiden des jungen Werther', author: 'Johann Wolfgang von Goethe', language: 'de', url: 'https://www.gutenberg.org/ebooks/2407', source: 'gutenberg' },
  // Spanish
  { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', language: 'es', url: 'https://www.gutenberg.org/ebooks/2000', source: 'gutenberg' },
  { title: 'La Regenta', author: 'Leopoldo Alas', language: 'es', url: 'https://www.gutenberg.org/ebooks/69281', source: 'gutenberg' },
  // Russian
  { title: 'Война и миръ (War and Peace)', author: 'Лев Толстой', language: 'ru', url: 'https://www.gutenberg.org/ebooks/2600', source: 'gutenberg' },
  { title: 'Преступленіе и наказаніе (Crime and Punishment)', author: 'Фёдор Достоевский', language: 'ru', url: 'https://www.gutenberg.org/ebooks/28054', source: 'gutenberg' },
  { title: 'Анна Каренина', author: 'Лев Толстой', language: 'ru', url: 'https://www.gutenberg.org/ebooks/1399', source: 'gutenberg' },
  // Italian
  { title: 'La Divina Commedia', author: 'Dante Alighieri', language: 'it', url: 'https://www.gutenberg.org/ebooks/1000', source: 'gutenberg' },
  { title: 'I Promessi Sposi', author: 'Alessandro Manzoni', language: 'it', url: 'https://www.gutenberg.org/ebooks/3601', source: 'gutenberg' },
  // Portuguese
  { title: 'Os Lusíadas', author: 'Luís de Camões', language: 'pt', url: 'https://www.gutenberg.org/ebooks/3333', source: 'gutenberg' },
  { title: 'Dom Casmurro', author: 'Machado de Assis', language: 'pt', url: 'https://www.gutenberg.org/ebooks/55752', source: 'gutenberg' },
  // Chinese
  { title: '紅樓夢 (Dream of the Red Chamber)', author: '曹雪芹', language: 'zh', url: 'https://www.gutenberg.org/ebooks/24264', source: 'gutenberg' },
  { title: '三國演義 (Romance of the Three Kingdoms)', author: '羅貫中', language: 'zh', url: 'https://www.gutenberg.org/ebooks/23950', source: 'gutenberg' },
  // Japanese
  { title: '吾輩は猫である (I Am a Cat)', author: '夏目漱石', language: 'ja', url: 'https://www.gutenberg.org/ebooks/31731', source: 'gutenberg' },
  { title: '坊っちゃん (Botchan)', author: '夏目漱石', language: 'ja', url: 'https://www.gutenberg.org/ebooks/752', source: 'gutenberg' },
  // Dutch
  { title: 'Max Havelaar', author: 'Multatuli', language: 'nl', url: 'https://www.gutenberg.org/ebooks/11024', source: 'gutenberg' },
  // Swedish
  { title: 'Gösta Berlings saga', author: 'Selma Lagerlöf', language: 'sv', url: 'https://www.gutenberg.org/ebooks/58977', source: 'gutenberg' },
  // Polish
  { title: 'Quo Vadis', author: 'Henryk Sienkiewicz', language: 'pl', url: 'https://www.gutenberg.org/ebooks/28876', source: 'gutenberg' },
  // Greek
  { title: 'Ἰλιάς (Iliad)', author: 'Ὅμηρος', language: 'el', url: 'https://www.gutenberg.org/ebooks/6130', source: 'gutenberg' },
  // Arabic
  { title: 'ألف ليلة وليلة (One Thousand and One Nights)', author: 'Anonymous', language: 'ar', url: 'https://www.gutenberg.org/ebooks/34206', source: 'gutenberg' },
  // Korean
  { title: '춘향전 (Tale of Chunhyang)', author: 'Anonymous', language: 'ko', url: 'https://archive.org/details/chunhyangjeon', source: 'internet-archive' },
  // Hindi
  { title: 'गोदान (Godan)', author: 'मुंशी प्रेमचंद', language: 'hi', url: 'https://archive.org/details/godan-premchand', source: 'internet-archive' },
  // Turkish
  { title: 'Çalıkuşu', author: 'Reşat Nuri Güntekin', language: 'tr', url: 'https://archive.org/details/calikusu', source: 'internet-archive' },
  // Vietnamese
  { title: 'Truyện Kiều', author: 'Nguyễn Du', language: 'vi', url: 'https://www.gutenberg.org/ebooks/65797', source: 'gutenberg' },
  // Thai
  { title: 'สี่แผ่นดิน (Four Reigns)', author: 'คึกฤทธิ์ ปราโมช', language: 'th', url: 'https://archive.org/details/four-reigns', source: 'internet-archive' },
  // Standard Ebooks (high quality English editions)
  { title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', language: 'en', url: 'https://standardebooks.org/ebooks/arthur-conan-doyle/the-adventures-of-sherlock-holmes', source: 'standard-ebooks' },
  { title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', language: 'en', url: 'https://standardebooks.org/ebooks/alexandre-dumas/the-count-of-monte-cristo/chapman-and-hall', source: 'standard-ebooks' },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', language: 'en', url: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/crime-and-punishment/constance-garnett', source: 'standard-ebooks' },
  { title: 'Les Misérables', author: 'Victor Hugo', language: 'en', url: 'https://standardebooks.org/ebooks/victor-hugo/les-miserables/isabel-f-hapgood', source: 'standard-ebooks' },
  { title: 'Anna Karenina', author: 'Leo Tolstoy', language: 'en', url: 'https://standardebooks.org/ebooks/leo-tolstoy/anna-karenina/constance-garnett', source: 'standard-ebooks' },
];

const SOURCE_LABELS: Record<string, string> = {
  gutenberg: 'Project Gutenberg',
  'standard-ebooks': 'Standard Ebooks',
  'internet-archive': 'Internet Archive',
};

export class PublicDomainBooksPanel extends Panel {
  private searchInput!: HTMLInputElement;
  private languageSelect!: HTMLSelectElement;
  private resultsList!: HTMLDivElement;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super({ id: 'public-domain-books', title: 'Free Public Domain Books', className: '' });
    this.render();
  }

  private render(): void {
    const content = this.content;
    content.textContent = '';

    // Filters row
    const filters = document.createElement('div');
    filters.className = 'public-domain-filters';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.className = 'public-domain-search';
    this.searchInput.placeholder = 'Search books...';
    this.searchInput.addEventListener('input', () => this.handleSearch());
    filters.appendChild(this.searchInput);

    this.languageSelect = document.createElement('select');
    this.languageSelect.className = 'public-domain-lang-select';
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = 'All Languages';
    this.languageSelect.appendChild(allOpt);
    for (const lang of LANGUAGES) {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = `${lang.flag} ${lang.label}`;
      this.languageSelect.appendChild(opt);
    }
    this.languageSelect.addEventListener('change', () => this.filterBooks());
    filters.appendChild(this.languageSelect);

    content.appendChild(filters);

    // Results list
    this.resultsList = document.createElement('div');
    this.resultsList.className = 'public-domain-list';
    content.appendChild(this.resultsList);

    // Show curated list initially
    this.renderBooks(CURATED_BOOKS);
  }

  private renderBooks(books: PublicDomainBook[]): void {
    this.resultsList.innerHTML = '';

    if (books.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'public-domain-empty';
      empty.textContent = 'No books found';
      this.resultsList.appendChild(empty);
      return;
    }

    for (const book of books) {
      const card = document.createElement('div');
      card.className = 'public-domain-card';

      const langInfo = LANGUAGES.find(l => l.code === book.language);
      const langBadge = langInfo ? `${langInfo.flag}` : book.language;

      card.innerHTML = `
        <div class="pd-card-header">
          <span class="pd-card-title">${this.escapeHtml(book.title)}</span>
          <span class="pd-card-lang">${langBadge}</span>
        </div>
        <div class="pd-card-meta">
          <span class="pd-card-author">${this.escapeHtml(book.author)}</span>
          <span class="pd-card-source">${SOURCE_LABELS[book.source] ?? book.source}</span>
        </div>
        <div class="pd-card-actions">
          <a href="${this.escapeHtml(book.url)}" target="_blank" rel="noopener" class="pd-btn pd-btn-read">Read Online</a>
          ${book.downloadUrl ? `<a href="${this.escapeHtml(book.downloadUrl)}" target="_blank" rel="noopener" class="pd-btn pd-btn-download">Download</a>` : ''}
        </div>
      `;

      this.resultsList.appendChild(card);
    }
  }

  private filterBooks(): void {
    const query = this.searchInput.value.trim().toLowerCase();
    const lang = this.languageSelect.value;

    let filtered = CURATED_BOOKS;
    if (lang) {
      filtered = filtered.filter(b => b.language === lang);
    }
    if (query) {
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
      );
    }
    this.renderBooks(filtered);
  }

  private handleSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const query = this.searchInput.value.trim();
      // Filter curated list immediately
      this.filterBooks();
      // If query is substantial, also search Gutenberg OPDS
      if (query.length >= 3) {
        void this.searchGutenberg(query);
      }
    }, 300);
  }

  private async searchGutenberg(query: string): Promise<void> {
    try {
      const proxyBase = getApiBaseUrl();
      const gutenbergUrl = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}&submit_search=Go%21`;
      const res = await fetch(`${proxyBase}/api/rss-proxy?url=${encodeURIComponent(gutenbergUrl)}`);
      if (!res.ok) return;

      const text = await res.text();
      const books = this.parseGutenbergResults(text);
      if (books.length > 0) {
        const lang = this.languageSelect.value;
        let curated = CURATED_BOOKS;
        if (lang) curated = curated.filter(b => b.language === lang);
        const curatedFiltered = curated.filter(b =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.author.toLowerCase().includes(query.toLowerCase())
        );
        const existingUrls = new Set(curatedFiltered.map(b => b.url));
        const newBooks = books.filter(b => !existingUrls.has(b.url));
        this.renderBooks([...curatedFiltered, ...newBooks]);
      }
    } catch {
      // Silently fail — curated list is already showing
    }
  }

  private parseGutenbergResults(html: string): PublicDomainBook[] {
    const books: PublicDomainBook[] = [];
    const bookPattern = /\/ebooks\/(\d+).*?class="title"[^>]*>([^<]+)<.*?class="subtitle"[^>]*>([^<]*)</gs;
    let match: RegExpExecArray | null;
    while ((match = bookPattern.exec(html)) !== null && books.length < 20) {
      const [, id, title, author] = match;
      if (id && title) {
        books.push({
          title: title.trim(),
          author: (author ?? 'Unknown').trim(),
          language: 'en',
          url: `https://www.gutenberg.org/ebooks/${id}`,
          source: 'gutenberg',
        });
      }
    }
    return books;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
