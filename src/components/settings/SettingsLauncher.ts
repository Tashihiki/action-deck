// =============================================================================
// SettingsLauncher.ts
// =============================================================================
import { Setting, Notice } from "obsidian";
import * as obsidian from "obsidian";
import { DEFAULT_SETTINGS } from "../../types";
import type { ISettingsTab } from "../../types";
import { HistoryModal } from "../HistoryModal";
import { CommandSuggest } from "../../Suggests";
import { ImageSuggestModal } from "../ImageSuggestModal";
import { IconSuggestModal } from "../../Modals";
import { t } from "../../i18n";
import { setSanitizedSVG } from "../../svg-utils";

export function renderSection_LauncherGroups(tab: ISettingsTab, containerEl: HTMLElement, refresh?: () => void) {
  const settings = tab.plugin.settings;
  if (!settings.launcherGroups) settings.launcherGroups = [];

  const groupListEl = containerEl.createDiv({ cls: "ll-settings-launcher-list" });

  const renderGroupList = () => {
    groupListEl.empty();
    const groups = settings.launcherGroups;
    if (!groups || groups.length === 0) {
      groupListEl.createEl("p", { text: t("settings.groups.empty") + ".", cls: "setting-item-description" });
      return;
    }

    groups.forEach((groupName, idx) => {
      const row = groupListEl.createDiv({ cls: "ll-settings-launcher-row" });

      const nameInput = row.createEl("input", { type: "text", value: groupName, cls: ["ll-settings-launcher-label-input", "ll-flex-grow"] });
      nameInput.placeholder = t("settings.groups.placeholder") + "...";

      const warningIcon = row.createSpan({ text: "⚠️" });
      warningIcon.toggle(!groupName.trim());
      warningIcon.title = t("settings.groups.warningEmpty") + ".";

      const rightHeader = row.createDiv({ cls: "ll-setting-row-header" });

      const upBtn = rightHeader.createEl("button", { text: "▲", cls: "ll-settings-launcher-sort-btn" });
      const downBtn = rightHeader.createEl("button", { text: "▼", cls: "ll-settings-launcher-sort-btn" });
      upBtn.disabled = idx === 0;
      downBtn.disabled = idx === groups.length - 1;

      upBtn.addEventListener("click", async () => {
        [groups[idx], groups[idx - 1]] = [groups[idx - 1], groups[idx]];
        await tab.plugin.saveSettings();
        renderGroupList();
        if (refresh) refresh();
      });
      downBtn.addEventListener("click", async () => {
        [groups[idx], groups[idx + 1]] = [groups[idx + 1], groups[idx]];
        await tab.plugin.saveSettings();
        renderGroupList();
        if (refresh) refresh();
      });

      const delBtn = rightHeader.createEl("button", { text: "✕", cls: "ll-settings-launcher-del" });
      delBtn.addEventListener("click", async () => {
        await tab.handleItemDeletion("launcherGroups", groups, idx, () => {
          void tab.plugin.saveSettings().then(() => {
            renderGroupList();
            if (refresh) refresh();
          });
        });
      });

      nameInput.addEventListener("input", () => {
        warningIcon.toggle(!nameInput.value.trim());
      });
      nameInput.addEventListener("change", async () => {
        const newName = nameInput.value.trim();
        if (newName && newName !== groupName) {
          if (groupName !== "") {
            tab.plugin.settings.launcherButtons.forEach(m => {
              if (m.launcherGroup === groupName) m.launcherGroup = newName;
            });
          }
          groups[idx] = newName;
          await tab.plugin.saveSettings();
          renderGroupList();
          if (refresh) refresh();
        } else if (!newName) {
          groups[idx] = "";
          renderGroupList();
          if (refresh) refresh();
        }
      });
    });
  };

  renderGroupList();

  new Setting(containerEl)
    .addButton(btn => btn
      .setIcon("history")
      .setTooltip(t("settings.groups.historyTooltip") + " (restore)")
      .onClick(() => {
        new HistoryModal(tab.app, tab.plugin, "launcherGroups", t("settings.groups.heading"), async (takenItem) => {
          const groups = tab.plugin.settings.launcherGroups;
          const data = takenItem.data as string;
          if (!groups.includes(data)) {
            groups.push(data);
            await tab.plugin.saveSettings();
          } else {
            new Notice("⚠️ " + t("settings.groups.alreadyExists", { name: data }));
          }
          renderGroupList();
          if (refresh) refresh();
        }).open();
      })
    )
    .addButton(btn => btn
      .setButtonText("＋ " + t("settings.groups.addBtn"))
      .setCta()
      .onClick(() => {
        settings.launcherGroups.push(t("settings.groups.newGroup"));
        void tab.plugin.saveSettings().then(() => {
          renderGroupList();
          if (refresh) refresh();
        });
      })
    );
}

