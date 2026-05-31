import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {

  title: {
    default: "Jomshed Miah Family Hospital Calendar 🐐",
    template: "%s | Hospital Calendar",
  },

  description:
    "Track hospital visits together as a family.",

  applicationName: "Family Hospital Calendar",

  authors: [
    {
      name: "Jomshed Miah Family",
    },
  ],

  creator: "Jomshed Miah Family",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },

  openGraph: {
    title: "Jomshed Miah Family Hospital Calendar 🐐",

    description:
      "Track hospital visits together as a family.",

    siteName: "Family Hospital Calendar",

    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Family Hospital Calendar",
      },
    ],

    type: "website",
  },

  twitter: {
    card: "summary",

    title: "Jomshed Miah Family Hospital Calendar 🐐",

    description:
      "Track hospital visits together as a family.",

    images: ["/icon.png"],
  },

  themeColor: "#070B14",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#070B14]">
      <body className={`${inter.className} bg-[#070B14] text-white`}>
        {children}
      </body>
    </html>
  );
}