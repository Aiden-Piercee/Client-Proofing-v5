"use client";

import React from "react";
import { Image } from "@/lib/types";

interface Props {
  image: Image;
  onFavorite: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onClear: (id: number) => void;
  onPrint: (id: number) => void;
}

export default function LightboxProofingBar({
  image,
  onFavorite,
  onApprove,
  onReject,
  onClear,
  onPrint,
}: Props) {
  return (
    <div
      className="
        absolute bottom-10 left-1/2 -translate-x-1/2 
        bg-black/60 backdrop-blur-sm 
        px-6 py-3 rounded-full flex gap-4 items-center
        text-white shadow-lg
      "
    >
      <button className="text-2xl hover:scale-110" onClick={() => onFavorite(image.id)}>❤️</button>
      <button className="text-2xl hover:scale-110" onClick={() => onApprove(image.id)}>✔️</button>
      <button className="text-2xl hover:scale-110" onClick={() => onReject(image.id)}>❌</button>

      {/* NEW PRINT BUTTON */}
      <button className="text-2xl hover:scale-110" onClick={() => onPrint(image.id)}>🖨️</button>

      <button className="text-2xl hover:scale-110" onClick={() => onClear(image.id)}>↺</button>
    </div>
  );
}
