import { db } from '../db/index';
import { universesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export class HashtagService {
  // Hashtag aus Universe Name generieren
  static generateHashtagFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Sonderzeichen entfernen
      .replace(/\s+/g, '')         // Leerzeichen entfernen
      .substring(0, 50);           // Max 50 Zeichen
  }

  // Prüfen ob Hashtag bereits existiert
  static async isHashtagAvailable(hashtag: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(universesTable)
      .where(eq(universesTable.hashtag, hashtag))
      .limit(1);
    
    return existing.length === 0;
  }

  // Einzigartigen Hashtag generieren
  static async generateUniqueHashtag(name: string): Promise<string> {
    let baseHashtag = this.generateHashtagFromName(name);
    let hashtag = baseHashtag;
    let counter = 1;

    // Falls Hashtag existiert, füge Nummer hinzu
    while (!(await this.isHashtagAvailable(hashtag))) {
      hashtag = `${baseHashtag}${counter}`;
      counter++;
    }

    return hashtag;
  }
}