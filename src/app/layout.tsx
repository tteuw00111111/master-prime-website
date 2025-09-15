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
  title: "Master Prime - Informática | Campo Grande, RJ",
  description:
    "Soluções rápidas e confiáveis para todos os seus aparelhos eletrônicos. Qualidade e confiança que você pode ver.",
  alternates: { canonical: "https://master-prime.com/" },
  verification: {
    google: "_s5i9STeYhyJHp10jNIJ70pmDwmxx4y5HutIZMs178s",
  },
  keywords: [
    "manutenção de celular",
    "manutenção notebook",
    "manutenção de computador",
    "manutenção videogame",
    "Campo Grande",
    "loja de reparos Campo Grande",
    "manutenção de notebook campo grande",

    "loja de manutenção de notebook",

    "reparo de notebook campo grande",

    "troca de tela de notebook",

    "troca de teclado notebook",

    "upgrade de ssd e ram",

    "formatar notebook campo grande",

    "limpeza interna notebook",

    "manutenção de notebook perto de mim",
    "manutenção de celular campo grande",

    "troca de tela de celular",

    "troca de bateria de celular",

    
    "montagem de pc gamer",

    "montar pc gamer campo grande",

    "upgrade de pc gamer",
  ],
  authors: [{ name: "Master Prime" }],
  applicationName: "Master Prime",
  icons: {
    icon: "/icon1.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Master Prime - Soluções em Tecnologia | Campo Grande, RJ",
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

const GOOGLE_ADS_ID = "AW-17383658790"; // seu ID

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
        {/* 1. Adicione o script do Cookiebot AQUI, antes de tudo */}
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="6638f2ea-d449-4fd0-81ed-4edc2486effd"
          strategy="beforeInteractive"
        />

        {children}

        {/* 2. Seus scripts do Google Ads permanecem aqui, depois do {children} */}
        {/* Google tag (gtag.js) - Google Ads */}
        <Script
          id="gtag-src"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
