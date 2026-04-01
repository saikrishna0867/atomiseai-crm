import { createContext, useContext, useState, ReactNode } from 'react';

interface AppSettingsContextType {
  crmName: string;
  setCrmName: (name: string) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  crmName: 'Atomise AI CRM',
  setCrmName: () => {},
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [crmName, setCrmName] = useState(() => localStorage.getItem('crm_name') || 'Atomise AI CRM');

  const updateCrmName = (name: string) => {
    setCrmName(name);
    localStorage.setItem('crm_name', name);
  };

  return (
    <AppSettingsContext.Provider value={{ crmName, setCrmName: updateCrmName }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
