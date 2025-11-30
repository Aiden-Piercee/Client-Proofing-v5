"use client";

type SelectionBarProps = {
  onSelect: (status: string) => void;
};

export default function SelectionBar({ onSelect }: SelectionBarProps) {
  return (
    <div className="flex gap-3">
      <button onClick={() => onSelect("favorite")} className="px-4 py-2 bg-darkpanel rounded-lg">
        Favorite
      </button>
      <button onClick={() => onSelect("maybe")} className="px-4 py-2 bg-darkpanel rounded-lg">
        Maybe
      </button>
      <button onClick={() => onSelect("reject")} className="px-4 py-2 bg-darkpanel rounded-lg">
        Reject
      </button>
    </div>
  );
}
