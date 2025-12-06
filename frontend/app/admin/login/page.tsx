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
    <div className="flex items-center justify-center h-screen">
      <div className="w-96 bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>

        <input
          className="border p-2 w-full mb-3 text-black"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3 text-black"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <button
          onClick={login}
          className="w-full bg-black text-white p-2 rounded-md"
        >
          Log In
        </button>
      </div>
    </div>
  );
}
