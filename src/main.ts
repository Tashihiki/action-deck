// =============================================================================
// main.ts — ActionDeck
// =============================================================================
import { Plugin, WorkspaceLeaf, Menu } from "obsidian";
import * as obsidian from "obsidian";

import { LauncherButtonView, VIEW_TYPE_LAUNCHER_BUTTON } from "./LauncherButtonView";
import { DEFAULT_SETTINGS, PluginSettings, IActionDeckPlugin } from "./types";
import { ActionDeckSettingTab } from "./SettingsTab";
import { HistoryManager } from "./HistoryManager";
import { t } from "./i18n";

export default class ActionDeckPlugin extends Plugin implements IActionDeckPlugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  historyManager!: HistoryManager;
  public lastActiveMarkdownLeaf: WorkspaceLeaf | null = null;

  async onload() {
    await this.loadSettings();

    this.historyManager = new HistoryManager(this.settings, async () => { await this.saveSettings(); });

    // Register view
    this.registerView(VIEW_TYPE_LAUNCHER_BUTTON, (leaf: WorkspaceLeaf) => new LauncherButtonView(leaf, this));

    // Track the last active markdown leaf (to restore focus after running a command)
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view?.getViewType() === "markdown") {
          this.lastActiveMarkdownLeaf = leaf;
        }
      })
    );

    // Context menu integration
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        this.addLauncherButtonsToMenu(menu, file);
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        this.addLauncherButtonsToMenu(menu, view.file || undefined);
      })
    );

    // Ribbon icon
    this.addRibbonIcon("layout-grid", "Action deck", () => {
      void this.activateLauncherButtonView();
    });

    // Open the panel once the workspace layout is ready
    this.app.workspace.onLayoutReady(async () => {
      if (this.app.workspace.getLeavesOfType(VIEW_TYPE_LAUNCHER_BUTTON).length === 0) {
        await this.activateLauncherButtonView();
      }
    });

    // Command: open launcher panel
    this.addCommand({
      id: "open-launcher-panel",
      name: "Open launcher panel",
      callback: () => { void this.activateLauncherButtonView(); },
    });

    this.addSettingTab(new ActionDeckSettingTab(this.app, this));
  }



  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

    if (this.settings.launcherButtons) {
      let dataChanged = false;
      this.settings.launcherButtons.forEach((m, idx) => {
        // Assign IDs if missing
        if (!m.id) {
          m.id = "m-" + Date.now() + "-" + idx;
          dataChanged = true;
        }
        // Ensure actions exists
        if (!m.actions) {
          m.actions = [];
          dataChanged = true;
        }
        // Initialize empty group if missing
        if (m.launcherGroup === undefined) {
          m.launcherGroup = "";
          dataChanged = true;
        }
      });

      if (dataChanged) await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.app.workspace.trigger("actiondeck:settings-updated");
  }

  async activateLauncherButtonView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_LAUNCHER_BUTTON)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) as WorkspaceLeaf;
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_LAUNCHER_BUTTON, active: true });
      }
    }
    if (leaf) await workspace.revealLeaf(leaf);
  }

  addLauncherButtonsToMenu(menu: Menu, _file?: obsidian.TAbstractFile) {
    const contextMenuButtons = (this.settings.launcherButtons || []).filter(b => b.showInContextMenu);
    if (contextMenuButtons.length === 0) return;

    menu.addSeparator();



    contextMenuButtons.forEach(btn => {
      menu.addItem(item => {
        let title = btn.label;
        if (btn.type === "text" && btn.icon) title = btn.icon + " " + title;
        item.setTitle(title);

        if (btn.type === "lucide") item.setIcon(btn.icon);
        else if (btn.type === "svg") {
          const iconId = `adeck-btn-${btn.id}`;
          obsidian.addIcon(iconId, btn.icon);
          item.setIcon(iconId);
        }

        item.onClick(() => {
          for (const action of btn.actions) {
            // Empty triggerId means "always run"
            if (action.triggerId !== "") continue;

            const success = (this.app as import("./types").ObsidianApp).commands.executeCommandById(action.commandId);
            if (!success) {
              new obsidian.Notice(`⚠️ ${t("notice.commandNotFound")}: ${action.commandId}`);
              break;
            }
          }
        });
      });
    });
  }
}
