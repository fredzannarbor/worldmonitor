import { login, register, type User } from '@/services/auth';

let instance: AuthModal | null = null;

export class AuthModal {
  private backdrop: HTMLDivElement;
  private modal: HTMLDivElement;
  private errorEl: HTMLDivElement;
  private loginTab: HTMLButtonElement;
  private registerTab: HTMLButtonElement;
  private formContainer: HTMLDivElement;
  private submitBtn: HTMLButtonElement;
  private titleEl: HTMLHeadingElement;
  private activeTab: 'login' | 'register' = 'login';
  private resolve: ((user: User | null) => void) | null = null;

  constructor() {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'auth-modal-backdrop';
    this.backdrop.style.display = 'none';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close(null);
    });

    // Modal card
    this.modal = document.createElement('div');
    this.modal.className = 'auth-modal';

    // Title
    this.titleEl = document.createElement('h3');
    this.titleEl.textContent = 'Sign In';
    this.modal.appendChild(this.titleEl);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'auth-tabs';

    this.loginTab = document.createElement('button');
    this.loginTab.type = 'button';
    this.loginTab.className = 'auth-tab active';
    this.loginTab.textContent = 'Login';
    this.loginTab.addEventListener('click', () => this.switchTab('login'));

    this.registerTab = document.createElement('button');
    this.registerTab.type = 'button';
    this.registerTab.className = 'auth-tab';
    this.registerTab.textContent = 'Register';
    this.registerTab.addEventListener('click', () => this.switchTab('register'));

    tabs.appendChild(this.loginTab);
    tabs.appendChild(this.registerTab);
    this.modal.appendChild(tabs);

    // Error display
    this.errorEl = document.createElement('div');
    this.errorEl.className = 'auth-error';
    this.errorEl.style.display = 'none';
    this.modal.appendChild(this.errorEl);

    // Form container
    this.formContainer = document.createElement('div');
    this.modal.appendChild(this.formContainer);

    // Submit button
    this.submitBtn = document.createElement('button');
    this.submitBtn.type = 'button';
    this.submitBtn.className = 'auth-submit';
    this.submitBtn.textContent = 'Login';
    this.submitBtn.addEventListener('click', () => this.handleSubmit());
    this.modal.appendChild(this.submitBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'auth-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close(null));
    this.modal.appendChild(cancelBtn);

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    this.renderForm();
  }

  private switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.loginTab.className = tab === 'login' ? 'auth-tab active' : 'auth-tab';
    this.registerTab.className = tab === 'register' ? 'auth-tab active' : 'auth-tab';
    this.titleEl.textContent = tab === 'login' ? 'Sign In' : 'Create Account';
    this.submitBtn.textContent = tab === 'login' ? 'Login' : 'Register';
    this.errorEl.style.display = 'none';
    this.renderForm();
  }

  private renderForm(): void {
    this.formContainer.textContent = '';

    if (this.activeTab === 'register') {
      const emailInput = this.createInput('email', 'Email');
      this.formContainer.appendChild(emailInput);
    }

    const usernameInput = this.createInput('text', 'Username');
    this.formContainer.appendChild(usernameInput);

    const passwordInput = this.createInput('password', 'Password');
    this.formContainer.appendChild(passwordInput);

    // Allow Enter key to submit
    this.formContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit();
      }
    });
  }

  private createInput(type: string, placeholder: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    input.className = 'auth-input';
    input.placeholder = placeholder;
    input.setAttribute('data-field', placeholder.toLowerCase());
    return input;
  }

  private getFieldValue(field: string): string {
    const input = this.formContainer.querySelector(`[data-field="${field}"]`) as HTMLInputElement | null;
    return input?.value.trim() ?? '';
  }

  private async handleSubmit(): Promise<void> {
    this.errorEl.style.display = 'none';
    this.submitBtn.disabled = true;

    try {
      let user: User;
      if (this.activeTab === 'login') {
        const username = this.getFieldValue('username');
        const password = this.getFieldValue('password');
        if (!username || !password) throw new Error('All fields are required');
        user = await login(username, password);
      } else {
        const email = this.getFieldValue('email');
        const username = this.getFieldValue('username');
        const password = this.getFieldValue('password');
        if (!email || !username || !password) throw new Error('All fields are required');
        user = await register(email, username, password);
      }
      this.close(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      this.errorEl.textContent = message;
      this.errorEl.style.display = 'block';
    } finally {
      this.submitBtn.disabled = false;
    }
  }

  private close(user: User | null): void {
    this.backdrop.style.display = 'none';
    if (this.resolve) {
      this.resolve(user);
      this.resolve = null;
    }
  }

  show(): Promise<User | null> {
    this.activeTab = 'login';
    this.loginTab.className = 'auth-tab active';
    this.registerTab.className = 'auth-tab';
    this.submitBtn.textContent = 'Login';
    this.errorEl.style.display = 'none';
    this.renderForm();
    this.backdrop.style.display = 'flex';

    // Focus first input after display
    requestAnimationFrame(() => {
      const first = this.formContainer.querySelector('input') as HTMLInputElement | null;
      first?.focus();
    });

    return new Promise<User | null>((resolve) => {
      this.resolve = resolve;
    });
  }
}

export function showAuthModal(): Promise<User | null> {
  if (!instance) {
    instance = new AuthModal();
  }
  return instance.show();
}
