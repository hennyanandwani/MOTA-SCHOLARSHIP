import type { Metadata } from 'next';
import './globals.css';
import { StudentSettingsProvider } from '@/components/student/settings/StudentSettingsProvider';

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
      <body>
        <StudentSettingsProvider>
          {children}
        </StudentSettingsProvider>
      </body>
    </html>
  );
}