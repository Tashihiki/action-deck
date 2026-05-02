// =============================================================================
// LauncherButtonPanel.tsx — ActionDeck
// =============================================================================
import React, { useState, useCallback, useRef, useEffect } from "react";
import { App, Notice, setIcon, setTooltip, normalizePath, TFile } from "obsidian";
import type { LauncherButtonConfig, IActionDeckPlugin } from "./types";
import { setSanitizedSVG } from "./svg-utils";
import { t } from "./i18n";

interface LauncherIconRendererProps {
  macro: LauncherButtonConfig;
  isRunning: boolean;
  plugin: IActionDeckPlugin;
}

export function LauncherIconRenderer({ macro, isRunning, plugin }: LauncherIconRendererProps) {
  const iconRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (macro.type === "lucide" && iconRef.current) {
      try {
        iconRef.current.empty();
        setIcon(iconRef.current, macro.icon || "help-circle");
      } catch {
        // ignore
      }
    } else if (macro.type === "svg" && iconRef.current) {
      setSanitizedSVG(iconRef.current, macro.icon || "");
    }
  }, [macro.type, macro.icon, isRunning]);

  const iconStyle: React.CSSProperties = {
    color: macro.iconColor || "inherit",
    opacity: isRunning ? 0.3 : 1,
  };

  const renderIcon = () => {
    try {
      switch (macro.type) {
        case "lucide":
          return <div ref={iconRef} style={iconStyle} className="ll-icon-renderer" />;
        case "image":
        case "image-url": {
          if (!macro.icon) return <span className="ll-icon-renderer" style={iconStyle}>🖼️</span>;
          if (hasError) return <span className="ll-icon-renderer" style={{ ...iconStyle, fontSize: "0.5em" }}>❌</span>;
          let src = macro.icon;
          if (macro.type === "image" && !src.startsWith("http") && !src.startsWith("data:")) {
            try {
              const file = plugin.app.vault.getAbstractFileByPath(normalizePath(macro.icon));
              if (file instanceof TFile) {
                src = plugin.app.vault.getResourcePath(file);
              } else {
                src = (plugin.app.vault.adapter as import("obsidian").FileSystemAdapter).getResourcePath(normalizePath(macro.icon));
              }
            } catch {
              // ignore
            }
          }
          return (
            <img src={src} alt={macro.label} loading="lazy" decoding="async"
              className="ll-icon-image"
              style={{ opacity: isRunning ? 0.3 : 1 } as React.CSSProperties}
              onError={() => {
                setHasError(true);
              }}
            />
          );
        }
        case "svg":
          return <div ref={iconRef} style={iconStyle} className="ll-icon-renderer ll-launcher-svg-container" />;
        case "text":
        default:
          return <span className="ll-icon-renderer" style={iconStyle}>{macro.icon || "?"}</span>;
      }
    } catch {
      return <span className="ll-icon-renderer" style={iconStyle}>⚠️</span>;
    }
  };

  return (
    <div className="ll-icon-container">
      {renderIcon()}
      {isRunning && (
        <div className="ll-icon-running-overlay" style={{ color: macro.iconColor || "var(--text-accent)" }}>
          ⟳
        </div>
      )}
    </div>
  );
}

interface Props {
  app: App;
  plugin: IActionDeckPlugin;
}

