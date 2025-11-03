declare module 'stopword' {
  export function removeStopwords(
    input: string[],
    stopwords?: string[]
  ): string[];
}
