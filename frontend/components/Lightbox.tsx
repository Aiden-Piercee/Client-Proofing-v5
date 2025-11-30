"use client";

import React, { useEffect, useState } from "react";
import { Image } from "@/lib/types";
import LightboxProofingBar from "./LightboxProofingBar";

interface LightboxProps {
  image: Image | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;

  onFavorite: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onClear: (id: number) => void;
  onPrint: (id: number) => void;
}

export default function Lightbox({
  image,
  onClose,
  onPrev,
  onNext,
  onFavorite,
  onApprove,
  onReject,
  onClear,
  onPrint,
}: LightboxProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">

      {/* Close */}
      <button className="absolute top-5 right-5 text-white text-3xl" onClick={onClose}>✕</button>

      {/* Full image */}
      <img src={image.full || image.large} alt="" className="max-w-full max-h-full rounded-lg shadow-xl" />

      {/* Edited notice */}
      {image.edited && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-4 py-2 rounded shadow">
          An edited version of this photo is available.
        </div>
      )}

      {/* Feedback bubble */}
      {feedback && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg shadow text-sm font-medium animate-fade">
          {feedback}
        </div>
      )}

      {/* Proofing Bar */}
      <LightboxProofingBar
        image={image}
        onFavorite={(id) => { onFavorite(id); showFeedback("Marked as Favorite"); }}
        onApprove={(id) => { onApprove(id); showFeedback("Marked as Approved"); }}
        onReject={(id) => { onReject(id); showFeedback("Marked as Rejected"); }}
        onPrint={(id) => { onPrint(id); showFeedback("Marked for Print"); }}
        onClear={(id) => { onClear(id); showFeedback("Status Cleared"); }}
      />

      {/* Prev */}
      <button className="absolute left-5 top-1/2 -translate-y-1/2 text-white text-4xl" onClick={onPrev}>‹</button>

      {/* Next */}
      <button className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-4xl" onClick={onNext}>›</button>
    </div>
  );
}
