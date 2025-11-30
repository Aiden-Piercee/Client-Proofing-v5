"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminNav() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-white shadow-md p-4 space-y-4">
      <h1 className="text-xl font-bold mb-4">Admin</h1>

      <nav className="flex flex-col space-y-2">
        <Link href="/admin/dashboard" className="text-neutral-700 hover:text-black">
          Dashboard
        </Link>

        <Link href="/admin/albums" className="text-neutral-700 hover:text-black">
          Albums
        </Link>

        <Link href="/admin/sessions" className="text-neutral-700 hover:text-black">
          Sessions
        </Link>

        {/* 🔥 LOGOUT BUTTON */}
        <button
          onClick={logout}
          className="text-left text-red-600 hover:text-red-800 mt-4"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}
