import nlp from 'compromise';
import { removeStopwords } from 'stopword';

export function extractNouns(text: string): string[] {
  // Parse the text with compromise
  const doc = nlp(text);
  
  // Extract all nouns
  let nouns = doc.nouns().out('array') as string[];
  
  // Additional processing: extract proper nouns separately
  const properNouns = doc.people().out('array') as string[];
  const places = doc.places().out('array') as string[];
  
  // Combine all nouns
  nouns = [...nouns, ...properNouns, ...places];
  
  // Normalize: lowercase and deduplicate
  nouns = nouns.map(noun => noun.toLowerCase().trim());
  
  // Remove stopwords
  const filteredNouns = removeStopwords(nouns);
  
  // Remove very short words (less than 3 characters) and deduplicate
  const cleanedNouns = Array.from(
    new Set(
      filteredNouns.filter(noun => noun.length >= 3)
    )
  );
  
  return cleanedNouns;
}

export function findConnections(entries: any[], targetWord: string): string[] {
  const connections = new Set<string>();
  
  entries.forEach(entry => {
    if (entry.nouns.includes(targetWord.toLowerCase())) {
      entry.nouns.forEach((noun: string) => {
        if (noun !== targetWord.toLowerCase()) {
          connections.add(noun);
        }
      });
    }
  });
  
  return Array.from(connections);
}
