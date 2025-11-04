import nlp from 'compromise'
import { removeStopwords } from 'stopword'

// 🧹 Smart semantic stopword set
const semanticStopwords = new Set([
  // Generic / filler
  'thing', 'things', 'stuff', 'something', 'anything', 'everything', 'nothing',
  'place', 'time', 'day', 'days', 'week', 'weeks', 'year', 'years', 'moment',
  'life', 'world', 'area', 'point', 'part', 'kind', 'sort', 'type',

  // Pronouns & people
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'they', 'them', 'their', 'theirs', 'themselves', 'we', 'us', 'our', 'ours', 'ourselves',
  'someone', 'somebody', 'anyone', 'anybody', 'everyone', 'everybody', 'noone', 'nobody', 'person', 'people',

  // Evaluative adjectives / vague descriptors
  'good', 'bad', 'great', 'nice', 'cool', 'fun', 'boring', 'awesome', 'amazing',
  'better', 'best', 'worst', 'favorite', 'perfect', 'okay', 'fine',

  // Abstract or meta concepts
  'thought', 'thoughts', 'idea', 'ideas', 'concept', 'feeling', 'feelings', 'emotion',
  'experience', 'experiences', 'story', 'stories', 'conversation', 'talk', 'discussion',
  'way', 'thing', 'stuff', 'situation', 'fact', 'truth',

  // Empty intensifiers or filler words
  'really', 'very', 'quite', 'just', 'maybe', 'probably', 'perhaps',

  // Low-information verbs that sometimes appear as nouns
  'work', 'works', 'job', 'jobs', 'doing', 'done', 'making', 'make', 'try', 'trying',
  'use', 'using', 'used',

  // Common determiners & helpers (defensive redundancy)
  'one', 'ones', 'two', 'three', 'four', 'five', 'thing', 'lot', 'lots', 'kind',

  // Other general English noise
  'back', 'front', 'side', 'top', 'bottom', 'end', 'start',
  'moment', 'second', 'minute', 'hour', 'hours',
])

/**
 * Normalize any noun or anchor for consistent storage.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation
    .trim()
}

/**
 * Extract nouns while filtering out semantically weak or abstract ones.
 */
export function extractNouns(text: string): string[] {
  const doc = nlp(text)

  // Extract individual noun terms (not phrases)
  let nouns = doc.nouns().terms().out('array') as string[]
  const properNouns = doc.people().terms().out('array') as string[]
  const places = doc.places().terms().out('array') as string[]

  nouns = [...nouns, ...properNouns, ...places]
  nouns = nouns.map(normalizeWord)

  const filtered = removeStopwords(nouns)
    .filter(noun =>
      noun.length >= 3 &&
      !semanticStopwords.has(noun)
    )

  return Array.from(new Set(filtered))
}

/**
 * Finds connected anchors between entries.
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
