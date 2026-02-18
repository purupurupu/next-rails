"use client";

import { useEffect, useCallback, useRef } from "react";

/** ショートカット定義 */
interface ShortcutDefinition {
  /** ショートカットキー（小文字） */
  key: string;
  /** Cmd (mac) / Ctrl (win/linux) が必要か */
  meta?: boolean;
  /** Shift キーが必要か */
  shift?: boolean;
  /** 実行するハンドラー */
  handler: () => void;
  /** 入力フォーカス中でも有効にするか（デフォルト: false） */
  activeInInput?: boolean;
}

/**
 * テキスト入力要素にフォーカスがあるかを判定
 */
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  if (el instanceof HTMLElement && el.isContentEditable) {
    return true;
  }
  return false;
}

/**
 * グローバルキーボードショートカットを登録するhook
 *
 * input/textarea にフォーカスがあるときは
 * meta付きショートカット以外を自動的に無効化する。
 *
 * @param shortcuts - ショートカット定義の配列
 * @param enabled - ショートカット全体の有効/無効（デフォルト: true）
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: "k", meta: true, handler: openCommandPalette },
 *   { key: "n", meta: true, handler: createNewTodo },
 *   { key: "?", handler: openShortcutHelp },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  enabled: boolean = true,
): void {
  const shortcutsRef = useRef(shortcuts);
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !e.key) return;

    const isMeta = e.metaKey || e.ctrlKey;
    const inputFocused = isInputFocused();

    for (const shortcut of shortcutsRef.current) {
      const keyMatch
        = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const metaMatch = shortcut.meta ? isMeta : !isMeta;
      const shiftMatch = shortcut.shift
        ? e.shiftKey
        : !e.shiftKey;

      if (!keyMatch || !metaMatch || !shiftMatch) continue;

      // 入力中は meta 付きショートカットまたは明示許可のみ有効
      if (inputFocused && !shortcut.meta
        && !shortcut.activeInInput) {
        continue;
      }

      e.preventDefault();
      e.stopPropagation();
      shortcut.handler();
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
