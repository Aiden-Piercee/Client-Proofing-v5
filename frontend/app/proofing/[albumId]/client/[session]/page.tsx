"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GalleryGrid from "@/components/GalleryGrid";
import SelectionToolbar from "@/components/SelectionToolbar";
import {
  validateSession,
  getAlbum,
  getAlbumImages,
  attachEmailToSession,
} from "@/lib/api";
import { Image } from "@/lib/types";

interface Props {
  params: {
    albumId: string;
    session: string;
  };
}

export default function SessionPage({ params }: Props) {
  const albumId = Number(params.albumId);
  const sessionToken = params.session;

  const [album, setAlbum] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [albumImageUrls, setAlbumImageUrls] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [persistSelections, setPersistSelections] = useState<boolean>(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedMessage, setUnsavedMessage] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // NEW — selection state for ZIP buttons
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const warningMessage =
    "Your current selections will be lost if you do not supply an email address.";

  const loadAlbumData = useCallback(async () => {
    const session = await validateSession(sessionToken);
    const alb = await getAlbum(albumId, sessionToken);
    const imgs = await getAlbumImages(albumId, sessionToken);

    setSessionInfo(session);
    setAlbum(alb);
    setImages(imgs);

    const canPersist = Boolean(session?.client_id || session?.email);
    setPersistSelections(canPersist);
    setShowEmailModal(!canPersist);
    setEmailInput(session?.email ?? "");
    setClientNameInput(session?.client_name ?? "");

    const hero =
      pickPreviewImage(imgs) ||
      (alb.cover_url as string | null) ||
      (alb.featured_image as string | null);

    setBannerImage(hero);
    setAlbumImageUrls(imgs.map(makeDownloadURL));

    if (canPersist) {
      setHasUnsavedChanges(false);
      setUnsavedMessage(null);
    }
  }, [albumId, sessionToken]);

  useEffect(() => {
    loadAlbumData();
  }, [loadAlbumData]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!persistSelections && hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = warningMessage;
        return warningMessage;
      }
      return undefined;
    };

    if (!persistSelections && hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [persistSelections, hasUnsavedChanges, warningMessage]);

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      if (persistSelections || !hasUnsavedChanges) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");

      if (anchor && anchor.getAttribute("href")) {
        const leave = window.confirm(warningMessage);
        if (!leave) {
          event.preventDefault();
          event.stopPropagation();
          setShowEmailModal(true);
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [persistSelections, hasUnsavedChanges, warningMessage]);

  const clientName = useMemo(
    () => sessionInfo?.client_name || "Client",
    [sessionInfo?.client_name]
  );

  const handleSelectionChange = (imgs: string[]) => {
    setSelectedImages(imgs);
    if (!persistSelections) {
      setHasUnsavedChanges(true);
      setUnsavedMessage(
        "Selections will not be saved until you provide an email address.",
      );
    }
  };

  const handlePersistWarning = () => {
    if (!persistSelections) {
      setShowEmailModal(true);
      setUnsavedMessage(
        "Selections will not persist unless you add an email to this session.",
      );
    }
  };

  const handleSkipPersistence = () => {
    setPersistSelections(false);
    setShowEmailModal(false);
    setHasUnsavedChanges(true);
    setUnsavedMessage(
      "Selections will remain local only. Provide an email to save them.",
    );
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim()) {
      setUnsavedMessage("Please enter an email to continue.");
      return;
    }

    try {
      setSavingEmail(true);
      const updatedSession = await attachEmailToSession(
        sessionToken,
        emailInput,
        clientNameInput || undefined,
      );

      setSessionInfo(updatedSession);
      setPersistSelections(true);
      setShowEmailModal(false);
      setHasUnsavedChanges(false);
      setUnsavedMessage(null);
      await loadAlbumData();
    } catch (err: any) {
      setUnsavedMessage(
        err?.message ?? "Unable to save email for this proofing session.",
      );
    } finally {
      setSavingEmail(false);
    }
  };

  if (!album || !sessionInfo) {
    return (
      <div className="p-6 text-neutral-400">Loading album...</div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="relative isolate overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          {bannerImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerImage})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-neutral-950" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
                Client Gallery
              </p>
              <h1 className="text-3xl md:text-5xl font-light tracking-tight">
                {album.title}
              </h1>
              <p className="text-neutral-400 text-sm">
                Viewing as {clientName}
              </p>
            </div>

            {bannerImage && (
              <div className="h-20 w-32 md:h-24 md:w-36 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/30">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${bannerImage})` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-12">
        {!persistSelections && (
          <div className="mb-4 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Selections will not be saved unless you provide an email.
            <button
              className="underline underline-offset-4"
              onClick={() => setShowEmailModal(true)}
            >
              Add email to save selections
            </button>
          </div>
        )}

        {unsavedMessage && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {unsavedMessage}
          </div>
        )}

        <SelectionToolbar
          albumImages={albumImageUrls}
          selectedImages={selectedImages}
        />

        <GalleryGrid
          albumId={albumId}
          sessionToken={sessionToken}
          sessionEmail={sessionInfo.email ?? null}
          persistSelections={persistSelections}
          selectedImages={selectedImages}
          onSelectionChange={handleSelectionChange}
          onPersistenceBlocked={handlePersistWarning}
        />
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 p-6 shadow-xl ring-1 ring-white/10">
            <h2 className="text-2xl font-semibold text-white">
              Save your selections
            </h2>
            <p className="mt-2 text-sm text-neutral-300">
              Add an email address so your proofing selections are saved.
              Without an email, any changes may be lost if you leave this
              page.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-neutral-300">Name</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                  placeholder="Client Name (optional)"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-neutral-300">Email</label>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="flex-1 rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
                onClick={handleSaveEmail}
                disabled={savingEmail}
              >
                {savingEmail ? "Saving..." : "Save email to persist"}
              </button>

              <button
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-white/40"
                onClick={handleSkipPersistence}
              >
                Continue without saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pickPreviewImage(imgs: Image[]) {
  if (!imgs.length) return null;
  const hero = imgs[0];
  return (
    hero.full ||
    hero.large2x ||
    hero.large ||
    hero.medium2x ||
    hero.medium ||
    hero.small2x ||
    hero.small ||
    hero.thumb2x ||
    hero.thumb ||
    hero.tiny2x ||
    hero.tiny ||
    null
  );
}

function makeDownloadURL(img: Image): string {
  let path = img.storage_path || "";
  const filename = img.filename || "";
  path = path.replace(/^\/+/, "");
  const alreadyContainsFile = path.endsWith(filename);
  const fullPath = alreadyContainsFile ? path : `${path}/${filename}`;
  return `http://clients.chasing.media/dl.php?src=/storage/originals/${fullPath}`;
}
