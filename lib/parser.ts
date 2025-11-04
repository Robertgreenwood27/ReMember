import nlp from 'compromise'
import { removeStopwords } from 'stopword'

/**
 * Normalize any noun or anchor for consistent storage.
 * - lowercases
 * - removes punctuation
 * - trims whitespace
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation, keep letters/numbers
    .trim()
}

/**
 * Extracts meaningful nouns from text.
 * - Uses compromise NLP to find nouns, people, and places
 * - Removes stopwords and very short words
 * - Normalizes output
 * - Splits multi-word noun phrases into single words (so “my cousin Steven” → “cousin”, “steven”)
 */
export function extractNouns(text: string): string[] {
  const doc = nlp(text)

  // Extract words
  let nouns = doc.nouns().terms().out('array') as string[]
  const properNouns = doc.people().terms().out('array') as string[]
  const places = doc.places().terms().out('array') as string[]

  // Combine all sources
  nouns = [...nouns, ...properNouns, ...places]

  // Normalize and clean
  nouns = nouns.map(normalizeWord)

  // Remove stopwords and short fragments
  const filtered = removeStopwords(nouns)
    .filter(noun => noun.length >= 3)

  // Deduplicate
  const unique = Array.from(new Set(filtered))

  return unique
}

/**
 * Finds connected anchors between entries.
 * Returns all nouns that co-occur with the target word.
 */
export function findConnections(entries: any[], targetWord: string): string[] {
  const connections = new Set<string>()
  const normalizedTarget = normalizeWord(targetWord)

  for (const entry of entries) {
    if (entry.nouns.includes(normalizedTarget)) {
      for (const noun of entry.nouns) {
        const normalizedNoun = normalizeWord(noun)
        if (normalizedNoun && normalizedNoun !== normalizedTarget) {
          connections.add(normalizedNoun)
        }
      }
    }
  }

  return Array.from(connections)
}
