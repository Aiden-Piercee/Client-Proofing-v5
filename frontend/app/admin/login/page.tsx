"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/login`, {
        username,
        password,
      });

      localStorage.setItem("admin_token", res.data.token);
      router.push("/admin/dashboard");
    } catch (e) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-[#dddddd]">
      <div className="w-[360px] bg-[#1f1f1f] border border-[rgba(255,255,255,0.05)] p-5 rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.35)] space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">Admin</p>
          <h1 className="text-[18px] font-semibold leading-tight text-white">Sign in</h1>
        </div>

        <div className="space-y-3">
          <input
            className="w-full h-10 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#121212] px-3 text-[13px] text-white placeholder:text-[#6f6f6f] focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full h-10 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#121212] px-3 text-[13px] text-white placeholder:text-[#6f6f6f] focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-[13px] text-red-300">{error}</p>}

        <button
          onClick={login}
          className="w-full h-10 rounded-[5px] bg-[#c88b4b] text-black font-semibold tracking-tight hover:bg-[#d79b5d] transition duration-125"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
