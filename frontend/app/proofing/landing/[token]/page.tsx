import Link from "next/link";
import { getClientLanding } from "@/lib/api";

interface PageProps {
  params: { token: string };
}

const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200" fill="none"><rect width="320" height="200" rx="24" fill="#1f2937"/><path d="M72 140l44-56 36 46 30-36 30 46H72z" fill="#374151"/><circle cx="108" cy="84" r="14" fill="#4b5563"/></svg>'
  );

export default async function ClientLandingPage({ params }: PageProps) {
  try {
    const landing = await getClientLanding(params.token);
    const heroImage =
      landing.sessions[0]?.album?.cover_url ||
      landing.sessions[0]?.album?.featured_image ||
      FALLBACK_COVER;

    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-neutral-950" />

          <div className="relative max-w-6xl mx-auto px-6 py-12">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Your Galleries</p>
                  <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                    Welcome {landing.client.name || "Client"}
                  </h1>
                  <p className="text-neutral-300">
                    {landing.sessions.length} gallery{landing.sessions.length === 1 ? "" : "ies"} ready for you.
                  </p>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-100 shadow-lg shadow-black/30">
                  <p className="font-semibold">Album access</p>
                  <p className="text-neutral-300">Use the cards below to open each gallery with your magic link.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {landing.sessions.map((session) => (
              <Link
                key={`${session.session_id}-${session.album_id}`}
                href={`/proofing/${session.album_id}/client/${session.token}`}
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-white/25"
              >
                <div className="relative h-44 bg-neutral-900">
                  <img
                    src={session.album?.cover_url || FALLBACK_COVER}
                    alt={session.album?.title || "Gallery"}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-xs text-white">
                    Album #{session.album_id}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Gallery</p>
                  <h2 className="text-lg font-semibold leading-tight text-white">
                    {session.album?.title || "Untitled Album"}
                  </h2>
                  <p className="text-xs text-neutral-400">Click to open with your magic link</p>
                </div>
              </Link>
            ))}
          </div>

          {landing.sessions.length === 0 && (
            <div className="text-neutral-400 text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
              No galleries are linked to this magic link yet.
            </div>
          )}
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl space-y-3 text-center">
          <h1 className="text-2xl font-semibold">We couldn't load your galleries</h1>
          <p className="text-neutral-400">{err?.message ?? "Unknown error"}</p>
          <p className="text-neutral-500 text-sm">Please double-check your magic link or contact your photographer.</p>
        </div>
      </div>
    );
  }
}
