import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scholarship & Fellowship Management System',
  description:
    'A secure digital platform for scholarship and fellowship management under the Ministry of Tribal Affairs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}