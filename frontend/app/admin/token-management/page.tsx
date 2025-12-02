"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSession, AdminTokenResources, Album } from "@/lib/types";

interface GenerateFormState {
  album_ids: string[];
  client_id: string;
  client_name: string;
  email: string;
}

interface ClientEditState {
  name: string;
  email: string;
}

interface SessionEditState {
  album_id: string;
  client_id: string;
  client_name: string;
}

export default function TokenManagementPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    album_ids: [],
    client_id: "",
    client_name: "",
    email: "",
  });
  const [albumInputs, setAlbumInputs] = useState<Record<string, string>>({});
  const [clientEdits, setClientEdits] = useState<Record<number, ClientEditState>>({});
  const [sessionEdits, setSessionEdits] = useState<Record<number, SessionEditState>>({});
  const [resources, setResources] = useState<AdminTokenResources | null>(null);
  const [albumFilter, setAlbumFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const loadResources = async () => {
    if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
    const token = localStorage.getItem("admin_token");
    if (!token) throw new Error("Missing admin token");

    const res = await fetch(`${API}/admin/token-management/resources`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Unable to load token resources");
    const data: AdminTokenResources = await res.json();
    setResources(data);
  };

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const res = await fetch(`${API}/admin/token-management`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unable to load token data");
      const data: AdminSession[] = await res.json();
      setSessions(data);

      const edits: Record<number, ClientEditState> = {};
      const sessionEditMap: Record<number, SessionEditState> = {};
      data.forEach((session) => {
        if (session.client_id) {
          edits[session.client_id] = {
            name: session.client_name ?? "",
            email: session.email ?? "",
          };
        }

        sessionEditMap[session.id] = {
          album_id: String(session.album_id ?? ""),
          client_id: session.client_id ? String(session.client_id) : "",
          client_name: session.client_name ?? "",
        };
      });
      setClientEdits(edits);
      setSessionEdits(sessionEditMap);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadResources();
        await loadSessions();
      } catch (err: any) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedByClient = useMemo(() => {
    const map = new Map<number | null, AdminSession[]>();
    sessions.forEach((session) => {
      const key = session.client_id ?? session.id;
      const entry = map.get(key) ?? [];
      entry.push(session);
      map.set(key, entry);
    });
    return map;
  }, [sessions]);

  const filteredAlbumSummaries = useMemo(() => {
    if (!resources?.albumSummaries) return [];
    return resources.albumSummaries.filter((summary) => {
      const matchesAlbum = albumFilter
        ? (summary.album?.title ?? '').toLowerCase().includes(albumFilter.toLowerCase()) ||
          String(summary.album_id).includes(albumFilter)
        : true;

      const matchesClient = clientFilter
        ? summary.tokens.some((t) => (t.client_name ?? '').toLowerCase().includes(clientFilter.toLowerCase()) ||
            (t.client_id ? String(t.client_id).includes(clientFilter) : false))
        : true;

      return matchesAlbum && matchesClient;
    });
  }, [resources, albumFilter, clientFilter]);

  const updateGenerateForm = (key: keyof GenerateFormState, value: string | string[]) => {
    setGenerateForm((prev) => ({ ...prev, [key]: value } as GenerateFormState));
  };

  const handleClientSelect = (clientId: string) => {
    updateGenerateForm("client_id", clientId);

    const selected = resources?.clients.find((c) => String(c.id) === clientId);
    if (selected) {
      setGenerateForm((prev) => ({
        ...prev,
        client_name: selected.name ?? prev.client_name,
        email: selected.email ?? prev.email,
      }));
    }
  };

  const generateToken = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      if (generateForm.album_ids.length === 0) {
        throw new Error("Select at least one album");
      }

      const payload: any = {
        album_ids: generateForm.album_ids.map((id) => Number(id)),
        client_name: generateForm.client_name || null,
      };

      if (generateForm.client_id) {
        payload.client_id = Number(generateForm.client_id);
      }

      if (generateForm.email) {
        payload.email = generateForm.email;
      }

      const res = await fetch(`${API}/admin/token-management/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Unable to generate token");
      setGenerateForm({ album_ids: [], client_id: "", client_name: "", email: "" });
      await loadSessions();
      alert("Token created successfully");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addAlbumToToken = async (tokenValue: string) => {
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const albumId = albumInputs[tokenValue];
      if (!albumId) throw new Error("Album ID is required");

      const res = await fetch(`${API}/admin/token-management/${tokenValue}/albums`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ album_ids: albumId.split(',').map((id) => Number(id.trim())).filter(Boolean) }),
      });

      if (!res.ok) throw new Error("Unable to link gallery");
      await loadSessions();
      alert("Gallery added to client token");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeSession = async (sessionId: number) => {
    if (!confirm("Remove this gallery from the client?")) return;
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const res = await fetch(`${API}/admin/token-management/session/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unable to remove gallery");
      await loadSessions();
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
      const res = await fetch(`${API}/admin/token-management/client/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: edits?.name ?? null, email: edits?.email ?? null }),
      });

      if (!res.ok) throw new Error("Unable to update client");
      await loadSessions();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveSessionDetails = async (sessionId: number) => {
    setSaving(true);
    setError(null);
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Missing admin token");

      const edits = sessionEdits[sessionId];
      const payload: any = {
        album_id: edits?.album_id ? Number(edits.album_id) : undefined,
        client_id: edits?.client_id ? Number(edits.client_id) : null,
        client_name: edits?.client_name ?? null,
      };

      const res = await fetch(`${API}/admin/token-management/session/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Unable to update session");
      await loadSessions();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-neutral-300">Loading token management…</p>;
  if (error) return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Access</p>
          <h1 className="text-3xl font-semibold text-white">Token management</h1>
          <p className="text-neutral-400 text-sm">Generate tokens, manage galleries, and keep client details up to date.</p>
        </div>
        {saving && <span className="text-xs text-amber-200 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/30">Saving…</span>}
      </header>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Create</p>
            <h2 className="text-xl font-semibold text-white">Generate a session token</h2>
            <p className="text-neutral-400 text-sm">Link to an existing client or create a new invite in a single step.</p>
          </div>
          <button
            onClick={generateToken}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-black/20 disabled:opacity-60"
            disabled={saving}
          >
            Generate token
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="flex flex-col gap-1 text-sm text-neutral-300">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Albums</span>
            <select
              multiple
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
              value={generateForm.album_ids}
              onChange={(e) =>
                updateGenerateForm(
                  "album_ids",
                  Array.from(e.target.selectedOptions).map((opt) => opt.value)
                )
              }
            >
              {(resources?.albums ?? []).map((album) => (
                <option key={album.id} value={album.id}>
                  {(album as Album).title ?? "Untitled"} (#{album.id})
                </option>
              ))}
            </select>
            <span className="text-xs text-neutral-400">Hold Ctrl/⌘ to pick multiple galleries.</span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-neutral-300">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Existing client (optional)</span>
            <select
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
              value={generateForm.client_id}
              onChange={(e) => handleClientSelect(e.target.value)}
            >
              <option value="">-- Select client --</option>
              {(resources?.clients ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {(client.name || "Unnamed").trim()} (#{client.id})
                </option>
              ))}
            </select>
            <span className="text-xs text-neutral-400">Selecting a client will auto-fill name/email when available.</span>
          </div>
          <LabeledInput
            label="Client name (optional)"
            placeholder="Alex Smith"
            value={generateForm.client_name}
            onChange={(v) => updateGenerateForm("client_name", v)}
          />
          <LabeledInput
            label="Client email (optional)"
            placeholder="alex@example.com"
            value={generateForm.email}
            onChange={(v) => updateGenerateForm("email", v)}
          />
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Choose one or more galleries. Provide a client ID to add a gallery to an existing client. If only email is provided, a new client record is created or reused.
        </p>
      </section>

      <div className="space-y-4">
        {Array.from(groupedByClient.values()).map((clientSessions) => {
          const primary = clientSessions[0];
          const clientId = primary.client_id;
          const editable = clientId ? clientEdits[clientId] : null;

          return (
            <article
              key={`${primary.id}-${primary.client_id ?? "anon"}`}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Client</p>
                  <p className="text-white font-semibold text-lg">
                    {clientId ? editable?.name || "Unnamed client" : "Unlinked token"}
                  </p>
                  <p className="text-neutral-400 text-sm">{clientId ? editable?.email || "No email on file" : "Link a client to manage galleries"}</p>
                </div>
                {clientId && (
                  <button
                    onClick={() => saveClient(clientId)}
                    disabled={saving}
                    className="border border-white/20 text-white rounded-lg px-3 py-2 text-sm hover:border-white/40 disabled:opacity-60"
                  >
                    Save client details
                  </button>
                )}
              </div>

              {clientId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <LabeledInput
                    label="Client name"
                    value={editable?.name ?? ""}
                    onChange={(v) =>
                      setClientEdits((prev) => ({
                        ...prev,
                        [clientId]: { ...prev[clientId], name: v },
                      }))
                    }
                  />
                  <LabeledInput
                    label="Client email"
                    value={editable?.email ?? ""}
                    onChange={(v) =>
                      setClientEdits((prev) => ({
                        ...prev,
                        [clientId]: { ...prev[clientId], email: v },
                      }))
                    }
                  />
                </div>
              )}

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Galleries</p>
                    <p className="text-neutral-300 text-sm">Manage galleries linked to this token set.</p>
                  </div>
                  {clientId && (
                    <div className="flex items-center gap-2">
                      <input
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500"
                        placeholder="Album ID or CSV"
                        value={albumInputs[primary.token] ?? ""}
                        onChange={(e) =>
                          setAlbumInputs((prev) => ({ ...prev, [primary.token]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => addAlbumToToken(primary.token)}
                        disabled={saving}
                        className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm hover:bg-white/20 disabled:opacity-60"
                      >
                        Add gallery
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  {clientSessions.map((session) => {
                    const sessionEdit = sessionEdits[session.id];
                    return (
                      <div
                        key={session.id}
                        className="border border-white/10 rounded-xl p-3 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Token</p>
                            <p className="font-mono text-sm text-white break-all">{session.token}</p>
                            <p className="text-neutral-400 text-xs">
                              Album #{session.album_id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={session.landing_magic_url ?? "#"}
                              className="text-sm bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 hover:bg-white/20"
                            >
                              Landing link
                            </a>
                            <button
                              onClick={() => removeSession(session.id)}
                              disabled={saving}
                              className="text-sm bg-red-500/10 border border-red-500/40 text-red-100 rounded-lg px-3 py-2 hover:bg-red-500/20 disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1 text-sm text-neutral-300">
                            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Album</span>
                            <select
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                              value={sessionEdit?.album_id ?? ""}
                              onChange={(e) =>
                                setSessionEdits((prev) => ({
                                  ...prev,
                                  [session.id]: { ...prev[session.id], album_id: e.target.value },
                                }))
                              }
                            >
                              {(resources?.albums ?? []).map((album) => (
                                <option key={album.id} value={album.id}>
                                  {(album as Album).title ?? "Untitled"} (#{album.id})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-neutral-300">
                            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">Linked client</span>
                            <select
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                              value={sessionEdit?.client_id ?? ""}
                              onChange={(e) =>
                                setSessionEdits((prev) => ({
                                  ...prev,
                                  [session.id]: { ...prev[session.id], client_id: e.target.value },
                                }))
                              }
                            >
                              <option value="">-- No client --</option>
                              {(resources?.clients ?? []).map((client) => (
                                <option key={client.id} value={client.id}>
                                  {(client.name || "Unnamed").trim()} (#{client.id})
                                </option>
                              ))}
                            </select>
                          </div>
                          <LabeledInput
                            label="Session client name"
                            value={sessionEdit?.client_name ?? ""}
                            onChange={(v) =>
                              setSessionEdits((prev) => ({
                                ...prev,
                                [session.id]: { ...prev[session.id], client_name: v },
                              }))
                            }
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => saveSessionDetails(session.id)}
                            disabled={saving}
                            className="text-sm bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 hover:bg-white/20 disabled:opacity-60"
                          >
                            Save token changes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-1">Albums</p>
            <h2 className="text-xl font-semibold text-white">Album access overview</h2>
            <p className="text-neutral-400 text-sm">See who is tokened to which album and filter by album or client.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <LabeledInput
              label="Filter by album"
              value={albumFilter}
              onChange={setAlbumFilter}
              placeholder="Title or ID"
            />
            <LabeledInput
              label="Filter by client"
              value={clientFilter}
              onChange={setClientFilter}
              placeholder="Name or ID"
            />
          </div>
        </div>

        <div className="grid gap-3">
          {filteredAlbumSummaries.map((summary) => (
            <div key={summary.album_id} className="border border-white/10 rounded-xl p-4 bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Album</p>
                  <p className="text-white font-semibold">
                    {(summary.album as Album | null)?.title ?? "Untitled album"} (#{summary.album_id})
                  </p>
                </div>
                <span className="text-sm text-neutral-300">{summary.tokens.length} token(s)</span>
              </div>

              <div className="grid md:grid-cols-2 gap-2">
                {summary.tokens.map((token) => (
                  <div key={token.token} className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Client</p>
                    <p className="text-white font-medium">{token.client_name ?? "Unlinked"}</p>
                    <p className="text-neutral-400 text-xs">Token: {token.token}</p>
                    {token.client_id && (
                      <p className="text-neutral-500 text-xs">Client ID: {token.client_id}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredAlbumSummaries.length === 0 && (
            <p className="text-neutral-400 text-sm">No albums match the current filters.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-300">
      <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</span>
      <input
        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-neutral-500"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
