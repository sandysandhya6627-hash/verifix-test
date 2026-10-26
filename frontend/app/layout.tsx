import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeriFix | Document checks",
  description: "A transparent document format-checking prototype."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
