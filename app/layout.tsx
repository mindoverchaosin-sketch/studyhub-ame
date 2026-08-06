import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aeroprep.com"),
  title: "AeroPrep | Master DGCA & EASA Exams with AI",
  description:
    "AeroPrep is an AI-powered aviation learning platform for Aircraft Maintenance Engineers, featuring an AI tutor, mock exams, a question bank, a study planner, and personalized learning for DGCA and EASA exams.",
  keywords: [
    "DGCA",
    "EASA",
    "aircraft maintenance engineer",
    "AME exam prep",
    "aviation AI tutor",
    "mock exams",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "AeroPrep | Master DGCA & EASA Exams with AI",
    description:
      "AI Tutor, Mock Exams, Question Bank, Study Planner and Personalized Learning for Aircraft Maintenance Engineers.",
    type: "website",
    url: "https://www.aeroprep.com",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f9" },
    { media: "(prefers-color-scheme: dark)", color: "#060a14" },
  ],
  colorScheme: "light dark",
};

// Prevent a flash of the wrong theme before hydration.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('aeroprep-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased bg-background`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
