import { Entry, Node, MemoryData } from './types';
import { findConnections, normalizeWord } from './parser';
import { createClient } from './supabase/client';

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url.supabase.co'
  );
}

export async function loadData(): Promise<MemoryData> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { entries: [], nodes: [] };

  const [entriesResult, nodesResult] = await Promise.all([
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('nodes')
      .select('*')
      .eq('user_id', user.id)
  ]);

  return {
    entries: entriesResult.data || [],
    nodes: nodesResult.data || [],
  };
}

/**
 * Add a new entry and update node graph.
 */
export async function addEntry(entry: Entry): Promise<MemoryData> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // ✅ Normalize anchor and nouns before saving
  const normalizedAnchor = normalizeWord(entry.anchor);
  const normalizedNouns = entry.nouns.map(normalizeWord).filter(n => n);

  // Insert entry
  const { error: entryError } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      date: entry.date,
      anchor: normalizedAnchor,
      text: entry.text,
      nouns: normalizedNouns,
      is_private: entry.is_private,
      phase: entry.phase,
      tags: entry.tags || []
    });

  if (entryError) throw entryError;

  // Update or insert nodes for each noun
  for (const noun of normalizedNouns) {
    const { data: existingNode } = await supabase
      .from('nodes')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', noun)
      .single();

    if (existingNode) {
      await supabase
        .from('nodes')
        .update({
          count: existingNode.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingNode.id);
    } else {
      await supabase.from('nodes').insert({
        user_id: user.id,
        word: noun,
        connections: [],
        count: 1,
      });
    }
  }

  // Recalculate node connections
  await recalcConnections(normalizedNouns);
  return await loadData();
}

/**
 * Recalculates node connections between related anchors.
 */
async function recalcConnections(nouns: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id);

  if (!entries) return;

  for (const noun of nouns) {
    const connections = findConnections(entries, noun);
    await supabase
      .from('nodes')
      .update({ connections })
      .eq('user_id', user.id)
      .eq('word', noun);
  }
}

/**
 * Get all entries tied to a specific anchor.
 */
export async function getEntriesForAnchor(anchor: string): Promise<Entry[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // ✅ Normalize anchor for lookup
  const normalizedAnchor = normalizeWord(anchor);

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('anchor', normalizedAnchor)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return [];
  }

  return data || [];
}

/**
 * Update text and tags for a specific entry.
 */
export async function updateEntry(entryId: string, newText: string, newTags?: string[]): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('entries')
    .update({
      text: newText,
      tags: newTags || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', user.id);

  if (error) throw error;
}
