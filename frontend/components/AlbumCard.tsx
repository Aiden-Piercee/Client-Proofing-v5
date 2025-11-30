// Updated AlbumCard.tsx to match nullable Album type
import Link from "next/link";
import { Album } from "@/lib/types";

type AlbumCardProps = {
  album: Album;
};

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/proofing/${album.id}`}
      className="block bg-darkpanel p-4 rounded-xl hover:bg-darkhover transition border border-darkborder"
    >
      <h2 className="text-xl font-semibold mb-1">{album.title ?? "Untitled Album"}</h2>
      <p className="text-neutral-400 text-sm">{album.slug ?? ""}</p>
    </Link>
  );
}