import { PluginSettings, DeletedItem } from "./types";

const HISTORY_LIMITS: Record<string, number> = {
  launcherButtons: 10,
  launcherGroups: 10,
  default: 10
};

export class HistoryManager {
  private settings: PluginSettings;
  private onSave: () => Promise<void>;

  constructor(settings: PluginSettings, onSave: () => Promise<void>) {
    this.settings = settings;
    this.onSave = onSave;
    if (!this.settings.history) {
      this.settings.history = {};
    }
  }

  async push(sectionId: string, itemData: unknown, index: number) {
    if (!this.settings.history) this.settings.history = {};
    if (!this.settings.history[sectionId]) this.settings.history[sectionId] = [];

    const newItem: DeletedItem = {
      id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      sectionId,
      data: itemData,
      index,
      timestamp: Date.now()
    };

    this.settings.history[sectionId].unshift(newItem);

    const limit = HISTORY_LIMITS[sectionId] || HISTORY_LIMITS.default;
    if (this.settings.history[sectionId].length > limit) {
      this.settings.history[sectionId] = this.settings.history[sectionId].slice(0, limit);
    }

    await this.onSave();
    return newItem;
  }

  async pop(sectionId: string): Promise<DeletedItem | null> {
    const history = this.settings.history?.[sectionId];
    if (!history || history.length === 0) return null;
    const lastItem = history.shift();
    await this.onSave();
    return lastItem || null;
  }

  getHistory(sectionId: string): DeletedItem[] {
    return this.settings.history?.[sectionId] || [];
  }

  async takeItem(sectionId: string, id: string): Promise<DeletedItem | null> {
    const history = this.settings.history?.[sectionId];
    if (!history) return null;
    const idx = history.findIndex(item => item.id === id || (item.timestamp && item.timestamp.toString() === id));
    if (idx === -1) return null;
    const [item] = history.splice(idx, 1);
    await this.onSave();
    return item;
  }

  async clear(sectionId: string): Promise<void> {
    if (this.settings.history && this.settings.history[sectionId]) {
      this.settings.history[sectionId] = [];
      await this.onSave();
    }
  }
}
