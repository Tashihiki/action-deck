// =============================================================================
// types.ts — Action Deck
// =============================================================================

import { App } from "obsidian";
import type { HistoryManager } from "./HistoryManager";

// -----------------------------------------------------------------------------
// ActionConfig (New structure for future trigger support)
// -----------------------------------------------------------------------------
export interface ActionConfig {
  /** The entity to execute (e.g., Obsidian command ID) */
  commandId: string;
  /** Trigger ID (empty string means "always execute") */
  triggerId: string;
}

// -----------------------------------------------------------------------------
// LauncherButtonConfig
// -----------------------------------------------------------------------------
export interface LauncherButtonConfig {
  /** Internal management ID */
  id: string;
  /** Button display type */
  type?: "text" | "lucide" | "image" | "image-url" | "svg";
  /** Icon (Emoji / Lucide ID / Vault path / URL / SVG code) */
  icon: string;
  /** Icon tint color */
  iconColor?: string;
  /** Button label (shown as tooltip) */
  label: string;
  /** List of actions to execute */
  actions: ActionConfig[];
  /** Group name this button belongs to */
  launcherGroup?: string;
  /** Whether to show in context menu */
  showInContextMenu?: boolean;
}

// -----------------------------------------------------------------------------
// DeletedItem (For deletion history)
// -----------------------------------------------------------------------------
export interface DeletedItem {
  id: string;
  sectionId: string;
  data: unknown;
  index: number;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// PluginSettings
// -----------------------------------------------------------------------------
export interface PluginSettings {
  /** Settings list for launcher buttons */
  launcherButtons: LauncherButtonConfig[];
  /** Icon font size (px) */
  launcherIconSize: number;
  /** List of launcher groups */
  launcherGroups: string[];
  /** Deletion history */
  history?: Record<string, DeletedItem[]>;
}

// -----------------------------------------------------------------------------
// IActionDeckPlugin (Interface to avoid circular dependencies)
// -----------------------------------------------------------------------------
export interface IActionDeckPlugin {
  app: App;
  settings: PluginSettings;
  historyManager: HistoryManager;
  lastActiveMarkdownLeaf: import("obsidian").WorkspaceLeaf | null;
  saveSettings: () => Promise<void>;
  loadData: () => Promise<unknown>;
  saveData: (data: PluginSettings) => Promise<void>;
}

// -----------------------------------------------------------------------------
// ISettingsTab
// -----------------------------------------------------------------------------
export interface ISettingsTab {
  plugin: IActionDeckPlugin;
  app: App;
  openLauncherButtons: Set<string>;
  handleItemDeletion(sectionId: string, list: unknown[], index: number, renderCallback: () => void): Promise<void>;
  renderSection_LauncherButtons(containerEl: HTMLElement, refresh?: () => void): void;
}

// -----------------------------------------------------------------------------
// Obsidian Internal API Extensions
// -----------------------------------------------------------------------------
export interface ObsidianCommand {
  id: string;
  name: string;
}

export interface ObsidianApp extends App {
  commands: {
    executeCommandById: (id: string) => boolean;
    commands: Record<string, ObsidianCommand>;
  };
}

// -----------------------------------------------------------------------------
// DEFAULT_SETTINGS
// -----------------------------------------------------------------------------
export const DEFAULT_SETTINGS: PluginSettings = {
  launcherButtons: [
    {
      id: "m-0",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2.5" y="4" width="19" height="16" rx="2" stroke="#4B5563" stroke-width="1.5"/>
  <path d="M6 7L8 9L6 11" stroke="#4B5563" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="11" y1="9" x2="18" y2="9" stroke="#4B5563" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="6" y1="13" x2="18" y2="13" stroke="#4B5563" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="6" y1="17" x2="18" y2="17" stroke="#4B5563" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,
      label: "Command palette",
      actions: [{ commandId: "command-palette:open", triggerId: "" }],
      launcherGroup: "",
      type: "svg"
    },
    {
      id: "m-1",
      icon: "📓",
      label: "Today's daily note",
      actions: [{ commandId: "daily-notes", triggerId: "" }],
      launcherGroup: "",
      type: "text"
    },
    {
      id: "m-2",
      icon: "layout-dashboard",
      label: "New canvas",
      actions: [{ commandId: "canvas:new-file", triggerId: "" }],
      launcherGroup: "",
      type: "lucide"
    },
    {
      id: "m-3",
      type: "svg",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke="#4B5563" stroke-width="1.0" stroke-linecap="round"><line x1="12" y1="12" x2="19.8" y2="3.8"/><line x1="12" y1="12" x2="19" y2="12.8"/><line x1="12" y1="12" x2="17.5" y2="19"/><line x1="12" y1="12" x2="7" y2="20"/><line x1="10" y1="12" x2="5" y2="10.6"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="3.2" y1="11.8" x2="6.3" y2="18.5"/><line x1="2.5" y1="10" x2="11.2" y2="4.2"/><line x1="21.0" y1="3.5" x2="21.1" y2="11"/></g><circle cx="12" cy="12" r="3" fill="#3B82F6"/><circle cx="21" cy="2.5" r="2" fill="#8B5CF6"/><circle cx="21" cy="13" r="2" fill="#3B82F6"/><circle cx="18" cy="20" r="2" fill="#3B82F6"/><circle cx="7" cy="20" r="2" fill="#8B5CF6"/><circle cx="12" cy="4" r="2" fill="#3B82F6"/><circle cx="3" cy="10" r="2" fill="#3B82F6"/></svg>`,
      label: "Graph view",
      actions: [{ commandId: "graph:open", triggerId: "" }],
      launcherGroup: ""
    }
  ],
  launcherIconSize: 22,
  launcherGroups: [],
};
