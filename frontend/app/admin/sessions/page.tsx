"use client";

import { useEffect, useState } from "react";

interface Session {
  id: number;
  token: string;
  album_id: number;
  email: string | null;
  created_at: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");

        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load sessions");

        const data = await res.json();
        setSessions(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className="text-neutral-300">Loading sessions…</p>;
  if (error) return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Access</p>
        <h1 className="text-3xl font-semibold text-white">Sessions</h1>
      </div>

      <div className="grid gap-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm text-neutral-400">Token</p>
                <p className="font-mono text-white break-all">{s.token}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-neutral-400">Album</p>
                <p className="text-white font-semibold">#{s.album_id}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <p className="text-sm text-neutral-300">
                Email: <span className="font-semibold text-white">{s.email || "(none)"}</span>
              </p>
              <p className="text-sm text-neutral-400">
                Created: {new Date(s.created_at).toLocaleString("en-US", { hour12: false })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
