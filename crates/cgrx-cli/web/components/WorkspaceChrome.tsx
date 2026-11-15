import React from "react";
import type { Mode } from "../types";

const glyphs: Record<string, React.ReactNode> = {
  project: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="10" cy="18" r="2"/><path d="m8 6 8 2M7 8l2 8m3 1 5-7"/></>,
  current: <><path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18"/></>,
  architecture: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  changes: <><path d="M6 3v18m12-18v18M3 8h6m6 8h6"/><circle cx="6" cy="8" r="2"/><circle cx="18" cy="16" r="2"/></>,
  preview: <><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3"/></>,
  compare: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M6 12h3m6 0h3"/></>,
  history: <><path d="M4 9a8 8 0 1 1 0 7M4 3v6h6m2-2v5l3 2"/></>,
  search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
};

export function WorkspaceDock({ mode, modes, onMode, discoveryOpen, onDiscovery }: {
  mode: Mode; modes: Array<{ id: Mode; label: string }>; onMode: (mode: Mode) => void;
  discoveryOpen: boolean; onDiscovery: () => void;
}): React.JSX.Element {
  return <nav className="workspace-dock" aria-label="Graph mode">
    <span className="dock-brand" aria-label="CGRX">cx</span>
    <button className="dock-button" title="Search and explore" aria-label="Search and explore" aria-expanded={discoveryOpen} aria-controls="discovery-panel" onClick={onDiscovery}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{glyphs.search}</svg>
    </button>
    <span className="dock-divider"/>
    {modes.map(item => <button key={item.id} className={`dock-button${mode === item.id ? " is-active" : ""}`} title={item.label} aria-label={item.label} aria-pressed={mode === item.id} onClick={() => onMode(item.id)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{glyphs[item.id]}</svg>
      <span className="dock-tooltip">{item.label}</span>
    </button>)}
  </nav>;
}

export function PanelHeading({ title, detail, onClose }: { title: string; detail?: string; onClose: () => void }): React.JSX.Element {
  return <div className="panel-heading"><div><h2>{title}</h2>{detail && <span>{detail}</span>}</div>
    <button className="panel-close" onClick={onClose} aria-label={`Close ${title}`} title={`Close ${title}`}>×</button>
  </div>;
}
