import { Injectable, Logger } from '@nestjs/common';
import { WORD_LISTS, getCategories } from './word-lists';

@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  /** Get all available categories */
  getCategories(): string[] {
    return ['anything', ...getCategories()];
  }

  /** Get a random word for the given category */
  async getRandomWord(category: string): Promise<string> {
    let normalizedCategory = category.toLowerCase().trim();

    if (normalizedCategory === 'anything') {
      const realCategories = getCategories(); // keys from word-lists
      const randomIndex = Math.floor(Math.random() * realCategories.length);
      normalizedCategory = realCategories[randomIndex];
      this.logger.log(`"anything" category chosen. Redirected to random category: "${normalizedCategory}"`);
    }

    // Try Datamuse API first
    try {
      const word = await this.fetchFromDatamuse(normalizedCategory);
      if (word) {
        this.logger.log(`Datamuse returned: "${word}" for category "${normalizedCategory}"`);
        return word;
      }
    } catch (error) {
      this.logger.warn(`Datamuse API failed for "${normalizedCategory}": ${error.message}`);
    }

    // Fallback to local word lists
    return this.getFromLocalList(normalizedCategory);
  }

  /** Fetch a random word from Datamuse API */
  private async fetchFromDatamuse(category: string): Promise<string | null> {
    const url = `https://api.datamuse.com/words?topics=${encodeURIComponent(category)}&max=50`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      // Filter to reasonable words (1-2 words, no super obscure ones)
      const filtered = data
        .filter((item: any) => {
          const word = item.word || '';
          return word.length >= 3 && word.length <= 20 && !word.includes(' ');
        })
        .slice(0, 30);

      if (filtered.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * filtered.length);
      return filtered[randomIndex].word;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  /** Get a random word from local fallback lists */
  private getFromLocalList(category: string): string {
    const list = WORD_LISTS[category];

    if (list && list.length > 0) {
      const randomIndex = Math.floor(Math.random() * list.length);
      this.logger.log(`Local list returned: "${list[randomIndex]}" for category "${category}"`);
      return list[randomIndex];
    }

    // If category doesn't exist in our lists, pick from "objects" as ultimate fallback
    const fallback = WORD_LISTS['objects'];
    const randomIndex = Math.floor(Math.random() * fallback.length);
    this.logger.warn(`Unknown category "${category}", using objects fallback: "${fallback[randomIndex]}"`);
    return fallback[randomIndex];
  }
}
