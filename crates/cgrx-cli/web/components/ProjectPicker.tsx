import React, { useMemo, useState } from "react";

export interface WorkspaceProject {
  id: string;
  name: string;
  path: string;
  indexed: boolean;
}
export interface ProjectCatalogue {
  default_project: string;
  projects: WorkspaceProject[];
  directories: string[];
  truncated: boolean;
  warnings: string[];
}

export function ProjectPicker({ catalogue, selectedId, error, onRefresh }: {
  catalogue: ProjectCatalogue | null;
  selectedId: string | null;
  error: string;
  onRefresh: () => void;
}): React.JSX.Element {
  const [filter, setFilter] = useState("");
  const projects = useMemo(() => (catalogue?.projects || []).filter(project =>
    `${project.name} ${project.path}`.toLowerCase().includes(filter.toLowerCase())), [catalogue, filter]);
  const activeId = selectedId || catalogue?.default_project;
  return <section className="project-picker" aria-label="Projects">
    <div className="section-title"><h2>Projects</h2><span>{catalogue?.projects.length ?? "…"}</span>
      <button className="project-refresh" type="button" aria-label="Refresh projects" onClick={onRefresh}>↻</button>
    </div>
    <input className="project-filter" aria-label="Filter projects" placeholder="Filter projects…" value={filter} onChange={e => setFilter(e.target.value)}/>
    {error ? <p className="error" role="alert">{error}</p> : !catalogue ? <p className="quiet">Loading projects…</p> : <>
      <div className="project-list">{projects.map(project => <a className={`project-link${project.id === activeId ? " is-active" : ""}`}
        key={project.id} href={`?project=${encodeURIComponent(project.id)}`} aria-current={project.id === activeId ? "page" : undefined} title={project.path}>
        <span className="project-icon" aria-hidden="true">▱</span><span><strong>{project.name}</strong><small>{project.path}</small></span>
        <span className="project-state">{project.id === activeId ? "Open" : project.indexed ? "Indexed" : "New"}</span>
      </a>)}</div>
      {!projects.length && <p className="quiet">No matching projects.</p>}
      {catalogue.truncated && <p className="quiet">Project list is limited. Choose a narrower projects directory.</p>}
      {catalogue.warnings.map(warning => <p className="error" key={warning}>{warning}</p>)}
    </>}
  </section>;
}
