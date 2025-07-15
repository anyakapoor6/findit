import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// import StyledComponentsRegistry from '../lib/registry';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FindIt - Lost and Found",
  description: "Find your lost items or help others find theirs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.className}>
        {/* <StyledComponentsRegistry> */}
        <Navbar />
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem',
          minHeight: '80vh'
        }}>
          {children}
        </main>
        <Footer />
        {/* </StyledComponentsRegistry> */}
      </body>
    </html>
  );
}
