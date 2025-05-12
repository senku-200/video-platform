import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import ClientLayout from '@/components/layout/ClientLayout';
import ClientSidebarWrapper from "@/components/layout/ClientSidebarWrapper";

export const metadata: Metadata = {
  title: "Video Platform",
  description: "A modern video sharing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} ${GeistMono.className} antialiased`}>
        <ClientSidebarWrapper />
        <main>
          <ClientLayout>
            {children}
          </ClientLayout>
        </main>
      </body>
    </html>
  );
}
