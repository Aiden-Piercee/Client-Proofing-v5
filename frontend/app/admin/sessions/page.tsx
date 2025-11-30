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

  if (loading) return <p>Loading sessions…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Sessions</h1>

      <div className="grid gap-3">
        {sessions.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded shadow">
            <p><strong>Token:</strong> {s.token}</p>
            <p><strong>Album:</strong> {s.album_id}</p>
            <p><strong>Email:</strong> {s.email || "(none)"}</p>
            <p><strong>Created:</strong> {s.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
