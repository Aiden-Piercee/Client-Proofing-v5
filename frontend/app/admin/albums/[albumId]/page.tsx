"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Session {
  id: number;
  token: string;
  email: string | null;
  created_at: string;
}

interface Album {
  id: number;
  title: string;
  images: any[];
  sessions: Session[];
}

export default function AdminAlbumDetailPage() {
  const params = useParams();
  const albumId = Number(params.albumId);

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load album from backend API
  useEffect(() => {
    async function load() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("Missing NEXT_PUBLIC_API_URL");

        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/albums/${albumId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load album");

        const data = await res.json();
        setAlbum(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [albumId]);

  // Create magic link
  const generateMagicLink = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("admin_token");

      const res = await fetch(`${API}/admin/session/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ album_id: albumId }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = await res.json();
      alert(`Magic Link Generated:\n${data.magic_url}`);
    } catch (err: any) {
      alert(err.message);
      console.error(err);
    }
  };

  if (loading) return <p>Loading album…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!album) return <p>Album not found.</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{album.title}</h1>

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={generateMagicLink}
      >
        Generate Magic Link
      </button>

      {/* Images */}
      <h2 className="text-lg font-semibold mt-6 mb-2">Images</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {album.images?.map((img) => (
          <div key={img.id} className="border rounded overflow-hidden">
            <img src={img.public_url} alt="" className="w-full h-auto" />
          </div>
        ))}
      </div>

      {/* Sessions */}
      <h2 className="text-lg font-semibold mt-6 mb-2">Existing Sessions</h2>
      <div className="space-y-2">
        {album.sessions.map((s) => (
          <div key={s.id} className="bg-white p-3 rounded shadow">
            <p>
              <strong>Token:</strong> {s.token}
            </p>
            <p>
              <strong>Email:</strong> {s.email || "(none yet)"}
            </p>
            <p>
              <strong>Date:</strong> {s.created_at}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}