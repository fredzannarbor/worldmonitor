/**
 * Build a Codexes Factory URL with query params for the "Build a Book" action.
 *
 * Opens the Streamlit UI with pre-filled topic, codexType, score, and optional
 * category/country so the pipeline can pick up the suggestion.
 */

export interface BuildBookParams {
  topic: string;
  codexType: string;
  score: number;
  sources?: number;
  category?: string;
  country?: string;
  language?: string;
}

const CODEXES_FACTORY_BASE = 'http://localhost:8502';

export function buildBookUrl(params: BuildBookParams): string {
  const url = new URL(CODEXES_FACTORY_BASE);
  url.searchParams.set('topic', params.topic);
  url.searchParams.set('codexType', params.codexType);
  url.searchParams.set('score', String(params.score));
  if (params.sources != null) url.searchParams.set('sources', String(params.sources));
  if (params.category) url.searchParams.set('category', params.category);
  if (params.country) url.searchParams.set('country', params.country);
  if (params.language) url.searchParams.set('language', params.language);
  return url.toString();
}
