import { App, Modal, Notice, moment } from "obsidian";
import type { IActionDeckPlugin, DeletedItem } from "../types";
import { t } from "../i18n";
import { GenericConfirmModal } from "../Modals";

export class HistoryModal extends Modal {
  private plugin: IActionDeckPlugin;
  private sectionId: string;
  private sectionName: string;
  private onRestore: (item: DeletedItem) => Promise<void>;

  constructor(app: App, plugin: IActionDeckPlugin, sectionId: string, sectionName: string, onRestore: (item: DeletedItem) => Promise<void>) {
    super(app);
    this.plugin = plugin;
    this.sectionId = sectionId;
    this.sectionName = sectionName;
    this.onRestore = onRestore;
  }

  onOpen() { this.render(); }

  render() {
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createDiv({ cls: "ll-history-header" });
    header.createSpan({ text: "🕒", cls: "ll-history-header-icon" });
    const titleContainer = header.createDiv({ cls: "ll-history-title-container" });
    titleContainer.createEl("h2", { text: t("history.title") + ": " + this.sectionName });

    const clearBtn = header.createEl("button", { text: "✕ " + t("history.clearBtn"), cls: "ll-history-clear-btn" });
    clearBtn.addEventListener("click", () => {
      new GenericConfirmModal(
        this.app,
        "✕ " + t("history.clearBtn"),
        t("history.clearConfirm") + " " + this.sectionName + "?",
        () => {
          void this.plugin.historyManager.clear(this.sectionId).then(() => {
            new Notice("✅ " + t("history.cleared"));
            this.render();
          });
        },
        t("common.confirm"),
        t("common.cancel")
      ).open();
    });

    const historyList = this.plugin.historyManager.getHistory(this.sectionId);
    if (historyList.length === 0) {
      contentEl.createEl("p", { text: t("history.empty") + ".", cls: "setting-item-description" });
      return;
    }

    const listEl = contentEl.createDiv({ cls: "ll-history-list" });

    historyList.forEach(item => {
      const row = listEl.createDiv({ cls: "ll-setting-card ll-history-row" });
      const left = row.createDiv({ cls: "ll-history-row-left" });

      const dateStr = moment(item.timestamp).format("YYYY/MM/DD HH:mm:ss");
      left.createDiv({ text: dateStr, cls: "setting-item-description ll-history-date" });

      const data = item.data;
      let itemName = t("common.unknown");
      if (typeof data === "string") itemName = data;
      else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        itemName = (d.name as string) || (d.label as string) || (d.id as string) || t("common.unknown");
      }
      left.createDiv({ text: itemName, cls: "ll-history-item-name" });

      const right = row.createDiv();
      const restoreBtn = right.createEl("button", { text: t("common.restore") });
      restoreBtn.addEventListener("click", () => {
        void (async () => {
          const queryId = item.id || (item.timestamp ? item.timestamp.toString() : "");
          const takenItem = await this.plugin.historyManager.takeItem(this.sectionId, queryId);
          if (takenItem) {
            await this.onRestore(takenItem);
            new Notice("✅ " + t("history.restored") + ": " + itemName);
            this.render();
          }
        })();
      });
    });
  }

  onClose() { this.contentEl.empty(); }
}
