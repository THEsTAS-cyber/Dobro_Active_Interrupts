import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog:
 *  - role="dialog" + aria-modal + aria-labelledby;
 *  - focus moves into the dialog on open and returns to the trigger on close;
 *  - focus trap: Tab / Shift+Tab cycle inside the dialog;
 *  - Esc and a click on the backdrop close it.
 */
export default function Modal({ open, title, onClose, children, initialFocusRef, tone = 'default', describedBy }) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const focusTarget = initialFocusRef?.current || dialogRef.current?.querySelector(FOCUSABLE) || dialogRef.current;
    focusTarget?.focus();
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={dialogRef}
        className={`modal modal--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть окно">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
