'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { loadData } from '@/lib/storage-supabase';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cloudData, setCloudData] = useState({ entries: 0, nodes: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadCloudData();
    }
  }, [user, authLoading, router]);

  const loadCloudData = async () => {
    try {
      const data = await loadData();
      setCloudData({
        entries: data.entries.length,
        nodes: data.nodes.length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load Supabase data');
    }
  };

  const handleExportData = async () => {
    const data = await loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-jogger-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            ← Back to anchors
          </Link>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl font-light text-neutral-800 dark:text-neutral-100 mb-2">
            Settings
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Manage your Supabase account and data
          </p>
        </header>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-medium text-neutral-800 dark:text-neutral-100 mb-4">
            Account
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400">
              <span className="font-medium">User ID:</span>{' '}
              <code className="text-xs bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                {user?.id}
              </code>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-medium text-neutral-800 dark:text-neutral-100 mb-4">
            Supabase Data
          </h2>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg mb-6">
            <p className="text-2xl font-light text-neutral-800 dark:text-neutral-100">
              {cloudData.entries}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {cloudData.nodes} anchors
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={handleExportData}
            className="px-6 py-2 text-sm bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Export as JSON
          </button>
        </div>
      </div>
    </div>
  );
}
