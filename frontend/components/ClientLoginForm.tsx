"use client";

import { FormEvent, useState } from "react";

export default function ClientLoginForm() {
  const [email, setEmail] = useState("");
  const [sessionCode, setSessionCode] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    alert(`Logging in ${email} with code ${sessionCode}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-darkpanel p-4 rounded-xl border border-darkborder">
      <div className="space-y-2">
        <label className="text-sm text-neutral-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-darkhover border border-darkborder px-3 py-2 text-white"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-neutral-400">Session Code</label>
        <input
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value)}
          className="w-full rounded-lg bg-darkhover border border-darkborder px-3 py-2 text-white"
        />
      </div>
      <button type="submit" className="w-full bg-white text-black rounded-lg py-2 font-semibold">
        Access Gallery
      </button>
    </form>
  );
}
