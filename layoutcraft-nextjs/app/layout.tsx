import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './styles/base.css';
import './styles/navigation.css';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LayoutCraft - AI Designer',
  description: 'AI-powered design tool for creating professional layouts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
