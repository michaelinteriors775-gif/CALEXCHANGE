import { useId, type ReactNode } from 'react';
import { ChevronDown } from './Icons';

interface CollapsibleProps {
  title: string;
  icon?: ReactNode;
  /** Shown beside the title, e.g. a count badge. */
  badge?: ReactNode;
  /** Shown under the title while collapsed, e.g. the latest entry. */
  summary?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** An accordion section: a full-width header button that expands its content. */
export function Collapsible({ title, icon, badge, summary, open, onToggle, children }: CollapsibleProps) {
  const id = useId();
  return (
    <section className={`drawer${open ? ' is-open' : ''}`}>
      <h2 className="drawer-heading">
        <button type="button" className="drawer-toggle" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          {icon && <span className="drawer-icon">{icon}</span>}
          <span className="drawer-title">
            <span className="drawer-name">
              {title}
              {badge}
            </span>
            {!open && summary && <span className="drawer-summary">{summary}</span>}
          </span>
          <ChevronDown className="drawer-chevron" />
        </button>
      </h2>
      <div className="drawer-body" id={id} inert={!open} aria-hidden={!open}>
        <div className="drawer-inner">
          <div className="drawer-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
