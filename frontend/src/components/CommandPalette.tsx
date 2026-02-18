"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Search, Plus, Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, getModKeyLabel } from "@/lib/utils";

/** コマンドパレットのアクション定義 */
interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTodo: () => void;
  onShowShortcuts: () => void;
}

/**
 * Cmd+K で起動するコマンドパレットコンポーネント
 *
 * テキスト入力でアクションをフィルタリングし、
 * キーボード操作（上下矢印、Enter）で選択・実行できる。
 */
export function CommandPalette({
  open,
  onOpenChange,
  onCreateTodo,
  onShowShortcuts,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const modKey = getModKeyLabel();

  const actions: CommandAction[] = useMemo(() => [
    {
      id: "create-todo",
      label: "新規タスクを作成",
      icon: <Plus className="h-4 w-4" />,
      shortcut: `${modKey}+N`,
      onSelect: () => {
        onOpenChange(false);
        onCreateTodo();
      },
    },
    {
      id: "shortcuts",
      label: "キーボードショートカットを表示",
      icon: <Keyboard className="h-4 w-4" />,
      shortcut: "?",
      onSelect: () => {
        onOpenChange(false);
        onShowShortcuts();
      },
    },
  ], [modKey, onOpenChange, onCreateTodo, onShowShortcuts]);

  const filteredActions = useMemo(() => {
    if (!query) return actions;
    const lower = query.toLowerCase();
    return actions.filter((action) =>
      action.label.toLowerCase().includes(lower),
    );
  }, [query, actions]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setSelectedIndex(0);
    },
    [],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setQuery("");
        setSelectedIndex(0);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  // ダイアログが開いたらinputにフォーカス
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredActions.length - 1),
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            filteredActions[selectedIndex].onSelect();
          }
          break;
        }
      }
    },
    [filteredActions, selectedIndex],
  );

  // 選択項目が変わったらスクロール
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as
      | HTMLElement
      | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        aria-label="コマンドパレット"
      >
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="コマンドを入力..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
          />
        </div>

        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto p-2"
          role="listbox"
          aria-label="コマンド一覧"
        >
          {filteredActions.length === 0
            ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  一致するコマンドがありません
                </div>
              )
            : (
                filteredActions.map((action, index) => (
                  <button
                    key={action.id}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                    onClick={() => action.onSelect()}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {action.icon}
                    </span>
                    <span className="flex-1 text-left">
                      {action.label}
                    </span>
                    {action.shortcut && (
                      <kbd className="ml-auto inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
