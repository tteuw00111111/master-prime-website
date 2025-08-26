<meta name="apple-mobile-web-app-title" content="Master Prime" />;
import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const roboto = Roboto({
  weight: ["300", "500"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Master Prime - Reparos de Celular e Notebook | Campo Grande, RJ",
  description:
    "Soluções rápidas e confiáveis para todos os seus aparelhos eletrônicos. Qualidade e confiança que você pode ver.",
  keywords: [
    "conserto de celular",
    "manutenção notebook",
    "manutenção de computador",
    "conserto videogame",
    "Campo Grande",
    "loja de reparos Campo Grande",
  ],
  authors: [{ name: "Master Prime" }],
  applicationName: "Master Prime",
  icons: {
    icon: "/icon1.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Master Prime - Reparos de Celular e Notebook | Campo Grande, RJ",
    description:
      "Soluções rápidas e confiáveis para todos os seus aparelhos eletrônicos.",
    type: "website",
    locale: "pt_BR",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="!scroll-smooth">
      <body
        className={`${inter.variable} ${poppins.variable} ${roboto.variable} font-inter bg-[#0A0A0A] text-gray-200 antialiased`}
      >
        {children}
        {/* 2. Add the Google Ads Scripts here */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17383658790"
          strategy="afterInteractive"
        />
        <Script id="google-ads-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17383658790');
          `}
        </Script>
      </body>
    </html>
  );
}
