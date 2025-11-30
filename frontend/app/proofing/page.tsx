import AlbumCard from "@/components/AlbumCard";
import { getAlbums } from "@/lib/api";
import type { Album } from "@/lib/types";

export default async function ProofingIndex() {
  const albums: Album[] = await getAlbums();

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {albums.map((a) => (
        <div key={a.id}>
          <AlbumCard album={{ ...a, title: a.title ?? "" }} />
        </div>
      ))}
    </div>
  );
}
