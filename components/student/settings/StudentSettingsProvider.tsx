'use client';

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  copySettings,
  defaultStudentSettings,
  getSettingsSnapshot,
  persistCurrentSettings,
  resetSettings as resetStoredSettings,
  saveSettings as saveStoredSettings,
  type StudentSettings,
} from '@/lib/studentSettings';
import { translatePortalText } from '@/lib/studentTranslations';

type StudentSettingsContextValue = {
  currentSettings: StudentSettings;
  savedSettings: StudentSettings;
  isLoaded: boolean;
  setCurrentSettings: Dispatch<SetStateAction<StudentSettings>>;
  saveCurrentSettings: () => void;
  cancelChanges: () => void;
  resetToDefaults: () => void;
};

const StudentSettingsContext = createContext<StudentSettingsContextValue | null>(null);

export function StudentSettingsProvider({ children }: { children: ReactNode }) {
  const [currentSettings, setCurrentSettings] = useState<StudentSettings>(() => copySettings(defaultStudentSettings));
  const [savedSettings, setSavedSettings] = useState<StudentSettings>(() => copySettings(defaultStudentSettings));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const snapshot = getSettingsSnapshot();
    setCurrentSettings(snapshot.currentSettings);
    setSavedSettings(snapshot.savedSettings);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) persistCurrentSettings(currentSettings);
  }, [currentSettings, isLoaded]);

  function saveCurrentSettings() {
    const nextSavedSettings = copySettings(currentSettings);
    setSavedSettings(nextSavedSettings);
    saveStoredSettings(nextSavedSettings);
  }

  function cancelChanges() {
    const restoredSettings = copySettings(savedSettings);
    setCurrentSettings(restoredSettings);
    persistCurrentSettings(restoredSettings);
  }

  function resetToDefaults() {
    const defaults = resetStoredSettings();
    setCurrentSettings(defaults);
    setSavedSettings(copySettings(defaults));
  }

  return (
    <StudentSettingsContext.Provider value={{ currentSettings, savedSettings, isLoaded, setCurrentSettings, saveCurrentSettings, cancelChanges, resetToDefaults }}>
      <div
        id="student-portal-root"
        className="min-h-screen"
        inert={!isLoaded}
        aria-busy={!isLoaded}
        data-font-size={currentSettings.fontSize}
        data-high-contrast={String(currentSettings.highContrast)}
        data-reduced-motion={String(currentSettings.reducedMotion)}
      >
        {children}
      </div>
    </StudentSettingsContext.Provider>
  );
}

export function useStudentSettings(): StudentSettingsContextValue {
  const context = useContext(StudentSettingsContext);
  if (!context) throw new Error('useStudentSettings must be used within StudentSettingsProvider');
  return context;
}

export function useStudentTranslation() {
  const { currentSettings } = useStudentSettings();
  return (text: string) => translatePortalText(text, currentSettings.language);
}