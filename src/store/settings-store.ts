import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  defaultLlmModel: string;
  jiraWebhookUrl: string;
  testRailWebhookUrl: string;
  alwaysIncludeSecurity: boolean;
  setDefaultLlmModel: (model: string) => void;
  setJiraWebhookUrl: (url: string) => void;
  setTestRailWebhookUrl: (url: string) => void;
  setAlwaysIncludeSecurity: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultLlmModel: 'gemini-1.5-flash',
      jiraWebhookUrl: '',
      testRailWebhookUrl: '',
      alwaysIncludeSecurity: true,
      setDefaultLlmModel: (model) => set({ defaultLlmModel: model }),
      setJiraWebhookUrl: (url) => set({ jiraWebhookUrl: url }),
      setTestRailWebhookUrl: (url) => set({ testRailWebhookUrl: url }),
      setAlwaysIncludeSecurity: (val) => set({ alwaysIncludeSecurity: val }),
    }),
    {
      name: 'qa-studio-settings',
    }
  )
);
