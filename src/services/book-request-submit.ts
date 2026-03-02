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
  try {
    const resp = await fetch('/api/book-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, timestamp: new Date().toISOString() }),
    });
    return resp.ok;
  } catch {
    console.warn('[BookRequest] Submission failed');
    return false;
  }
}
