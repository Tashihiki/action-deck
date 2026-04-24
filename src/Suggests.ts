import { App, AbstractInputSuggest, TFile } from "obsidian";
import * as obsidian from "obsidian";

interface ObsidianCommand { id: string; name: string; }

export class CommandSuggest extends AbstractInputSuggest<ObsidianCommand> {
  constructor(app: App, private inputEl: HTMLInputElement) { super(app, inputEl); }
  getSuggestions(query: string): ObsidianCommand[] {
    const all = Object.values((this.app as import("./types").ObsidianApp).commands.commands);
    const q = query.toLowerCase();
    return all.filter(cmd => cmd.name.toLowerCase().includes(q) || cmd.id.toLowerCase().includes(q)).slice(0, 30);
  }
  renderSuggestion(cmd: ObsidianCommand, el: HTMLElement): void {
    el.createEl("div", { text: cmd.name });
    el.createEl("small", { text: cmd.id, cls: "ll-suggest-id" });
  }
  selectSuggestion(cmd: ObsidianCommand): void {
    this.inputEl.value = cmd.id;
    this.inputEl.dispatchEvent(new Event("input"));
    this.close();
  }
}

export class FileSuggest extends AbstractInputSuggest<TFile> {
  constructor(app: App, private inputEl: HTMLInputElement, private basePath?: string) { super(app, inputEl); }
  getSuggestions(query: string): TFile[] {
    let files = this.app.vault.getMarkdownFiles();
    if (this.basePath) files = files.filter(f => f.path.startsWith(this.basePath as string));
    const q = query.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(q)).slice(0, 30);
  }
  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.createEl("div", { text: file.basename });
    el.createEl("small", { text: file.path, cls: "ll-suggest-id" });
  }
  selectSuggestion(file: TFile): void {
    this.inputEl.value = file.path;
    this.inputEl.dispatchEvent(new Event("input"));
    this.close();
  }
}

export class FolderSuggest extends AbstractInputSuggest<obsidian.TFolder> {
  constructor(app: App, private inputEl: HTMLInputElement) { super(app, inputEl); }
  getSuggestions(query: string): obsidian.TFolder[] {
    const folders = this.app.vault.getAllLoadedFiles().filter((f): f is obsidian.TFolder => f instanceof obsidian.TFolder);
    const q = query.toLowerCase();
    return folders.filter(f => f.path.toLowerCase().includes(q) && f.path !== "/").slice(0, 30);
  }
  renderSuggestion(folder: obsidian.TFolder, el: HTMLElement): void {
    el.createEl("div", { text: folder.name || "/" });
    el.createEl("small", { text: folder.path, cls: "ll-suggest-id" });
  }
  selectSuggestion(folder: obsidian.TFolder): void {
    this.inputEl.value = folder.path;
    this.inputEl.dispatchEvent(new Event("input"));
    this.close();
  }
}
