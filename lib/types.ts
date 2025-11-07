export interface Entry {
  id: string;
  date: string;
  symbol: string;
  text: string;
  nouns: string[];
  is_private: boolean;
  phase?: string;
}

export interface Node {
  word: string;
  connections: string[];
  count: number;
}

export interface MemoryData {
  entries: Entry[];
  nodes: Node[];
}


export interface Entry {
  id: string;
  date: string;
  symbol: string;
  text: string;
  nouns: string[];
  is_private: boolean;
  phase?: string;
  tags?: string[]; // 🆕 new field
}
