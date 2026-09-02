import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://loadlinkers.com"),
  title: "Collaborative Transportation Management Software - Loadlinkers",
  description:
    "Loadlinkers is the world’s leading transportation management software with a collaborative layer that unifies people, processes, and data.",
  keywords: [
    "Loadlinkers",
    "TMS",
    "Transportation Management Software",
    "Collaborative Logistics",
    "Freight Brokers",
    "3PL Software",
    "Supply Chain Management",
  ],
  icons: {
    icon: "/images/loadlinkers-icon.svg",
    apple: "/images/loadlinkers-icon.svg",
  },
  openGraph: {
    title: "Loadlinkers - Collaborative TMS For A Modern Supply Chain",
    description:
      "Loadlinkers is the world’s leading transportation management software with a collaborative layer that unifies people, processes, and data.",
    url: "https://loadlinkers.com/",
    siteName: "Loadlinkers",
    images: [
      {
        url: "/images/loadlinkers-logo.png",
        width: 1200,
        height: 630,
        alt: "Loadlinkers Collaborative Transportation Management System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loadlinkers - Collaborative TMS For A Modern Supply Chain",
    description:
      "Loadlinkers is the world’s leading transportation management software with a collaborative layer that unifies people, processes, and data.",
    site: "@loadlinkers",
    images: ["/images/loadlinkers-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${figtree.variable} font-sans bg-[#18171d] text-white min-h-screen antialiased selection:bg-[#49c2f5] selection:text-[#18171d]`}>
        {children}
      </body>
    </html>
  );
}