export function LauncherButtonPanel({ app, plugin }: Props) {
  const [runningCmd, setRunningCmd] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    app.workspace.on("actiondeck:settings-updated" as unknown as "active-leaf-change", handleUpdate);
    return () => {
      app.workspace.off("actiondeck:settings-updated" as unknown as "active-leaf-change", handleUpdate);
      if (timeoutRef.current !== null) { window.clearTimeout(timeoutRef.current); }
    };
  }, [app.workspace]);

  const handleLauncher = useCallback((macro: LauncherButtonConfig) => {
    if (runningCmd) return;

    // Use the first action's command ID as the "running" state indicator
    const firstAction = macro.actions.find(a => a.triggerId === "");
    const runningIndicator = firstAction?.commandId || "running";
    setRunningCmd(runningIndicator);

    try {
      const leaf = plugin.lastActiveMarkdownLeaf;
      if (leaf && leaf.view) {
        app.workspace.setActiveLeaf(leaf, { focus: true });
      }

      const commands = (app as import("./types").ObsidianApp).commands;

      for (const action of macro.actions) {
        if (!action.commandId) continue;
        // Only run actions with empty triggerId for now
        if (action.triggerId !== "") continue;

        const success = commands.executeCommandById(action.commandId);
        if (!success) {
          new Notice(`⚠️ ${t("notice.commandNotFound")}: ${action.commandId}`);
          break; // Stop sequential execution on failure
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`❌ ${t("notice.launcherError")}: ${msg}`);
    } finally {
      if (timeoutRef.current !== null) { window.clearTimeout(timeoutRef.current); }
      timeoutRef.current = window.setTimeout(() => setRunningCmd(null), 200);
    }
  }, [app, runningCmd, plugin]);

  const launcherButtons = plugin.settings.launcherButtons ?? [];
  const validGroups = plugin.settings.launcherGroups || [];

  const unassignedButtons: LauncherButtonConfig[] = [];
  const groupedButtons: Record<string, LauncherButtonConfig[]> = {};
  validGroups.forEach(g => groupedButtons[g] = []);

  launcherButtons.forEach(btn => {
    if (btn.launcherGroup && validGroups.includes(btn.launcherGroup)) {
      groupedButtons[btn.launcherGroup].push(btn);
    } else {
      unassignedButtons.push(btn);
    }
  });

  const LauncherButton = ({ btn, isRunning }: { btn: LauncherButtonConfig, isRunning: boolean }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
      if (btnRef.current && btn.label) {
        try {
          setTooltip(btnRef.current, btn.label);
        } catch {
          // ignore
        }
      }
    }, [btn.label]);

    const btnSize = Math.round(plugin.settings.launcherIconSize * 2.65);
    const isFlexible = (btn.type === "text") && Array.from(btn.icon || "").length > 2;
    return (
      <button
        ref={btnRef}
        className={`ll-launcher-btn ll-btn-type-${btn.type || "text"} ${isRunning ? "ll-launcher-running" : ""} ${isFlexible ? "ll-flexible" : ""}`}
        style={{ fontSize: `${plugin.settings.launcherIconSize}px`, '--btn-size': `${btnSize}px` } as React.CSSProperties}
        onClick={() => handleLauncher(btn)}
        disabled={runningCmd !== null}
        aria-label={btn.label}
        data-tooltip-position="top"
      >
        <div className={`ll-launcher-icon ll-type-${btn.type || "text"}`}>
          <LauncherIconRenderer macro={btn} isRunning={isRunning} plugin={plugin} />
        </div>
      </button>
    );
  };

  const renderBtn = (btn: LauncherButtonConfig, key: string) => {
    const isRunning = runningCmd !== null && btn.actions.some(a => a.commandId === runningCmd);
    return <LauncherButton key={key} btn={btn} isRunning={isRunning} />;
  };

  return (
    <div className="ll-launcher-panel">
      <div className="ll-header">
        <span className="ll-title">🎛️ {t("panel.title")}</span>
      </div>
      <div className="ll-launcher-buttons-section">
        {launcherButtons.length > 0 ? (
          <div className="ll-launcher-groups">
            {unassignedButtons.length > 0 && (
              <div className="ll-launcher-group">
                <div className="ll-launcher-grid">
                  {unassignedButtons.map((btn, idx) => renderBtn(btn, `unassigned-${idx}`))}
                </div>
              </div>
            )}
            {validGroups.map(groupName => {
              const groupBtns = groupedButtons[groupName];
              if (!groupBtns || groupBtns.length === 0) return null;
              return (
                <div key={groupName} className="ll-launcher-group">
                  <div className="ll-launcher-group-title">{groupName}</div>
                  <div className="ll-launcher-grid">
                    {groupBtns.map((btn, idx) => renderBtn(btn, `${groupName}-${idx}`))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="ll-empty">{t("panel.empty")}.</p>
        )}
      </div>
    </div>
  );
}
