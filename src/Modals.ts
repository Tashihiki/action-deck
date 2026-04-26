import * as obsidian from "obsidian";
import { t } from "./i18n";

/** Modal for Lucide icon selection */
export class IconSuggestModal extends obsidian.FuzzySuggestModal<string> {
  constructor(app: obsidian.App, private onSelect: (iconId: string) => void) {
    super(app);
    this.setPlaceholder(t("modals.icon.placeholder") + "...");
  }
  getItems(): string[] { return obsidian.getIconIds(); }
  getItemText(item: string): string { return item; }
  renderSuggestion(item: obsidian.FuzzyMatch<string>, el: HTMLElement): void {
    super.renderSuggestion(item, el);
    const iconEl = document.createElement("div");
    obsidian.setIcon(iconEl, item.item);
    iconEl.style.width = "20px";
    iconEl.style.height = "20px";
    el.prepend(iconEl);
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.gap = "10px";
  }
  onChooseItem(item: string, _evt: MouseEvent | KeyboardEvent): void { this.onSelect(item); }
}

/** Generic confirmation modal */
export class GenericConfirmModal extends obsidian.Modal {
  constructor(
    app: obsidian.App,
    private title: string,
    private message: string,
    private onConfirm: () => void,
    private confirmLabel: string = t("common.confirm"),
    private cancelLabel: string = t("common.cancel")
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl, titleEl } = this;
    titleEl.setText(this.title);
    contentEl.createEl("p", { text: this.message });

    const btnContainer = contentEl.createDiv({ cls: "ll-modal-footer" });

    const cancelBtn = btnContainer.createEl("button", { text: this.cancelLabel });
    cancelBtn.onclick = () => this.close();

    const confirmBtn = btnContainer.createEl("button", { text: this.confirmLabel, cls: "mod-warning" });
    confirmBtn.onclick = () => {
      this.onConfirm();
      this.close();
    };
  }
}
