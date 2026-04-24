// =============================================================================
// SettingsTab.ts — Action Deck settings tab
// =============================================================================
import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type ActionDeckPlugin from "./main";
import { ISettingsTab } from "./types";
import { renderSection_LauncherGroups, renderSection_LauncherButtons } from "./components/settings/SettingsLauncher";
import { t } from "./i18n";

export class ActionDeckSettingTab extends PluginSettingTab implements ISettingsTab {
  plugin: ActionDeckPlugin;
  public openLauncherButtons = new Set<string>();

  constructor(app: App, plugin: ActionDeckPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  public async handleItemDeletion(sectionId: string, list: unknown[], index: number, renderCallback: () => void) {
    const [deletedItem] = list.splice(index, 1);
    await this.plugin.historyManager.push(sectionId, deletedItem, index);
    renderCallback();

    const frag = document.createDocumentFragment();
    frag.appendText(t("notice.itemDeleted") + " ");
    const a = frag.createEl("a", { text: t("notice.undo"), cls: "ll-undo-link" });
    let restored = false;
    a.onclick = async () => {
      if (restored) return;
      const latest = await this.plugin.historyManager.pop(sectionId);
      if (latest) {
        const insertIdx = Math.min(latest.index, list.length);
        list.splice(insertIdx, 0, latest.data);
        await this.plugin.saveSettings();
        renderCallback();
        new Notice(t("notice.undoRestored"));
        restored = true;
      }
    };
    new Notice(frag, 5000);
  }

  public renderSection_LauncherButtons(containerEl: HTMLElement, refresh?: () => void): void {
    renderSection_LauncherButtons(this, containerEl, refresh);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Title
    new Setting(containerEl)
      .setName(t("settings.title"))
      .setDesc(t("settings.desc"))
      .setHeading();

    // ─── Button Size ─────────────────────────────────────────────
    this.createSectionHeading(containerEl, t("settings.buttonSize.heading"));
    containerEl.createEl("p", {
      text: t("settings.buttonSize.sectionDesc"),
      cls: "setting-item-description"
    });
    new Setting(containerEl)
      .setName(t("settings.buttonSize.name"))
      .setDesc(t("settings.buttonSize.desc"))
      .addSlider(slider => slider
        .setLimits(10, 50, 1)
        .setValue(this.plugin.settings.launcherIconSize)
        .setDynamicTooltip()
        .onChange(async (v) => { this.plugin.settings.launcherIconSize = v; await this.plugin.saveSettings(); })
      )
      .addExtraButton(btn => btn
        .setIcon("reset").setTooltip(t("common.reset"))
        .onClick(async () => { this.plugin.settings.launcherIconSize = 22; await this.plugin.saveSettings(); this.display(); })
      );

    // ─── Launcher Groups ─────────────────────────────────────────
    this.createSectionHeading(containerEl, t("settings.groups.heading"));
    containerEl.createEl("p", {
      text: t("settings.groups.sectionDesc"),
      cls: "setting-item-description"
    });
    renderSection_LauncherGroups(this, containerEl, () => this.display());

    // ─── Launcher Buttons ─────────────────────────────────────────
    this.createSectionHeading(containerEl, t("settings.buttons.heading"));
    containerEl.createEl("p", {
      text: t("settings.buttons.sectionDesc"),
      cls: "setting-item-description"
    });
    const launcherButtonsEl = containerEl.createDiv();
    renderSection_LauncherButtons(this, launcherButtonsEl);
  }

  private createSectionHeading(containerEl: HTMLElement, text: string) {
    new Setting(containerEl).setName(text).setHeading();
  }
}
