import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Bora Indicar - Ganhe Dinheiro Indicando",
  description: "Transforme suas indicações em renda extra! Sistema completo com gamificação, prêmios instantâneos e comissões automáticas. Cadastre-se grátis agora!",
  keywords: "indicação, renda extra, comissões, afiliados, ganhar dinheiro, programa de indicação",
  openGraph: {
    title: "Bora Indicar - Ganhe Dinheiro Indicando",
    description: "Sistema completo de indicações com gamificação, prêmios instantâneos e comissões automáticas.",
    type: "website",
    locale: "pt_BR",
    siteName: "Bora Indicar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bora Indicar - Ganhe Dinheiro Indicando",
    description: "Sistema completo de indicações com gamificação, prêmios instantâneos e comissões automáticas.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
