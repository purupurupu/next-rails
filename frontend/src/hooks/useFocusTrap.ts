import { useEffect, useRef, useCallback } from "react";

/**
 * フォーカストラップを実装するカスタムhook
 *
 * モーダルやダイアログ内でフォーカスを閉じ込め、
 * Tabキーでのフォーカス移動を循環させます。
 *
 * @param active - フォーカストラップが有効かどうか
 * @returns コンテナ要素のref
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose, children }) {
 *   const containerRef = useFocusTrap<HTMLDivElement>(isOpen);
 *
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // フォーカス可能な要素を取得
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"]):not([disabled])",
    );

    return Array.from(elements).filter(
      (el) => el.offsetParent !== null, // 表示されている要素のみ
    );
  }, []);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // アクティブ化時に現在のフォーカス要素を保存
    previousActiveElement.current = document.activeElement;

    // 最初のフォーカス可能な要素にフォーカス
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab で最初の要素から最後の要素へ
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        // Tab で最後の要素から最初の要素へ
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // 非アクティブ化時に以前のフォーカス要素に戻す
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, getFocusableElements]);

  return containerRef;
}
