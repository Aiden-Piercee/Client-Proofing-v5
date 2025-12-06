"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSession, HousekeepingPayload } from "@/lib/types";

interface SessionEditState {
  token: string;
  client_name: string;
  client_email: string;
  client_id: string;
}

interface ClientEditState {
  name: string;
  email: string;
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-300">
      <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-white/40 focus:outline-none"
      />
    </label>
  );
}

export default function HousekeepingPage() {
  const [data, setData] = useState<HousekeepingPayload | null>(null);
  const [sessionEdits, setSessionEdits] = useState<Record<number, SessionEditState>>({});
  const [clientEdits, setClientEdits] = useState<Record<number, ClientEditState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const res = await fetch(`${API}/admin/housekeeping`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unable to load housekeeping data");
      const payload: HousekeepingPayload = await res.json();
      setData(payload);

      const sessionDefaults: Record<number, SessionEditState> = {};
      (payload.sessions ?? []).forEach((session) => {
        sessionDefaults[session.id] = {
          token: session.token,
          client_name: session.client_name ?? "",
          client_email: session.email ?? "",
          client_id: session.client_id ? String(session.client_id) : "",
        };
      });

      const clientDefaults: Record<number, ClientEditState> = {};
      (payload.clients ?? []).forEach((client) => {
        clientDefaults[client.id] = {
          name: client.name ?? "",
          email: client.email ?? "",
        };
      });

      setSessionEdits(sessionDefaults);
      setClientEdits(clientDefaults);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSessions = useMemo(() => {
    if (!data?.sessions) return [];
    if (!sessionSearch.trim()) return data.sessions;

    return data.sessions.filter((session) => {
      const needle = sessionSearch.toLowerCase();
      const tokenValue = (session.token ?? "").toLowerCase();
      return (
        tokenValue.includes(needle) ||
        (session.client_name ?? "").toLowerCase().includes(needle) ||
        (session.email ?? "").toLowerCase().includes(needle) ||
        String(session.id).includes(needle)
      );
    });
  }, [data?.sessions, sessionSearch]);

  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    if (!clientSearch.trim()) return data.clients;

    return data.clients.filter((client) => {
      const needle = clientSearch.toLowerCase();
      return (
        (client.name ?? "").toLowerCase().includes(needle) ||
        (client.email ?? "").toLowerCase().includes(needle) ||
        String(client.id).includes(needle)
      );
    });
  }, [data?.clients, clientSearch]);

  const saveSession = async (session: AdminSession) => {
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const edits = sessionEdits[session.id];
      const res = await fetch(`${API}/admin/housekeeping/session/${session.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: edits?.token ?? session.token,
          client_name: edits?.client_name ?? session.client_name ?? null,
          client_email: edits?.client_email ?? session.email ?? null,
          client_id: edits?.client_id ? Number(edits.client_id) : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Unable to update session");
      }

      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm("Delete this token from the database?")) return;
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const res = await fetch(`${API}/admin/housekeeping/session/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unable to delete session");
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveClient = async (clientId: number) => {
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const edits = clientEdits[clientId];
      const res = await fetch(`${API}/admin/housekeeping/client/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: edits?.name ?? null,
          email: edits?.email ?? null,
        }),
      });

      if (!res.ok) throw new Error("Unable to update client");
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (clientId: number) => {
    if (!confirm("Delete this client and their tokens?")) return;
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const res = await fetch(`${API}/admin/housekeeping/client/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unable to delete client");
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-neutral-300">Loading housekeeping…</p>;
  if (error) return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Maintenance</p>
          <h1 className="text-3xl font-semibold text-white">Housekeeping</h1>
          <p className="text-neutral-400 text-sm">
            Edit or delete tokens and client records directly from the database with confidence.
          </p>
        </div>
        {saving && (
          <span className="text-xs text-amber-200 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/30">
            Saving…
          </span>
        )}
      </header>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Tokens</p>
            <h2 className="text-xl font-semibold text-white">Database tokens</h2>
            <p className="text-neutral-400 text-sm">
              Update token strings, link names, or clean up unused invitations.
            </p>
          </div>
          <input
            type="search"
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
            placeholder="Search tokens or clients"
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white w-64"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const edits = sessionEdits[session.id];
            return (
              <div
                key={session.id}
                className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3 shadow-inner shadow-black/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Token ID #{session.id}</p>
                    <p className="text-white text-lg font-semibold">Album #{session.album_id}</p>
                    <p className="text-xs text-neutral-400">Created {new Date(session.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveSession(session)}
                      disabled={saving}
                      className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 px-3 py-2 rounded-lg hover:bg-emerald-500/30 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      disabled={saving}
                      className="bg-red-500/10 border border-red-400/50 text-red-100 px-3 py-2 rounded-lg hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <LabeledInput
                    label="Token value"
                    value={edits?.token ?? session.token}
                    onChange={(v) =>
                      setSessionEdits((prev) => ({
                        ...prev,
                        [session.id]: { ...prev[session.id], token: v },
                      }))
                    }
                  />
                  <LabeledInput
                    label="Client name"
                    value={edits?.client_name ?? ""}
                    onChange={(v) =>
                      setSessionEdits((prev) => ({
                        ...prev,
                        [session.id]: { ...prev[session.id], client_name: v },
                      }))
                    }
                    placeholder="Optional label"
                  />
                  <LabeledInput
                    label="Client email"
                    value={edits?.client_email ?? ""}
                    onChange={(v) =>
                      setSessionEdits((prev) => ({
                        ...prev,
                        [session.id]: { ...prev[session.id], client_email: v },
                      }))
                    }
                    placeholder="Optional email"
                  />
                  <LabeledInput
                    label="Linked client ID"
                    value={edits?.client_id ?? ""}
                    onChange={(v) =>
                      setSessionEdits((prev) => ({
                        ...prev,
                        [session.id]: { ...prev[session.id], client_id: v },
                      }))
                    }
                    placeholder="Blank to unlink"
                  />
                </div>
              </div>
            );
          })}

          {filteredSessions.length === 0 && (
            <p className="text-sm text-neutral-400">No tokens match your search.</p>
          )}
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Clients</p>
            <h2 className="text-xl font-semibold text-white">Database users</h2>
            <p className="text-neutral-400 text-sm">Update contact details or remove stale records.</p>
          </div>
          <input
            type="search"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Search clients"
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white w-64"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const edits = clientEdits[client.id];
            return (
              <div
                key={client.id}
                className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3 shadow-inner shadow-black/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Client #{client.id}</p>
                    <p className="text-white text-lg font-semibold">{edits?.name || client.name || "Unnamed"}</p>
                    <p className="text-xs text-neutral-400">Created {new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveClient(client.id)}
                      disabled={saving}
                      className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 px-3 py-2 rounded-lg hover:bg-emerald-500/30 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      disabled={saving}
                      className="bg-red-500/10 border border-red-400/50 text-red-100 px-3 py-2 rounded-lg hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabeledInput
                    label="Name"
                    value={edits?.name ?? ""}
                    onChange={(v) =>
                      setClientEdits((prev) => ({
                        ...prev,
                        [client.id]: { ...prev[client.id], name: v },
                      }))
                    }
                  />
                  <LabeledInput
                    label="Email"
                    value={edits?.email ?? ""}
                    onChange={(v) =>
                      setClientEdits((prev) => ({
                        ...prev,
                        [client.id]: { ...prev[client.id], email: v },
                      }))
                    }
                  />
                </div>
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <p className="text-sm text-neutral-400">No clients match your search.</p>
          )}
        </div>
      </section>
    </div>
  );
}
