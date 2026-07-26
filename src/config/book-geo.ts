/**
 * Stable reference locations used by the books variant.
 *
 * These are intentionally small, curated seed lists. Live literary activity and
 * trending books are loaded separately by the literary-today and Open Library
 * services.
 */

interface BookLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  description?: string;
  url?: string;
}

export interface PublisherHQ extends BookLocation {
  type: 'publisher';
}

export interface BookFair extends BookLocation {
  type: 'fair';
}

export interface MajorLibrary extends BookLocation {
  type: 'library';
}

export interface LiteraryLandmark extends BookLocation {
  type: 'landmark';
}

export const PUBLISHER_HQS: PublisherHQ[] = [
  { id: 'penguin-random-house', name: 'Penguin Random House', city: 'New York', country: 'United States', lat: 40.7587, lon: -73.9787, type: 'publisher' },
  { id: 'harpercollins', name: 'HarperCollins', city: 'New York', country: 'United States', lat: 40.7527, lon: -73.9772, type: 'publisher' },
  { id: 'hachette-livre', name: 'Hachette Livre', city: 'Paris', country: 'France', lat: 48.8337, lon: 2.3136, type: 'publisher' },
  { id: 'macmillan', name: 'Macmillan Publishers', city: 'London', country: 'United Kingdom', lat: 51.5142, lon: -0.1117, type: 'publisher' },
];

export const BOOK_FAIRS: BookFair[] = [
  { id: 'frankfurt-book-fair', name: 'Frankfurt Book Fair', city: 'Frankfurt', country: 'Germany', lat: 50.1114, lon: 8.6483, type: 'fair' },
  { id: 'london-book-fair', name: 'London Book Fair', city: 'London', country: 'United Kingdom', lat: 51.4963, lon: -0.2108, type: 'fair' },
  { id: 'guadalajara-book-fair', name: 'Guadalajara International Book Fair', city: 'Guadalajara', country: 'Mexico', lat: 20.6534, lon: -103.3916, type: 'fair' },
  { id: 'bologna-childrens-book-fair', name: "Bologna Children's Book Fair", city: 'Bologna', country: 'Italy', lat: 44.5115, lon: 11.3636, type: 'fair' },
];

export const MAJOR_LIBRARIES: MajorLibrary[] = [
  { id: 'library-of-congress', name: 'Library of Congress', city: 'Washington', country: 'United States', lat: 38.8887, lon: -77.0047, type: 'library' },
  { id: 'british-library', name: 'British Library', city: 'London', country: 'United Kingdom', lat: 51.5299, lon: -0.1271, type: 'library' },
  { id: 'bibliotheque-nationale-france', name: 'Bibliothèque nationale de France', city: 'Paris', country: 'France', lat: 48.8337, lon: 2.3758, type: 'library' },
  { id: 'new-york-public-library', name: 'New York Public Library', city: 'New York', country: 'United States', lat: 40.7532, lon: -73.9822, type: 'library' },
];

export const LITERARY_LANDMARKS: LiteraryLandmark[] = [
  { id: 'shakespeares-globe', name: "Shakespeare's Globe", city: 'London', country: 'United Kingdom', lat: 51.5081, lon: -0.0972, type: 'landmark', description: "Reconstruction of the playhouse associated with Shakespeare's company." },
  { id: 'mark-twain-house', name: 'The Mark Twain House', city: 'Hartford', country: 'United States', lat: 41.7671, lon: -72.7014, type: 'landmark', description: 'Home where Mark Twain wrote several of his best-known works.' },
  { id: 'hemingway-home', name: 'Ernest Hemingway Home', city: 'Key West', country: 'United States', lat: 24.5511, lon: -81.8008, type: 'landmark', description: "Hemingway's Key West residence and writing site." },
  { id: 'james-joyce-centre', name: 'James Joyce Centre', city: 'Dublin', country: 'Ireland', lat: 53.3542, lon: -6.2634, type: 'landmark', description: "Museum and cultural center devoted to Joyce's life and work." },
];
