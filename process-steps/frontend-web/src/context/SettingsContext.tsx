import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export interface SettingsData {
  agentWebsocketUrl: string;
  Authorization: string;
  tenantId: string;
  participantId: string;
  // Keeping agentApiKey for backward compatibility during migration
  agentApiKey?: string;
  // Keeping defaultMetadata for UI purposes - will be converted to getDefaultData function
  defaultMetadata?: string;
}

interface SettingsContextValue {
  settings: SettingsData;
  updateSettings: (newSettings: Partial<SettingsData>) => void;
}

const defaultSettings: SettingsData = {
  agentWebsocketUrl: '',
  Authorization: '',
  tenantId: '',
  participantId: '',
  agentApiKey: '',
  defaultMetadata: '',
};

const STORAGE_KEY = 'agent-settings';

// Function to load settings from localStorage
const loadSettingsFromStorage = (): SettingsData => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      console.log('Loaded settings from localStorage:', parsedSettings);
      
      // Migrate from old agentApiKey to Authorization if needed
      const migratedSettings = { ...defaultSettings, ...parsedSettings };
      if (parsedSettings.agentApiKey && !parsedSettings.Authorization) {
        migratedSettings.Authorization = parsedSettings.agentApiKey;
      }
      // Keep both for compatibility during transition
      if (!migratedSettings.agentApiKey && migratedSettings.Authorization) {
        migratedSettings.agentApiKey = migratedSettings.Authorization;
      }
      
      return migratedSettings;
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  console.log('No saved settings found, using defaults');
  return defaultSettings;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state directly from localStorage
  const [settings, setSettings] = useState<SettingsData>(() => loadSettingsFromStorage());
  const isInitialMount = useRef(true);

  // Save settings to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Don't save on initial mount since we just loaded from storage
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('Settings saved to localStorage:', settings);
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<SettingsData>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value: SettingsContextValue = {
    settings,
    updateSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}; 