import { getAlbum } from "@/lib/api";

interface PageProps {
  params: { albumId: string };
}

export default async function AlbumPage({ params }: PageProps) {
  const albumId = Number(params.albumId);

  // Load the album (this already works in your current backend)
  const album = await getAlbum(albumId);

  return (
    <div className="p-6 text-neutral-300">
      <h1 className="text-2xl font-semibold mb-4">{album.title}</h1>

      <p className="mb-6 text-neutral-500">
        Album ID: {albumId}
      </p>

      <p className="text-neutral-500 mb-6">
        This is the album overview.  
        Client proofing will occur via the client session link.
      </p>

      <a
        href={`/proofing/${albumId}/client`}
        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
      >
        Open Client Proofing
      </a>
    </div>
  );
}
