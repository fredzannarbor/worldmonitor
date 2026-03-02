const WEBHOOK_URL = import.meta.env.VITE_BOOK_REQUEST_WEBHOOK ?? '';

export interface BookRequestParams {
  topic: string;
  codexType: string;
  score: number;
  category?: string;
  country?: string;
  language?: string;
  username: string;
  email: string;
}

export async function submitBookRequest(params: BookRequestParams): Promise<boolean> {
  if (!WEBHOOK_URL) return true; // graceful skip if not configured
  try {
    const resp = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, timestamp: new Date().toISOString() }),
    });
    return resp.ok;
  } catch {
    console.warn('[BookRequest] Webhook submission failed');
    return false;
  }
}
