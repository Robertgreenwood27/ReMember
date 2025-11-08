import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Noctis - A Dream Map of the Subconscious",
  description: "Map your inner world through dreams, symbols, and meaning.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans" suppressHydrationWarning>
  <AuthProvider>{children}</AuthProvider>
</body>
    </html>
  );
}
