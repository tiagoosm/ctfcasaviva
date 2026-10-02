import { useEffect, useId, useRef, useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { cn } from '../../utils/format';

// Dropdown styled like the rest of the interface. It follows the ARIA
// "select-only combobox" pattern: focus stays on the button and the arrow
// keys move through the options.
export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
  describedBy,
  buttonRef,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listId = useId();
  const optionId = (index) => `${listId}-${index}`;

  // Closes when the user clicks or taps anywhere else
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openList() {
    setActiveIndex(Math.max(0, options.indexOf(value)));
    setOpen(true);
  }

  function choose(index) {
    onChange(options[index]);
    setOpen(false);
  }

  function move(delta) {
    setActiveIndex((current) => Math.min(options.length - 1, Math.max(0, current + delta)));
  }

  function onKeyDown(event) {
    const { key } = event;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    const actions = {
      ArrowDown: () => move(1),
      ArrowRight: () => move(1),
      ArrowUp: () => move(-1),
      ArrowLeft: () => move(-1),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(options.length - 1),
      Enter: () => choose(activeIndex),
      ' ': () => choose(activeIndex),
      Escape: () => setOpen(false),
    };
    if (key === 'Tab') {
      setOpen(false);
    } else if (actions[key]) {
      event.preventDefault();
      actions[key]();
    }
  }

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-3 rounded-xl border-2 bg-ink-950/70 px-4 text-left text-base transition-colors focus:outline-none focus-visible:outline-none',
          invalid
            ? 'border-danger/70 focus:border-danger'
            : open
              ? 'border-brand-orange'
              : 'border-ink-600 hover:border-fg-subtle focus:border-brand-orange',
        )}
      >
        <span className={value ? 'font-semibold' : 'text-fg-subtle'}>{value || placeholder}</span>
        <LuChevronDown
          className={cn('h-5 w-5 shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 grid w-full animate-fade-in grid-cols-4 gap-1.5 rounded-xl border border-ink-600 bg-ink-850 p-2 shadow-card"
        >
          {options.map((option, index) => {
            const selected = option === value;
            return (
              <li
                key={option}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                onClick={() => choose(index)}
                onPointerMove={() => setActiveIndex(index)}
                className={cn(
                  'flex h-11 cursor-pointer items-center justify-center rounded-lg font-mono text-sm font-semibold transition-colors',
                  selected ? 'bg-brand-orange text-ink-950' : 'text-fg',
                  !selected && index === activeIndex && 'bg-ink-700',
                  selected && index === activeIndex && 'ring-2 ring-brand-orange-light ring-offset-2 ring-offset-ink-850',
                )}
              >
                {option}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
