import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Indico — Flash-Sale Dashboard",
  description: "Live inventory, reservation & confirmation dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
