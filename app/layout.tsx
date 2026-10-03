import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ekis",
  description: "Ekis web application",
  appleWebApp: {
    capable: true,
    title: "Ekis",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#e0218a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="se">
      <body>{children}</body>
    </html>
  );
}
