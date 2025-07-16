import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FindIt - Lost and Found Platform',
  description: 'Find lost items and return found items in your community',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar key="navbar" />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
