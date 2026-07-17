import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aeroprep.com"),
  title: "AeroPrep | Premium DGCA & EASA Exam Preparation",
  description:
    "AeroPrep offers premium DGCA and EASA exam preparation with structured lessons, mock exams, and adaptive revision tools.",
  keywords: [
    "DGCA",
    "EASA",
    "aircraft maintenance",
    "exam prep",
    "aviation education",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AeroPrep | Premium DGCA & EASA Exam Preparation",
    description:
      "Structured aviation exam preparation for DGCA and EASA candidates with mock exams and study tools.",
    type: "website",
    url: "https://www.aeroprep.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-white text-slate-950">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
