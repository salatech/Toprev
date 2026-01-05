import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "TopRev - AI Code Review by Top 0.1% Engineers | Solahudeen Babatunde Abdulrahmon",
    template: "%s | TopRev",
  },
  description:
    "Get brutal, honest code reviews powered by AI trained on top 0.1% Principal Engineers. Analyze code complexity, find bugs, security issues, and anti-patterns. Created by Solahudeen Babatunde Abdulrahmon.",
  keywords: [
    "code review",
    "AI code review",
    "code analysis",
    "code quality",
    "code review tool",
    "static code analysis",
    "code complexity",
    "code security",
    "software engineering",
    "code refactoring",
    "best practices",
    "code review AI",
    "automated code review",
    "principal engineer",
    "code critique",
  ],
  authors: [
    {
      name: "Solahudeen Babatunde Abdulrahmon",
    },
  ],
  creator: "Solahudeen Babatunde Abdulrahmon",
  publisher: "Solahudeen Babatunde Abdulrahmon",
  metadataBase: new URL("https://toprev.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://toprev.vercel.app",
    siteName: "TopRev",
    title: "TopRev - AI Code Review by Top 0.1% Engineers",
    description:
      "Get brutal, honest code reviews powered by AI trained on top 0.1% Principal Engineers. Analyze code complexity, find bugs, security issues, and anti-patterns. Created by Solahudeen Babatunde Abdulrahmon.",
    images: [
      {
        url: "https://toprev.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "TopRev - AI Code Review Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TopRev - AI Code Review by Top 0.1% Engineers",
    description:
      "Get brutal, honest code reviews powered by AI. Analyze code complexity, security, and best practices. By Solahudeen Babatunde Abdulrahmon.",
    images: ["https://toprev.vercel.app/og-image.png"],
    creator: "@your_twitter_handle", // Update with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "Technology",
  icons: {
    icon: [
      { url: "/toprev.png", type: "image/png" },
      { url: "/toprev.png", type: "image/png", sizes: "32x32" },
      { url: "/toprev.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/toprev.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/toprev.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
