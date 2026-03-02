import type { Metadata } from "next";
import { Source_Sans_3, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const fontSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Markify",
  description: "Intelligent Academic Assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} antialiased`}
      >
        {children}

        <Toaster position="top-right" richColors closeButton duration={3000} />
      </body>
    </html>
  );
}
