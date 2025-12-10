import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Client Proofing",
  description: "Private proofing gallery"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-darkbg text-black">{children}</body>
    </html>
  );
}
