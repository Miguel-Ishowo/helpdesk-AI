import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-context";

export const metadata: Metadata = {
  title: "HelpDesk AI",
  description: "AI-powered customer support platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
