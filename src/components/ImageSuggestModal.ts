import { App, FuzzySuggestModal, TFile } from "obsidian";
import { t } from "../i18n";
import { setSanitizedSVG } from "../svg-utils";

export class ImageSuggestModal extends FuzzySuggestModal<TFile> {
  private onSelect: (file: TFile) => void;

  constructor(app: App, onSelect: (file: TFile) => void) {
    super(app);
    this.onSelect = onSelect;
    this.setPlaceholder(t("modals.image.placeholder") + " (png, jpg, svg, webp...)");
  }

  getItems(): TFile[] {
    const extensions = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"];
    return this.app.vault.getFiles().filter(file => extensions.includes(file.extension.toLowerCase()));
  }

  getItemText(file: TFile): string { return file.path; }

  renderSuggestion(value: import("obsidian").FuzzyMatch<TFile>, el: HTMLElement): void {
    const file = value.item;
    const container = el.createDiv({ cls: "ll-image-suggest-item" });
    const preview = container.createDiv({ cls: "ll-image-suggest-preview" });

    if (file.extension.toLowerCase() === "svg") {
      this.app.vault.read(file).then(content => {
        setSanitizedSVG(preview, content);
      });
    } else {
      const img = preview.createEl("img");
      img.src = this.app.vault.getResourcePath(file);
    }

    const textInfo = container.createDiv();
    textInfo.createDiv({ text: file.name });
    textInfo.createDiv({ text: file.path, cls: "ll-image-suggest-path" });
  }

  onChooseItem(file: TFile, _evt: MouseEvent | KeyboardEvent): void { this.onSelect(file); }
}
