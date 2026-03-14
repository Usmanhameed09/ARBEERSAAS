import type { Metadata } from "next";
import { Source_Sans_3, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SavedOpportunitiesProvider } from "@/context/SavedOpportunitiesContext";
import { PipelineProvider } from "@/context/PipelineContext";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARBER - Gov Bid Automation",
  description: "AI-powered SaaS platform for government bid automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SavedOpportunitiesProvider>
            <PipelineProvider>
              <AuthenticatedLayout>{children}</AuthenticatedLayout>
            </PipelineProvider>
          </SavedOpportunitiesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
