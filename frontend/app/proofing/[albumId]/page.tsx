import { getAlbum } from "@/lib/api";

interface PageProps {
  params: { albumId: string };
}

export default async function AlbumPage({ params }: PageProps) {
  const albumId = Number(params.albumId);
  const album = await getAlbum(albumId);

  const bgImage = album.cover_url || album.featured_image || "";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundColor: "#1a1a1a",
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        <div className="space-y-2">
          <h2 className="text-sm md:text-base tracking-[0.2em] uppercase text-neutral-300">
            Client Gallery
          </h2>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight font-serif text-white drop-shadow-lg">
            {album.title}
          </h1>
          {album.date && (
            <p className="text-neutral-300 text-lg font-light pt-2">
              {new Date(album.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="pt-8">
          <a
            href={`/proofing/${albumId}/client`}
            className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium tracking-widest text-white uppercase border border-white/30 transition-all duration-300 hover:bg-white hover:text-black hover:border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
          >
            <span>Open Gallery</span>
          </a>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-neutral-500 text-xs tracking-widest uppercase">
        Proofing Session #{albumId}
      </div>
    </div>
  );
}
