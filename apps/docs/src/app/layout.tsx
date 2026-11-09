import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
// release-please bumps the version here on every release.
import rootPackage from "../../../../package.json";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

const SITE_URL = "https://compooss.dev";
const SITE_NAME = "Compooss";
const TITLE = "Compooss | Open-Source MongoDB GUI for Docker Compose";
const DESCRIPTION =
  "Compooss is a free, open-source MongoDB GUI built for Docker Compose workflows. Browse databases, query documents, manage collections, and explore schemas, all from a single lightweight Docker container. No signup required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "MongoDB GUI",
    "MongoDB admin panel",
    "Docker Compose MongoDB",
    "MongoDB management tool",
    "MongoDB client",
    "MongoDB Docker GUI",
    "MongoDB browser",
    "MongoDB document viewer",
    "open source MongoDB GUI",
    "self-hosted MongoDB GUI",
    "MongoDB query tool",
    "MongoDB collection manager",
    "MongoDB database explorer",
    "Docker database tool",
    "lightweight MongoDB GUI",
    "Mongo Express alternative",
    "MongoDB Compass alternative",
  ],
  authors: [{ name: "Abdullah Mia", url: "https://github.com/abdullahmia" }],
  creator: "Abdullah Mia",
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "Developer Tools",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/preview.jpeg",
        width: 1920,
        height: 1080,
        alt: "Compooss MongoDB GUI showing the database browser, collection explorer, and document viewer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/preview.jpeg"],
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
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#111314",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Docker, macOS, Windows, Linux",
  description: DESCRIPTION,
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Abdullah Mia",
    url: "https://github.com/abdullahmia",
  },
  license: "https://opensource.org/licenses/MIT",
  screenshot: `${SITE_URL}/preview.jpeg`,
  softwareVersion: rootPackage.version,
  downloadUrl: [
    "https://hub.docker.com/r/abdullahmia/compooss",
    `${SITE_URL}/#download`,
  ],
  codeRepository: "https://github.com/abdullahmia/compooss",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
