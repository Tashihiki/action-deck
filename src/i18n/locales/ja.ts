// =============================================================================
// src/i18n/locales/ja.ts — Japanese
// =============================================================================
import type { Locale } from "./en";

const ja: Locale = {
  common: {
    add: "追加",
    delete: "削除",
    restore: "復元",
    cancel: "キャンセル",
    reset: "デフォルトに戻す",
    save: "保存",
    unknown: "名称不明",
    noLabel: "ラベルなし",
    confirm: "確定",
  },

  panel: {
    title: "ActionDeck",
    empty: "設定 > ActionDeck でランチャーボタンを追加してください",
  },

  settings: {
    title: "ActionDeck",
    desc: "カスタマイズ可能なサイドバーランチャーです。あらゆるObsidianコマンドをボタンに割り当てられます。",

    buttonSize: {
      heading: "ボタンサイズ",
      sectionDesc: "ランチャーパネルのボタンに表示されるアイコンのサイズを設定します",
      name: "ランチャー アイコンサイズ",
      desc: "全ランチャーボタンのアイコンフォントサイズ（ピクセル単位）。デフォルトは 22",
    },

    groups: {
      heading: "ランチャーグループ",
      sectionDesc: "ランチャーボタンを分類・整理するグループを定義します",
      placeholder: "グループ名を入力",
      empty: "グループがありません。下のボタンから追加してください",
      warningEmpty: "グループ名が未入力です",
      addBtn: "グループを追加",
      newGroup: "新規グループ",
      historyTooltip: "最近の削除履歴",
      alreadyExists: "{name} は既にリストに存在します",
    },

    buttons: {
      heading: "ランチャーボタン",
      sectionDesc: "ランチャーに表示する個々のボタンを定義します",
      empty: "ボタンがありません。下のフォームから追加してください",
      warningLabel: "ラベルまたは実行コマンドidが未入力です",
      addBtn: "ボタンを追加",
      historyTooltip: "最近の削除履歴",
      alreadyExists: "このボタンは既にリストに存在します",

      iconType: "アイコンタイプ",
      iconContent: "アイコン内容",
      label: "ラベル",
      group: "グループ",
      iconColor: "アイコン色",
      commandId: "実行コマンド id",
      ungrouped: "未分類",
      selectImage: "画像を選択",

      // Restore presets
      restoreBtn: "プリセットを復元",
      restoredNotice: "{count} 個のプリセット項目を復元しました",
      noPresetsToRestore: "復元するプリセットはありませんでした",

      typeText: "文字 または 絵文字",
      typeLucide: "Lucide",
      typeImage: "画像 Vault内",
      typeImageUrl: "画像 URLから",
      typeSvg: "Svgコード",
    },
  },

  history: {
    title: "削除履歴",
    clearBtn: "履歴をクリア",
    clearConfirm: "の削除履歴をすべてクリアしますか",
    cleared: "履歴をクリアしました",
    empty: "復元できる項目がありません",
    restored: "復元しました",
  },

  notice: {
    commandNotFound: "コマンドが見つかりません",
    launcherError: "ランチャーエラー",
    itemDeleted: "項目を削除しました",
    undo: "元に戻す",
    undoRestored: "復元しました",
  },
  modals: {
    icon: { placeholder: "lucideアイコンを検索" },
    image: { placeholder: "画像ファイルを選択" },
  },
};

export default ja;