export function renderSection_LauncherButtons(tab: ISettingsTab, containerEl: HTMLElement, _refresh?: () => void) {
  containerEl.empty();

  const launcherButtonListEl = containerEl.createDiv({ cls: "ll-settings-launcher-list" });

  const renderLauncherButtonList = () => {
    launcherButtonListEl.empty();
    const launcherButtons = tab.plugin.settings.launcherButtons;

    if (launcherButtons.length === 0) {
      launcherButtonListEl.createEl("p", { text: t("settings.buttons.empty") + ".", cls: "setting-item-description" });
      return;
    }

    launcherButtons.forEach((btn, idx) => {
      const row = launcherButtonListEl.createDiv({ cls: ["ll-settings-launcher-row", "ll-setting-card"] });

      const isOpen = tab.openLauncherButtons.has(btn.id);

      const header = row.createDiv({ cls: ["ll-setting-flex-header", "ll-clickable-header"] });

      const leftHeader = header.createDiv({ cls: ["ll-setting-row-header", "ll-setting-gap-12"] });

      leftHeader.createSpan({ 
        text: isOpen ? "▼" : "▶", 
        cls: "ll-setting-toggle-icon" 
      });

      // Small icon preview
      const previewEl = leftHeader.createDiv({ cls: "ll-preview-box-small" });

      const refreshHeaderPreview = (customIcon?: string, customColor?: string) => {
        previewEl.empty();
        const iconEl = previewEl.createDiv({ cls: "ll-setting-icon-preview" });
        
        // 動的な色はCSS変数経由で指定（ボット推奨のセット方法）
        iconEl.setCssProps({
          "--icon-color": customColor || btn.iconColor || "var(--text-normal)"
        });

        const type = btn.type || "text";
        const iconValue = customIcon !== undefined ? customIcon : (btn.icon || "");

        if (type === "text") { 
          iconEl.setText(iconValue || "?"); 
          iconEl.addClass("ll-setting-icon-preview-text"); 
        }
        else if (type === "lucide") { 
          obsidian.setIcon(iconEl, iconValue || "help-circle"); 
        }
        else if (type === "image" || type === "image-url") {
          const img = iconEl.createEl("img");
          if (type === "image" && iconValue && !iconValue.startsWith("http") && !iconValue.startsWith("data:")) {
            try { 
              const file = tab.app.vault.getAbstractFileByPath(obsidian.normalizePath(iconValue));
              if (file instanceof obsidian.TFile) { 
                img.src = tab.app.vault.getResourcePath(file); 
              } else {
                img.src = iconValue; 
              }
            } catch { img.src = iconValue; }
          } else { img.src = iconValue; }
        } else if (type === "svg") {
          setSanitizedSVG(iconEl, iconValue || "");
        }
      };
      refreshHeaderPreview();

      const infoText = leftHeader.createDiv({ cls: "ll-flex-column" });

      const labelWrapper = infoText.createDiv({ cls: "ll-setting-label-wrapper" });

      const labelText = labelWrapper.createDiv({ 
        text: btn.label || `(${t("common.noLabel")})`, 
        cls: "ll-setting-label-text" 
      });
      const warningIcon = labelWrapper.createSpan({ text: "⚠️", cls: "ll-setting-warning-icon" });
      const updateWarningVisible = () => {
        const firstAction = btn.actions?.[0];
        warningIcon.toggle(!(btn.label?.trim() && firstAction?.commandId?.trim()));
      };
      updateWarningVisible();
      warningIcon.title = t("settings.buttons.warningLabel") + ".";

      if (btn.launcherGroup && tab.plugin.settings.launcherGroups.includes(btn.launcherGroup)) {
        infoText.createDiv({ text: btn.launcherGroup, cls: "ll-setting-group-tag" });
      }

      const rightHeader = header.createDiv({ cls: "ll-setting-row-header" });

      const stopPropagation = (fn: () => void | Promise<void>) => (e: Event) => { e.stopPropagation(); void fn(); };

      const upBtn = rightHeader.createEl("button", { text: "▲", cls: "ll-settings-launcher-sort-btn" });
      const downBtn = rightHeader.createEl("button", { text: "▼", cls: "ll-settings-launcher-sort-btn" });
      upBtn.disabled = idx === 0;
      downBtn.disabled = idx === launcherButtons.length - 1;

      upBtn.addEventListener("click", stopPropagation(async () => {
        [launcherButtons[idx], launcherButtons[idx - 1]] = [launcherButtons[idx - 1], launcherButtons[idx]];
        await tab.plugin.saveSettings();
        renderLauncherButtonList();
      }));
      downBtn.addEventListener("click", stopPropagation(async () => {
        [launcherButtons[idx], launcherButtons[idx + 1]] = [launcherButtons[idx + 1], launcherButtons[idx]];
        await tab.plugin.saveSettings();
        renderLauncherButtonList();
      }));

      const delBtn = rightHeader.createEl("button", { text: "✕", cls: "ll-settings-launcher-del" });
      delBtn.addEventListener("click", stopPropagation(async () => {
        await tab.handleItemDeletion("launcherButtons", launcherButtons, idx, () => {
          void tab.plugin.saveSettings().then(() => {
            renderLauncherButtonList();
          });
        });
      }));

      header.addEventListener("click", () => {
        if (isOpen) tab.openLauncherButtons.delete(btn.id);
        else tab.openLauncherButtons.add(btn.id);
        renderLauncherButtonList();
      });

      if (!isOpen) return;

      // --- ボタン詳細 Body ---
      const body = row.createDiv({ cls: "ll-setting-card-body" });

      const mainGrid = body.createDiv({ cls: "ll-setting-grid-2col" });

      const leftSide = mainGrid.createDiv({ cls: "ll-setting-column" });
      leftSide.createDiv({ text: t("settings.buttons.iconType"), cls: "setting-item-description" });
      const typeSelect = leftSide.createEl("select", { cls: ["ll-settings-launcher-input", "ll-setting-input-full"] });
      [{ val: "text", name: t("settings.buttons.typeText") }, { val: "lucide", name: t("settings.buttons.typeLucide") }, { val: "image", name: t("settings.buttons.typeImage") }, { val: "image-url", name: t("settings.buttons.typeImageUrl") }, { val: "svg", name: t("settings.buttons.typeSvg") }]
        .forEach(opt => {
          const o = typeSelect.createEl("option", { text: opt.name, value: opt.val });
          if (btn.type === opt.val) o.selected = true;
        });

      // Large icon preview
      const largePreviewEl = leftSide.createDiv({ cls: "ll-preview-box-large" });

      const refreshLargePreview = (customIcon?: string, customColor?: string) => {
        largePreviewEl.empty();
        const ic = largePreviewEl.createDiv({ cls: "ll-setting-icon-large" });

        // 動的な色はCSS変数で制御
        ic.setCssProps({
          "--icon-color": customColor || btn.iconColor || "var(--text-normal)"
        });

        const type = btn.type || "text";
        const iconValue = customIcon !== undefined ? customIcon : (btn.icon || "");

        if (type === "text") { 
          ic.setText(iconValue || "?"); 
          ic.addClass("ll-setting-icon-large-text"); 
        }
        else if (type === "lucide") { 
          obsidian.setIcon(ic, iconValue || "help-circle"); 
        }
        else if (type === "image" || type === "image-url") {
          const img = ic.createEl("img");
          if (type === "image" && iconValue && !iconValue.startsWith("http") && !iconValue.startsWith("data:")) {
            try { 
              const file = tab.app.vault.getAbstractFileByPath(obsidian.normalizePath(iconValue));
              if (file instanceof obsidian.TFile) { 
                img.src = tab.app.vault.getResourcePath(file); 
              } else {
                img.src = iconValue; 
              }
            } catch { img.src = iconValue; }
          } else { img.src = iconValue; }
        } else if (type === "svg") {
          setSanitizedSVG(ic, iconValue || "");
        }
      };
      refreshLargePreview();

      // 右サイド
      const rightSide = mainGrid.createDiv({ cls: ["ll-flex-column", "ll-setting-gap-12"] });

      const iconInputContainer = rightSide.createDiv();
      const renderIconInputFields = () => {
        iconInputContainer.empty();
        iconInputContainer.createDiv({ text: t("settings.buttons.iconContent"), cls: "setting-item-description" });
        const type = btn.type || "text";
        const inputRow = iconInputContainer.createDiv({ cls: "ll-setting-row-header" });
        if (type === "svg") {
          const ta = inputRow.createEl("textarea", { cls: ["ll-settings-launcher-input", "ll-width-full"] });
          ta.value = btn.icon || "";
          ta.addClass("ll-setting-textarea-fix"); // height 80px
          ta.placeholder = "<svg>...</svg>";
          ta.addEventListener("input", () => {
            // 入力中はプレビューを更新しない
          });
          ta.addEventListener("change", async () => {
            btn.icon = ta.value.trim();
            await tab.plugin.saveSettings();
            refreshLargePreview();
            refreshHeaderPreview();
          });
        } else {
          const input = inputRow.createEl("input", { type: "text", value: btn.icon, cls: ["ll-settings-launcher-input", "ll-flex-grow"] });
          input.placeholder = type === "image-url" ? "https://example.com/icon.png" : "";
          input.addEventListener("input", () => {
            // 入力中はプレビューを更新しない
          });
          input.addEventListener("change", async () => {
            btn.icon = input.value.trim();
            await tab.plugin.saveSettings();
            refreshLargePreview();
            refreshHeaderPreview();
          });
          if (type === "image") {
            input.hide();
            const selectBtn = inputRow.createEl("button", { 
              text: t("settings.buttons.selectImage") + "...",
              cls: "ll-flex-grow"
            });
            selectBtn.addEventListener("click", () => {
              new ImageSuggestModal(tab.app, (file) => {
                btn.icon = file.path; input.value = file.path;
                void tab.plugin.saveSettings().then(() => {
                  refreshLargePreview(); refreshHeaderPreview();
                });
              }).open();
            });
          } else if (type === "lucide") {
            const pickBtn = inputRow.createEl("button", { text: "🔎" });
            pickBtn.addEventListener("click", () => {
              new IconSuggestModal(tab.app, (selected) => {
                btn.icon = selected; input.value = selected;
                void tab.plugin.saveSettings().then(() => {
                  refreshLargePreview(); refreshHeaderPreview();
                });
              }).open();
            });
          }
        }
      };
      renderIconInputFields();

      typeSelect.addEventListener("change", async () => {
        btn.type = typeSelect.value as import("../../types").LauncherButtonConfig["type"];
        btn.icon = "";
        await tab.plugin.saveSettings();
        renderIconInputFields();
        refreshLargePreview();
        refreshHeaderPreview();
      });

      const fieldGrid = rightSide.createDiv({ cls: "ll-setting-grid-equal" });

      const labelCont = fieldGrid.createDiv();
      labelCont.createDiv({ text: t("settings.buttons.label"), cls: "setting-item-description" });
      const labelInp = labelCont.createEl("input", { type: "text", value: btn.label, cls: ["ll-settings-launcher-input", "ll-width-full"] });
      labelInp.addEventListener("input", () => {
        // 入力中はラベル表示を更新しない
      });
      labelInp.addEventListener("change", async () => {
        btn.label = labelInp.value.trim();
        labelText.setText(btn.label || `(${t("common.noLabel")})`);
        updateWarningVisible();
        await tab.plugin.saveSettings();
      });

      const groupCont = fieldGrid.createDiv();
      groupCont.createDiv({ text: t("settings.buttons.group"), cls: "setting-item-description" });
      const groupSel = groupCont.createEl("select", { cls: ["ll-settings-launcher-input", "ll-width-full"] });
      const optNone = groupSel.createEl("option", { text: t("settings.buttons.ungrouped"), value: "" });
      if (!btn.launcherGroup) optNone.selected = true;
      tab.plugin.settings.launcherGroups.forEach(g => {
        if (!g.trim()) return;
        const o = groupSel.createEl("option", { text: g, value: g });
        if (g === btn.launcherGroup) o.selected = true;
      });
      groupSel.addEventListener("change", async () => { btn.launcherGroup = groupSel.value; await tab.plugin.saveSettings(); renderLauncherButtonList(); });

      const colorCont = fieldGrid.createDiv();
      colorCont.createDiv({ text: t("settings.buttons.iconColor"), cls: "setting-item-description" });
      const colorRow = colorCont.createDiv({ cls: "ll-setting-row-header" });
      const colorInp = colorRow.createEl("input", { type: "text", value: btn.iconColor || "", cls: ["ll-settings-launcher-input", "ll-flex-grow"] });
      const colorPick = colorRow.createEl("input", { type: "color", value: btn.iconColor || "#000000" });
      colorInp.addEventListener("input", () => {
        const val = colorInp.value.trim();
        if (val.startsWith("#") && val.length >= 7) colorPick.value = val.slice(0, 7);
        // プレビューは更新しない
      });
      colorInp.addEventListener("change", async () => { 
        btn.iconColor = colorInp.value.trim();
        await tab.plugin.saveSettings();
        refreshLargePreview();
        refreshHeaderPreview();
      });
      colorPick.addEventListener("input", () => {
        colorInp.value = colorPick.value;
        // プレビューは更新しない
      });
      colorPick.addEventListener("change", async () => { 
        btn.iconColor = colorPick.value;
        await tab.plugin.saveSettings();
        refreshLargePreview();
        refreshHeaderPreview();
      });

      const cmdCont = body.createDiv();
      cmdCont.createDiv({ text: t("settings.buttons.commandId"), cls: "setting-item-description" });
      const firstAction = btn.actions?.[0] || { commandId: "", triggerId: "" };
      if (!btn.actions) btn.actions = [firstAction];
      
      const cmdInp = cmdCont.createEl("input", { type: "text", value: firstAction.commandId || "", cls: ["ll-settings-launcher-input", "ll-width-full"] });
      new CommandSuggest(tab.app, cmdInp);
      cmdInp.addEventListener("input", () => {
        updateWarningVisible();
      });
      cmdInp.addEventListener("change", async () => {
        if (!btn.actions) btn.actions = [];
        if (btn.actions.length === 0) btn.actions.push({ commandId: "", triggerId: "" });
        btn.actions[0].commandId = cmdInp.value.trim();
        await tab.plugin.saveSettings();
      });

      // showInContextMenu is reserved for future use
    });
  };

  renderLauncherButtonList();

  new Setting(containerEl)
    .addButton(btn => btn
      .setIcon("history")
      .setTooltip(t("settings.buttons.historyTooltip") + " (restore)")
      .onClick(() => {
        new HistoryModal(tab.app, tab.plugin, "launcherButtons", t("settings.buttons.heading"), async (takenItem) => {
          const buttons = tab.plugin.settings.launcherButtons;
          const data = takenItem.data as import("../../types").LauncherButtonConfig;
          if (!buttons.some(b => b.id === data.id)) {
            buttons.push(data);
            await tab.plugin.saveSettings();
          } else {
            new Notice("⚠️ " + t("settings.buttons.alreadyExists"));
          }
          tab.renderSection_LauncherButtons(containerEl);
        }).open();
      })
    )
    .addButton(btn => btn
      .setButtonText("＋ " + t("settings.buttons.addBtn"))
      .setCta()
      .onClick(() => {
        const newId = "m-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5);
        tab.plugin.settings.launcherButtons.push({ 
          id: newId, 
          type: "lucide", 
          icon: "command", 
          label: "", 
          actions: [{ commandId: "", triggerId: "" }], 
          launcherGroup: "", 
          iconColor: "" 
        });
        tab.openLauncherButtons.add(newId);
        void tab.plugin.saveSettings().then(() => {
          tab.renderSection_LauncherButtons(containerEl);
        });
      })
    );

  const resetRow = containerEl.createDiv({ cls: "ll-setting-footer" });
  const restorePresetBtn = resetRow.createEl("button", { text: "↺ " + t("settings.buttons.restoreBtn"), cls: "mod-cta" });
  restorePresetBtn.addEventListener("click", async () => {
    const settings = tab.plugin.settings;
    const missingButtons = DEFAULT_SETTINGS.launcherButtons.filter(db => !settings.launcherButtons.some(cb => cb.id === db.id));
    const missingGroups = (DEFAULT_SETTINGS.launcherGroups || []).filter(dg => !settings.launcherGroups.includes(dg));

    if (missingButtons.length > 0 || missingGroups.length > 0) {
      if (missingButtons.length > 0) {
        settings.launcherButtons.push(...(JSON.parse(JSON.stringify(missingButtons)) as import("../../types").LauncherButtonConfig[]));
      }
      if (missingGroups.length > 0) {
        settings.launcherGroups.push(...missingGroups);
      }
      await tab.plugin.saveSettings();
      tab.renderSection_LauncherButtons(containerEl); // Refresh UI
      new Notice(t("settings.buttons.restoredNotice", { count: (missingButtons.length + missingGroups.length).toString() }));
    } else {
      new Notice(t("settings.buttons.noPresetsToRestore"));
    }
  });
}

