import { getAlbum, validateSession } from "@/lib/api";

interface PageProps {
  params: { albumId: string };
  searchParams?: { token?: string };
}

export default async function AlbumPage({ params, searchParams }: PageProps) {
  const albumId = Number(params.albumId);
  const token = searchParams?.token ?? "";
  const allowPublicSplash = process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SPLASH === "true";

  if (!allowPublicSplash && !token) {
    return <LockedSplash albumId={albumId} />;
  }

  let sessionError: string | null = null;
  let galleryToken: string | null = token || null;

  if (token) {
    try {
      const session = await validateSession(token);
      if (session.album_id !== albumId) {
        throw new Error("This token is not valid for this gallery.");
      }
      galleryToken = token;
    } catch (err: any) {
      sessionError = err?.message ?? "Unable to validate your access token.";
      if (!allowPublicSplash) {
        return <LockedSplash albumId={albumId} error={sessionError ?? undefined} />;
      }
      galleryToken = null;
    }
  }

  const album = await getAlbum(albumId, galleryToken ?? undefined);

  const bgImage = album.cover_url || album.featured_image || "";
  const galleryHref = galleryToken
    ? `/proofing/${albumId}/client/${galleryToken}`
    : null;

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-neutral-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundColor: "#0b0b0f",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-neutral-950" />

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 backdrop-blur-md overflow-hidden">
          <div className="grid md:grid-cols-[2fr,1fr]">
            <div className="p-8 md:p-10 space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Client Gallery</p>
                <h1 className="text-3xl md:text-5xl font-light tracking-tight leading-tight">
                  {album.title}
                </h1>
                {album.date && (
                  <p className="text-neutral-300 text-sm">
                    {new Date(album.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
                <p className="text-neutral-300 text-sm md:text-base">
                  Preview this gallery and open your personalized magic link to view and select images.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {galleryHref ? (
                  <a
                    href={galleryHref}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-white text-black font-semibold shadow-lg shadow-black/30 hover:-translate-y-0.5 transition"
                  >
                    Open gallery
                  </a>
                ) : (
                  <form
                    className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
                    action={`/proofing/${albumId}`}
                    method="get"
                  >
                    <input
                      type="text"
                      name="token"
                      defaultValue={token}
                      placeholder="Paste magic link token"
                      className="flex-1 rounded-full bg-black/40 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition"
                    >
                      Check access
                    </button>
                  </form>
                )}

                <div className="text-sm text-neutral-400">
                  <p className="font-medium text-neutral-200">Proofing Session #{albumId}</p>
                  <p>Use your magic link to view the full gallery.</p>
                </div>
              </div>

              {sessionError && allowPublicSplash && (
                <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-3">
                  {sessionError}
                </p>
              )}
            </div>

            <div className="relative min-h-[240px] bg-neutral-900/40 border-l border-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/0" />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/30 bg-neutral-950/70">
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url('${bgImage}')` }}
                  />
                  <div className="p-4 space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Gallery preview</p>
                    <p className="text-lg font-semibold text-white leading-tight">{album.title}</p>
                    <p className="text-xs text-neutral-400">Album ID #{albumId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LockedSplash({ albumId, error }: { albumId: number; error?: string }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-3 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Access required</p>
        <h1 className="text-2xl font-semibold">This gallery splash page is private</h1>
        <p className="text-neutral-300">
          Use the magic link sent to your email to open gallery #{albumId}. If you
          believe you should have access, contact the studio to request a new link.
        </p>
        {error && <p className="text-sm text-amber-200">{error}</p>}
      </div>
    </div>
  );
}
