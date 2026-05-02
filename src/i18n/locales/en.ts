// =============================================================================
// src/i18n/locales/en.ts — English (base locale)
// =============================================================================

const en = {
  common: {
    add: "Add",
    delete: "Delete",
    restore: "Restore",
    cancel: "Cancel",
    reset: "Reset to default",
    save: "Save",
    unknown: "Unknown",
    noLabel: "No label",
    confirm: "Confirm",
  },

  panel: {
    title: "ActionDeck",
    empty: "Go to settings > ActionDeck to add launcher buttons",
  },

  settings: {
    title: "ActionDeck",
    desc: "A customizable sidebar launcher. Assign any Obsidian command to a button.",

    buttonSize: {
      heading: "Button size",
      sectionDesc: "Set the icon font size displayed on launcher buttons",
      name: "Launcher icon size",
      desc: "Font size in pixels for icons on all launcher buttons. Default is 22",
    },

    groups: {
      heading: "Launcher groups",
      sectionDesc: "Define groups to organize launcher buttons",
      placeholder: "Group name",
      empty: "No groups yet. Add one below",
      warningEmpty: "Group name is empty",
      addBtn: "Add group",
      newGroup: "New group",
      historyTooltip: "Recent deletions",
      alreadyExists: "{name} already exists",
    },

    buttons: {
      heading: "Launcher buttons",
      sectionDesc: "Define individual launcher buttons",
      empty: "No buttons yet. Add one below",
      warningLabel: "Label or command ID is empty",
      addBtn: "Add button",
      historyTooltip: "Recent deletions",
      alreadyExists: "This button already exists",

      // Field labels
      iconType: "Icon type",
      iconContent: "Icon content",
      label: "Label",
      group: "Group",
      iconColor: "Icon color",
      commandId: "Command ID",
      ungrouped: "Ungrouped",
      selectImage: "Select image",

      // Restore presets
      restoreBtn: "Restore presets",
      restoredNotice: "Restored {count} preset items",
      noPresetsToRestore: "No presets to restore",

      // Icon types
      typeText: "Text or emoji",
      typeLucide: "Lucide",
      typeImage: "Image in vault",
      typeImageUrl: "Image from URL",
      typeSvg: "SVG code",
    },
  },

  history: {
    title: "Deletion history",
    clearBtn: "Clear history",
    clearConfirm: "Clear all deletion history for",
    cleared: "History cleared",
    empty: "No items to restore",
    restored: "Restored",
  },

  notice: {
    commandNotFound: "Command not found",
    launcherError: "Launcher error",
    itemDeleted: "Item deleted",
    undo: "Undo",
    undoRestored: "Restored",
  },
  modals: {
    icon: { placeholder: "Search lucide icon" },
    image: { placeholder: "Select image file" },
  },
} as const;

// Widen all string literal types to `string` so translation files (ja.ts etc.) can assign any string value
type DeepString<T> = {
  [K in keyof T]: T[K] extends string
  ? string
  : T[K] extends object
  ? DeepString<T[K]>
  : T[K];
};

export type Locale = DeepString<typeof en>;
export default en;
