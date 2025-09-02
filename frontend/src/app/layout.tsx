import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/providers/Web3Provider";

const sora = Sora({
  // Use a dedicated CSS variable for Sora and map Tailwind's --font-sans to it in globals.css
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "PrivyBallot",
  description: "Confidential Voting DAO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable}>
      <body className={"antialiased"}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
