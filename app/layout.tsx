import type { Metadata } from "next";

import CoreLayout from "@/library/components/template/layout-core";

export const metadata: Metadata = {
  metadataBase: new URL("https://capypolls.vercel.app/"),
  title: "Pander",
  icons: "/logo.svg",
  description: "No loss staking with memecoins",
  openGraph: {
    images: "capypolls-og.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreLayout>{children}</CoreLayout>;
}
