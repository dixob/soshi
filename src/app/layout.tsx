import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soshi — Family Care Management",
  description: "Purpose-built CRM for independent funeral homes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
