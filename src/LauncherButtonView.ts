// =============================================================================
// LauncherButtonView.ts
// =============================================================================
import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { LauncherButtonPanel } from "./LauncherButtonPanel";
import type { IActionDeckPlugin } from "./types";

export const VIEW_TYPE_LAUNCHER_BUTTON = "action-deck-button-view";

export class LauncherButtonView extends ItemView {
  private root: Root | null = null;
  private plugin: IActionDeckPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: IActionDeckPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_LAUNCHER_BUTTON; }
  getDisplayText(): string { return "Action deck"; }
  getIcon(): string { return "layout-grid"; }

  onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    if (!this.root) {
      container.empty();
      container.addClass("ll-view-container");

      const mountPoint = container.createDiv({ cls: "ll-view-mount" });

      this.root = createRoot(mountPoint);
    }

    this.root.render(createElement(LauncherButtonPanel, { app: this.app, plugin: this.plugin }));
    return Promise.resolve();
  }

  onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
    return Promise.resolve();
  }
}
