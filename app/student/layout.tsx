import type { ReactNode } from 'react';
import { StudentSettingsProvider } from '@/components/student/settings/StudentSettingsProvider';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentSettingsProvider>{children}</StudentSettingsProvider>;
}