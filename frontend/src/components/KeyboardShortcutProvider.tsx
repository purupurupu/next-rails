"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/CommandPalette";
import { ShortcutHelp } from "@/components/ShortcutHelp";

interface KeyboardShortcutContextValue {
  /** コマンドパレットを開く */
  openCommandPalette: () => void;
  /** ショートカットヘルプを開く */
  openShortcutHelp: () => void;
  /** 新規タスク作成ハンドラーを登録 */
  registerCreateTodo: (handler: () => void) => void;
}

const KeyboardShortcutContext
  = createContext<KeyboardShortcutContextValue | null>(null);

/**
 * キーボードショートカットコンテキストを取得するhook
 */
export function useKeyboardShortcutContext(): KeyboardShortcutContextValue {
  const ctx = useContext(KeyboardShortcutContext);
  if (!ctx) {
    throw new Error(
      "useKeyboardShortcutContext must be used within "
      + "KeyboardShortcutProvider",
    );
  }
  return ctx;
}

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

/**
 * グローバルキーボードショートカットを管理するプロバイダー
 *
 * Cmd/Ctrl+K でコマンドパレット、? でヘルプ表示、
 * Cmd/Ctrl+N で新規タスク作成をトリガーする。
 */
export function KeyboardShortcutProvider({
  children,
}: KeyboardShortcutProviderProps) {
  const [commandPaletteOpen, setCommandPaletteOpen]
    = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen]
    = useState(false);

  // 外部から登録される新規タスク作成ハンドラー
  const [createTodoHandler, setCreateTodoHandler]
    = useState<(() => void) | null>(null);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const openShortcutHelp = useCallback(() => {
    setShortcutHelpOpen(true);
  }, []);

  const registerCreateTodo = useCallback(
    (handler: () => void) => {
      setCreateTodoHandler(() => handler);
    },
    [],
  );

  const handleCreateTodo = useCallback(() => {
    if (createTodoHandler) {
      createTodoHandler();
    }
  }, [createTodoHandler]);

  // グローバルショートカット登録
  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: "k",
          meta: true,
          handler: openCommandPalette,
        },
        {
          key: "n",
          meta: true,
          handler: handleCreateTodo,
        },
        {
          key: "?",
          handler: openShortcutHelp,
        },
      ],
      [openCommandPalette, handleCreateTodo, openShortcutHelp],
    ),
    !commandPaletteOpen && !shortcutHelpOpen,
  );

  const contextValue = useMemo(
    () => ({
      openCommandPalette,
      openShortcutHelp,
      registerCreateTodo,
    }),
    [openCommandPalette, openShortcutHelp, registerCreateTodo],
  );

  return (
    <KeyboardShortcutContext.Provider value={contextValue}>
      {children}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onCreateTodo={handleCreateTodo}
        onShowShortcuts={() => {
          setCommandPaletteOpen(false);
          setShortcutHelpOpen(true);
        }}
      />
      <ShortcutHelp
        open={shortcutHelpOpen}
        onOpenChange={setShortcutHelpOpen}
      />
    </KeyboardShortcutContext.Provider>
  );
}
