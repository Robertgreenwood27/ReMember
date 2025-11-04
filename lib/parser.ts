import nlp from 'compromise'
import { removeStopwords } from 'stopword'

/* ─────────────────────────────
   🧹 Smart Semantic Stopwords
   ───────────────────────────── */
const semanticStopwords = new Set([
  // Generic / filler
  'thing', 'things', 'stuff', 'something', 'anything', 'everything', 'nothing',
  'place', 'time', 'day', 'days', 'week', 'weeks', 'year', 'years', 'moment',
  'life', 'world', 'area', 'point', 'part', 'kind', 'sort', 'type',

  // Pronouns & people
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'they', 'them', 'their', 'theirs', 'themselves', 'we', 'us', 'our', 'ours', 'ourselves',
  'someone', 'somebody', 'anyone', 'anybody', 'everyone', 'everybody',
  'person', 'people', 'nobody', 'noone',

  // Evaluative adjectives / vague descriptors
  'good', 'bad', 'great', 'nice', 'cool', 'fun', 'boring', 'awesome', 'amazing',
  'better', 'best', 'worst', 'favorite', 'perfect', 'fine', 'okay',

  // Abstract / meta
  'thought', 'thoughts', 'idea', 'ideas', 'concept', 'feeling', 'feelings', 'emotion',
  'experience', 'experiences', 'story', 'stories', 'conversation', 'talk', 'discussion',
  'situation', 'fact', 'truth', 'thing', 'stuff', 'way',

  // Empty intensifiers
  'really', 'very', 'quite', 'just', 'maybe', 'probably', 'perhaps',

  // Common low-info nouns / verbs-as-nouns
  'work', 'works', 'job', 'jobs', 'doing', 'done', 'making', 'make', 'try', 'trying',
  'use', 'using', 'used', 'help', 'helping',

  // Other generic
  'lot', 'lots', 'end', 'start', 'beginning', 'middle',
  'back', 'front', 'side', 'top', 'bottom',
  'minute', 'minutes', 'hour', 'hours', 'moment'
])

/* ─────────────────────────────
   🔤 Normalizer
   ───────────────────────────── */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation
    .trim()
}

/* ─────────────────────────────
   🧩 Extractor
   ───────────────────────────── */
export function extractNouns(text: string): string[] {
  const doc = nlp(text)

  // Remove pronouns and determiners early
  doc.nouns().if('#Pronoun').remove()
  doc.nouns().if('#Determiner').remove()

  // 1️⃣ Single nouns
  let nouns = doc.nouns().terms().out('array') as string[]

  // 2️⃣ Compound concept merging (balanced)
  // - Proper names like "Pet Stop", "New York"
  // - Two consecutive nouns like "school project"
  const compounds = [
    ...doc.match('#ProperNoun+').out('array'),
    ...doc.match('#Noun #Noun').out('array')
  ]

  const mergedCompounds = compounds
    .map(phrase => phrase.toLowerCase().replace(/\s+/g, '')) // merge words
    .filter(w => w.length >= 3 && !semanticStopwords.has(w))

  // 3️⃣ Proper nouns & places (individual words)
  const properNouns = doc.people().terms().out('array') as string[]
  const places = doc.places().terms().out('array') as string[]

  // 4️⃣ Combine all
  nouns = [...nouns, ...properNouns, ...places, ...mergedCompounds]
  nouns = nouns.map(normalizeWord)

  // 5️⃣ Filter & dedupe
  const filtered = removeStopwords(nouns)
    .filter(noun =>
      noun.length >= 3 &&
      !semanticStopwords.has(noun)
    )

  return Array.from(new Set(filtered))
}

/* ─────────────────────────────
   🕸 Connection Finder
   ───────────────────────────── */
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
