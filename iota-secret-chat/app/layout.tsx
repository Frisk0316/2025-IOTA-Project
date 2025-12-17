import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers"; // 引入我們剛寫好的元件

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IOTA Secret Chat",
  description: "Burn after reading dApp on IOTA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 用 Providers 包裹所有頁面內容 */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}