function _(e,t){let i=new Set(e.map(r=>r.lane)),o=0;for(;i.has(o)||t.has(o);)o+=1;return o}function j(e,t={}){let i=t.previous?.rowOffset??0,o=(t.previous?.lanes??[]).map(c=>({...c})),r=t.previous?.nextColour??0,n=[],s=[],a=o.reduce((c,h)=>Math.max(c,h.lane),-1);for(let c=0;c<e.length;c+=1){let h=e[c],g=i+c,v=o.filter(u=>u.target===h.oid).sort((u,y)=>u.lane-y.lane),b=new Set,d=v[0]??{lane:_(o,b),target:h.oid,colour:r++};a=Math.max(a,d.lane),n.push({oid:h.oid,lane:d.lane,row:g,colour:d.colour,kind:h.kind});for(let u of o)u.target!==h.oid&&(s.push({from:{lane:u.lane,row:u.fromRow},to:{lane:u.lane,row:g},colour:u.colour}),u.fromRow=g);for(let u of v)s.push({from:{lane:u.lane,row:u.fromRow},to:{lane:d.lane,row:g},colour:u.colour,anchor:"to"});for(let u=o.length-1;u>=0;u-=1)o[u].target===h.oid&&o.splice(u,1);let x=h.parents.filter(Boolean),k=x[0];k&&(o.push({lane:d.lane,target:k,colour:d.colour,fromRow:g}),b.add(d.lane));for(let u of x.slice(1)){let y=o.find(q=>q.target===u);if(y){s.push({from:{lane:d.lane,row:g},to:{lane:y.lane,row:g+1},colour:y.colour,anchor:"from"});continue}let E=_(o,b);b.add(E),a=Math.max(a,E);let $=r++;o.push({lane:E,target:u,colour:$,fromRow:g+1}),s.push({from:{lane:d.lane,row:g},to:{lane:E,row:g+1},colour:$,anchor:"from"})}}let m=i+e.length;for(let c of o)c.fromRow<m&&(s.push({from:{lane:c.lane,row:c.fromRow},to:{lane:c.lane,row:m},colour:c.colour,dangling:!0}),c.fromRow=m);return{nodes:n,segments:s,state:{lanes:o.map(c=>({...c})),nextColour:r,rowOffset:m},laneCount:Math.max(1,a+1)}}var Q="web-git-graph",S=["#e3008c","#007acc","#00c853","#ff8c00","#b180d7","#00b7c3","#dcdcaa"],Z=new Set(["current","head"]),U=typeof navigator<"u"&&/mac|iphone|ipad|ipod/i.test(navigator.userAgent??""),ee=[78,54,88,41,69,82,47,61],M=[64,88,45,73,52],te=`
:host {
  /* Prefer VS Code / host theme tokens when present (they inherit into the
     shadow tree), then fall back to a neutral dark palette for standalone use. */
  --wgg-bg: var(--vscode-editor-background, #1e1e1e);
  --wgg-panel: var(--vscode-sideBar-background, var(--vscode-editorWidget-background, var(--vscode-editor-background, #252526)));
  --wgg-panel-raised: var(--vscode-editorWidget-background, var(--vscode-sideBar-background, #2d2d30));
  --wgg-ink: var(--vscode-foreground, var(--vscode-editor-foreground, #d4d4d4));
  --wgg-muted: var(--vscode-descriptionForeground, #a9a9a9);
  --wgg-faint: var(--vscode-disabledForeground, #777);
  --wgg-line: var(--vscode-panel-border, var(--vscode-widget-border, #3c3c3c));
  --wgg-hover: var(--vscode-list-hoverBackground, #2a2d2e);
  --wgg-selected: var(--vscode-list-inactiveSelectionBackground, var(--vscode-editor-inactiveSelectionBackground, #37373d));
  --wgg-accent: var(--vscode-focusBorder, #3794ff);
  --wgg-warning: var(--vscode-editorWarning-foreground, #cca700);
  --wgg-row-height: 24px;
  --wgg-graph-width: 72px;
  --wgg-date-width: 142px;
  --wgg-author-width: 150px;
  --wgg-commit-width: 82px;
  display: block;
  min-height: 420px;
  color: var(--wgg-ink);
  font-family: var(--wgg-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  background: var(--wgg-bg);
  border: 1px solid var(--wgg-line);
  overflow: hidden;
  color-scheme: dark;
  container-type: inline-size;
  container-name: wgg;
}
:host([theme="light"]) {
  --wgg-bg: var(--vscode-editor-background, #ffffff);
  --wgg-panel: var(--vscode-sideBar-background, var(--vscode-editorWidget-background, var(--vscode-editor-background, #f3f3f3)));
  --wgg-panel-raised: var(--vscode-editorWidget-background, var(--vscode-sideBar-background, #f8f8f8));
  --wgg-ink: var(--vscode-foreground, var(--vscode-editor-foreground, #333333));
  --wgg-muted: var(--vscode-descriptionForeground, #616161);
  --wgg-faint: var(--vscode-disabledForeground, #8e8e8e);
  --wgg-line: var(--vscode-panel-border, var(--vscode-widget-border, #d4d4d4));
  --wgg-hover: var(--vscode-list-hoverBackground, #f0f0f0);
  --wgg-selected: var(--vscode-list-inactiveSelectionBackground, var(--vscode-editor-inactiveSelectionBackground, #e4e6f1));
  --wgg-accent: var(--vscode-focusBorder, #3794ff);
  --wgg-warning: var(--vscode-editorWarning-foreground, #cca700);
  color-scheme: light;
}
:host([hosted]) .theme-toggle { display: none; }
:host([density="compact"]) { --wgg-row-height: 20px; }
* { box-sizing: border-box; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
.shell { position: relative; min-height: inherit; height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr); }
.toolbar {
  min-height: 42px;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 6px 10px;
  background: var(--wgg-panel);
  border-bottom: 1px solid var(--wgg-line);
  font-size: 12px;
}
.branch-control, .remote-control { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.branch-control strong, .remote-control { font-weight: 600; }
.remote-control input { margin: 0; accent-color: var(--wgg-accent); }
.ref-select {
  height: 28px; max-width: min(250px, 40cqw); display: flex; align-items: center; gap: 6px;
  border: 1px solid var(--wgg-line); background: var(--wgg-bg); border-radius: 2px; padding: 3px 7px;
}
.ref-select:hover { background: var(--wgg-hover); }
.ref-select-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.caret { flex: none; color: var(--wgg-muted); font-size: 9px; }
.repository-name {
  min-width: 0; flex: 1; color: var(--wgg-muted); overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; text-align: center;
}
.search {
  width: min(240px, 40cqw); height: 28px; border: 1px solid var(--wgg-line); background: var(--wgg-bg);
  border-radius: 2px; padding: 4px 7px; outline: none; font-size: 12px;
}
.search:focus, select:focus, button:focus-visible { outline: 1px solid var(--wgg-accent); outline-offset: -1px; }
.tools { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.find { display: flex; align-items: center; gap: 2px; }
.search-count {
  min-width: 44px; padding: 0 3px; text-align: center; color: var(--wgg-muted);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.icon-button:disabled { color: var(--wgg-faint); background: transparent; cursor: default; }
select, .icon-button {
  height: 28px; border: 1px solid var(--wgg-line); background: var(--wgg-bg);
  border-radius: 2px; padding: 3px 7px;
}
.icon-button { min-width: 28px; color: var(--wgg-muted); background: transparent; border-color: transparent; }
.icon-button:hover { color: var(--wgg-ink); background: var(--wgg-hover); }
.body {
  min-height: 0; position: relative;
}
.history { min-width: 0; height: 100%; display: grid; grid-template-rows: 34px minmax(0, 1fr); }
.header, .row {
  display: grid;
  /* Description may shrink to zero so the graph column keeps its reserved
     width; the commit message ellipsises before branch chips are clipped. */
  grid-template-columns:
    var(--wgg-graph-width) minmax(0, 1fr) var(--wgg-date-width)
    var(--wgg-author-width) var(--wgg-commit-width);
  align-items: center;
}
.header {
  padding-right: 10px; background: var(--wgg-bg); color: var(--wgg-ink);
  border-bottom: 1px solid var(--wgg-line); font-size: 12px; font-weight: 600;
}
.header > span {
  height: 100%; display: flex; align-items: center; justify-content: center;
  padding: 0 8px; border-right: 1px solid var(--wgg-line);
}
.scroller { position: relative; overflow: auto; min-height: 0; outline: none; scrollbar-color: var(--wgg-faint) transparent; }
.spacer { position: relative; min-width: max(100%, calc(var(--wgg-graph-width) + 280px + var(--wgg-date-width) + var(--wgg-author-width) + var(--wgg-commit-width))); }
.window { position: absolute; inset: 0 0 auto 0; min-height: 100%; }
.row {
  height: var(--wgg-row-height); padding-right: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--wgg-line) 30%, transparent);
  position: absolute; left: 0; right: 0; cursor: default; font-size: 12px;
}
.row:hover, .row.preview, .row.context-active { background: var(--wgg-hover); }
.row.match { background: color-mix(in srgb, var(--wgg-warning) 16%, transparent); }
.row.match-current { box-shadow: inset 0 0 0 1px var(--wgg-warning); }
.row.selected { background: var(--wgg-selected); }
.row.compare { box-shadow: inset 2px 0 var(--wgg-warning); }
.row.merge .message { color: var(--wgg-muted); }
.row.working-tree .message { font-weight: 600; }
.row:focus { outline: 1px solid var(--wgg-accent); outline-offset: -1px; }
.graph-cell { height: 100%; position: relative; overflow: hidden; }
.subject {
  min-width: 0; display: flex; align-items: center; gap: 5px; padding: 0 4px;
  overflow: hidden; position: relative; z-index: 2;
}
.message { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Branch chips never ellipsis \u2014 same behaviour as vscode-git-graph's .gitRef. */
.refs { flex: 0 0 auto; display: flex; gap: 2px; }
.ref {
  flex: 0 0 auto; white-space: nowrap;
  font: 600 10px/15px var(--wgg-font, inherit); padding: 0 5px; border-radius: 2px;
  border: 1px solid var(--ref-color, var(--wgg-accent));
  background: color-mix(in srgb, var(--ref-color, var(--wgg-accent)) 18%, transparent);
  color: var(--wgg-ink);
}
/* Only the checked-out branch is solid, so "you are here" reads at a glance
   while every other branch is emphasised by its lane-coloured border. */
.ref.current { background: var(--ref-color, var(--wgg-accent)); color: #fff; }
/* Remote branches recede by colour rather than by line style: a grey outline
   with no tint, so they read as "not here" without a busy dashed border. */
.ref.remote {
  /* --wgg-faint rather than --wgg-line: the border has to stay legible against
     both the dark and the light background. */
  border-color: var(--wgg-faint);
  background: transparent;
  color: var(--wgg-muted);
  font-weight: 400;
}
.ref.tag, .ref.stash { background: var(--ref-color); color: #fff; }
.ref.tag { --ref-color: #0e639c; }
.ref.stash { --ref-color: #9b2f86; }
.author, .date, .oid {
  min-width: 0; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--wgg-ink); position: relative; z-index: 2;
}
.date, .author { text-align: center; }
.author { display: flex; align-items: center; justify-content: center; gap: 5px; }
.author-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.avatar {
  position: relative; flex: none; width: 16px; height: 16px; border-radius: 50%; overflow: hidden;
  display: grid; place-items: center; font: 600 9px/1 var(--wgg-font, inherit); color: #fff;
  background: var(--avatar-color, var(--wgg-faint));
}
.avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shell[data-hide-date] { --wgg-date-width: 0px; }
.shell[data-hide-author] { --wgg-author-width: 0px; }
.shell[data-hide-commit] { --wgg-commit-width: 0px; }
.shell[data-hide-date] .col-date, .shell[data-hide-date] .date,
.shell[data-hide-author] .col-author, .shell[data-hide-author] .author,
.shell[data-hide-commit] .col-commit, .shell[data-hide-commit] .oid {
  padding: 0; border-right: 0; visibility: hidden;
}
.menu {
  position: absolute; z-index: 20; min-width: 190px; max-width: min(320px, 90%); padding: 4px;
  background: var(--wgg-panel-raised); border: 1px solid var(--wgg-line); border-radius: 4px;
  box-shadow: 0 4px 14px rgb(0 0 0 / 32%); font-size: 12px;
}
.menu-scroll { max-height: min(340px, 55vh); overflow: auto; scrollbar-color: var(--wgg-faint) transparent; }
.menu-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 4px 8px;
  border: 0; border-radius: 2px; background: transparent; text-align: left; white-space: nowrap;
}
.menu-item:hover:not(:disabled) { background: var(--wgg-hover); }
.menu-item:disabled { color: var(--wgg-faint); cursor: default; }
.menu-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.menu-check { flex: none; width: 12px; text-align: center; color: var(--wgg-accent); }
.menu-group {
  padding: 6px 8px 2px; color: var(--wgg-muted); font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.menu-separator { height: 1px; margin: 4px 2px; background: var(--wgg-line); }
.oid { font-family: var(--wgg-mono, ui-monospace, SFMono-Regular, Consolas, monospace); font-size: 11px; text-align: center; }
.graph {
  /* Clip to the graph column so strokes never paint over description text, and
     paint above the expanded details panel so lanes cross it unbroken \u2014 the
     same layering vscode-git-graph uses for #commitGraph over #cdv. */
  position: absolute; left: 0; z-index: 4; pointer-events: none;
  width: var(--wgg-graph-width); overflow: hidden;
}
.graph path { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }
.graph circle { stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.inline-details {
  position: absolute; left: 0; right: 0; z-index: 3;
  display: flex; overflow: hidden;
  padding-left: var(--wgg-graph-width);
  background: var(--wgg-panel);
  border-top: 1px solid var(--wgg-line); border-bottom: 1px solid var(--wgg-line);
  font-size: 12px;
  animation: details-open 120ms ease-out;
}
.details-summary { flex: 1 1 55%; min-width: 0; overflow: auto; padding: 8px 12px 12px; }
.details-files {
  flex: 1 1 45%; min-width: 0; overflow: auto; padding: 5px 26px 8px 8px;
  border-left: 1px solid var(--wgg-line);
}
.details-close {
  position: absolute; top: 3px; right: 5px; z-index: 1;
  width: 22px; height: 22px; padding: 0; border: 0; border-radius: 2px;
  background: transparent; color: var(--wgg-muted); font-size: 14px; line-height: 1;
}
.details-close:hover { background: var(--wgg-hover); color: var(--wgg-ink); }
.details-heading { margin: 0 0 6px; font-size: 12px; font-weight: 600; }
.meta { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 2px 10px; margin: 0; }
.meta dt { color: var(--wgg-muted); font-weight: 600; }
.meta dd { margin: 0; overflow-wrap: anywhere; }
.meta .oid-value { font-family: var(--wgg-mono, ui-monospace, SFMono-Regular, Consolas, monospace); font-size: 11px; }
.commit-body { margin: 10px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.45; }
.actions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }
.action {
  border: 1px solid var(--wgg-line); border-radius: 2px; background: var(--wgg-panel-raised);
  padding: 3px 8px; font-size: 11px;
}
.action.primary { border-color: var(--wgg-accent); background: #0e639c; color: #fff; }
.tree, .tree ul { margin: 0; padding: 0; list-style: none; }
.tree ul { padding-left: 14px; }
.tree-dir, .tree-file {
  width: 100%; display: flex; align-items: center; gap: 6px; padding: 1px 4px;
  border: 0; border-radius: 0; background: transparent; text-align: left;
  font-size: 11px; white-space: nowrap;
}
.tree-dir:hover, .tree-file:hover { background: var(--wgg-hover); }
.tree-file.active { background: var(--wgg-selected); }
.twistie { flex: none; width: 10px; color: var(--wgg-muted); font-size: 9px; }
.dir-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--wgg-muted); }
.change-code { flex: none; width: 12px; text-align: center; font: 11px var(--wgg-mono, ui-monospace, monospace); color: var(--wgg-muted); }
.change-code.add { color: #81b88b; }
.change-code.modify { color: #e2c08d; }
.change-code.delete { color: #f14c4c; }
.change-code.rename, .change-code.copy { color: #6cb8e6; }
.change-path { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; }
.stats { flex: none; font: 10px var(--wgg-mono, ui-monospace, monospace); color: var(--wgg-muted); }
.no-changes { margin: 6px 4px; color: var(--wgg-faint); font-size: 11px; }
.patch {
  margin: 10px 0 0; padding: 10px; overflow: auto; border: 1px solid var(--wgg-line);
  background: var(--wgg-bg); font: 10px/1.55 var(--wgg-mono, ui-monospace, monospace); white-space: pre; tab-size: 2;
}
.empty, .loading, .error { display: grid; place-items: center; min-height: 220px; color: var(--wgg-muted); text-align: center; padding: 30px; }
.error { color: #ff8585; }
/* Waiting states breathe rather than blink: a slow opacity swell on the whole
   surface plus a sheen travelling along each placeholder bar. Both are pure
   compositor work, so they stay smooth while Git is being read. */
@keyframes wgg-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
@keyframes wgg-sheen { from { background-position: 180% 0; } to { background-position: -80% 0; } }
.pending { position: relative; animation: wgg-breathe 2.6s ease-in-out infinite; }
.pending-bar {
  height: 8px; border-radius: 4px;
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--wgg-line) 55%, transparent) 18%,
    color-mix(in srgb, var(--wgg-muted) 40%, transparent) 42%,
    color-mix(in srgb, var(--wgg-line) 55%, transparent) 66%
  );
  background-size: 260% 100%;
  animation: wgg-sheen 2.2s linear infinite;
}
.pending-dot {
  justify-self: start; margin-left: 11.5px;
  width: 9px; height: 9px; border-radius: 50%;
  background: color-mix(in srgb, var(--wgg-muted) 45%, transparent);
}
/* Laid out on the row grid, so the placeholder occupies exactly the space the
   history is about to take: the first paint settles instead of jumping. */
.pending-rows { position: relative; display: grid; align-content: start; }
.pending-rows::before {
  content: ""; position: absolute; left: 15.5px; top: 12px; bottom: 12px; width: 1px;
  background: color-mix(in srgb, var(--wgg-muted) 30%, transparent);
}
.pending-row {
  display: grid; grid-template-columns: var(--wgg-graph-width) minmax(0, 1fr);
  align-items: center; height: var(--wgg-row-height); padding-right: 10px;
}
.pending-label { color: var(--wgg-muted); font-size: 12px; text-align: center; }
.loading-view { position: relative; min-height: 220px; height: 100%; overflow: hidden; }
/* A soft wash breathing over the whole surface, so the wait reads as one
   living panel rather than eight bars ticking on their own. */
.loading-view::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(
    62% 58% at 42% 34%,
    color-mix(in srgb, var(--wgg-accent) 12%, transparent),
    transparent 72%
  );
  animation: wgg-breathe 3.6s ease-in-out infinite;
}
.loading-view .pending-label { position: relative; padding: 22px 20px 0; }
.details-pending { display: grid; gap: 11px; padding: 8px 2px 0; }
.details-pending .pending-bar { height: 7px; }
@media (prefers-reduced-motion: reduce) {
  .pending, .pending-bar, .loading-view::after { animation: none; }
  .pending { opacity: 0.7; }
}
.load-more { position: absolute; left: 50%; display: block; margin: 8px 0; transform: translateX(-50%); }
@keyframes details-open {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Use the host width \u2014 not the IDE window \u2014 so a narrow webview/side panel
   collapses columns the same way a narrow browser window would. */
@container wgg (max-width: 760px) {
  .toolbar { gap: 8px; }
  .remote-control, .repository-name, .find { display: none; }
  .branch-control { flex: 1; min-width: 0; }
  .ref-select { flex: 1; max-width: none; }
  .header, .row {
    grid-template-columns: var(--wgg-graph-width) minmax(0, 1fr) var(--wgg-commit-width);
  }
  .spacer {
    min-width: max(100%, calc(var(--wgg-graph-width) + 160px + var(--wgg-commit-width)));
  }
  .col-date, .col-author, .date, .author { display: none; }
  .inline-details { flex-direction: column; padding-left: 12px; }
  .details-files { border-left: 0; border-top: 1px solid var(--wgg-line); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.001ms !important; animation-duration: 0.001ms !important; }
}
`;function A(e){return e.kind==="working-tree"?{kind:"working-tree"}:e.kind==="stash"?{kind:"stash",oid:e.oid}:{kind:"commit",oid:e.oid}}function D(e){return e.startsWith("__")?e.replaceAll("_",""):e.slice(0,8)}function H(e){return e.replace(/^refs\/(heads|tags|remotes)\//,"")}var ie=[["year",31536e6],["month",2592e6],["week",6048e5],["day",864e5],["hour",36e5],["minute",6e4]];function T(e){return String(e).padStart(2,"0")}function K(e,t="datetime"){if(!e)return"\u2014";let i=new Date(e);if(Number.isNaN(i.valueOf()))return e;if(t==="relative"){let r=i.valueOf()-Date.now(),n=new Intl.RelativeTimeFormat(void 0,{numeric:"auto"});for(let[s,a]of ie)if(Math.abs(r)>=a)return n.format(Math.round(r/a),s);return n.format(Math.round(r/1e3),"second")}let o=`${i.getFullYear()}/${T(i.getMonth()+1)}/${T(i.getDate())}`;return t==="date"?o:`${o} ${T(i.getHours())}:${T(i.getMinutes())}`}var z=new Map,P=new Set;function oe(e){let t=0;for(let i=0;i<e.length;i+=1)t=(t*31+e.charCodeAt(i))%360;return`hsl(${t} 44% 40%)`}async function re(e){if(typeof crypto>"u"||!crypto.subtle)return;let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return`https://www.gravatar.com/avatar/${[...new Uint8Array(t)].map(o=>o.toString(16).padStart(2,"0")).join("")}?s=48&d=404`}function se(e){let t={dirs:new Map,files:[]};for(let i of e){let o=i.path.split("/"),r=t;for(let n of o.slice(0,-1)){let s=r.dirs.get(n);s||(s={dirs:new Map,files:[]},r.dirs.set(n,s)),r=s}r.files.push(i)}return t}function I(e){return e.split("/").pop()??e}function N(e){let t=document.createElement("div");return t.className="pending details-pending",t.setAttribute("aria-hidden","true"),t.innerHTML=e.map(i=>`<span class="pending-bar" style="width:${i}%"></span>`).join(""),t}function F(e,t){let i=document.createElementNS("http://www.w3.org/2000/svg",e);for(let[o,r]of Object.entries(t))i.setAttribute(o,r);return i}var ne=typeof HTMLElement>"u"?class{}:HTMLElement,V=class extends ne{static observedAttributes=["theme","density","columns","date-format","date-type","avatars"];#r;#e={commits:[],refs:[],hasMore:!1};#x=j([]);#y="";#d=[];#g=-1;#h=[];#N;#q;#R;#C;#i;#p;#n;#u;#a;#m=new Set;#$;#k;#f=!1;#B=!1;#E=!1;#S;#D;#s=24;#G=8;#H=240;#L=!0;#t;addEventListener(e,t,i){super.addEventListener(e,t,i)}removeEventListener(e,t,i){super.removeEventListener(e,t,i)}ongitgraphcommitsselect=null;ongitgraphcommitsopen=null;ongitgraphcompare=null;ongitgraphfileopen=null;ongitgraphloadmore=null;ongitgrapherror=null;ongitgraphrefresh=null;ongitgraphcontextmenu=null;constructor(){super(),this.#t=this.attachShadow({mode:"open"}),this.#t.innerHTML=`<style>${te}</style><div class="shell"></div>`}connectedCallback(){this.#_(),this.#r&&this.#e.commits.length===0&&this.#b(!1)}disconnectedCallback(){this.#l()}attributeChangedCallback(){this.#s=this.getAttribute("density")==="compact"?20:24,this.#j(),this.#Y(),this.#o()}get provider(){return this.#r}set provider(e){this.#r=e,e&&(this.#h=[],this.#e={...this.#e,repositoryId:void 0,repositoryName:void 0,cursor:void 0,hasMore:!1},this.isConnected&&this.#b(!1))}get data(){return this.#e}set data(e){this.setData(e)}get theme(){return this.getAttribute("theme")??"dark"}set theme(e){this.setAttribute("theme",e)}get density(){return this.getAttribute("density")??"comfortable"}set density(e){this.setAttribute("density",e)}get columns(){return this.getAttribute("columns")??"date,author,commit"}set columns(e){this.setAttribute("columns",e)}get dateFormat(){let e=this.getAttribute("date-format");return e==="date"||e==="relative"?e:"datetime"}set dateFormat(e){this.setAttribute("date-format",e)}get dateType(){return this.getAttribute("date-type")==="authored"?"authored":"committed"}set dateType(e){this.setAttribute("date-type",e)}get avatars(){let e=this.getAttribute("avatars");return e!==null&&e!=="false"&&e!=="off"}set avatars(e){e?this.setAttribute("avatars",""):this.removeAttribute("avatars")}get refs(){return this.#h}set refs(e){this.#z([...e])}refresh(){let e=new CustomEvent("gitgraph-refresh",{bubbles:!0,composed:!0,cancelable:!0,detail:{repositoryId:this.#e.repositoryId}});this.dispatchEvent(e)&&this.#r&&this.#b(!1,!0)}setData(e){this.#e={...e,commits:[...e.commits],refs:[...e.refs]},this.#i=void 0,this.#p=void 0,this.#n=void 0,this.#f=!1,this.#u=void 0,this.#S=void 0,this.#m.clear(),this.#W(),this.#t.querySelector(".scroller")?.scrollTo({top:0})}appendPage(e){let t=this.#t.querySelector(".scroller")?.scrollTop??0,i=new Set(this.#e.commits.map(o=>o.oid));this.#e={...this.#e,...e,commits:[...this.#e.commits,...e.commits.filter(o=>!i.has(o.oid))],refs:this.#re(this.#e.refs,e.refs)},this.#W(),queueMicrotask(()=>{let o=this.#t.querySelector(".scroller");o&&(o.scrollTop=t,this.#o())})}selectCommit(e){let t=this.#e.commits.find(i=>i.oid===e);t&&(this.#i=e,this.#p=void 0,this.#u=void 0,this.#a=void 0,this.#m.clear(),this.dispatchEvent(new CustomEvent("gitgraph-commit-select",{bubbles:!0,composed:!0,detail:{commit:t}})),this.#Q(t),this.#o(),this.#c(),queueMicrotask(()=>this.#pe(t.oid)))}async compareCommits(e,t){let i=this.#e.commits.find(r=>r.oid===e),o=this.#e.commits.find(r=>r.oid===t);if(!(!i||!o||!this.#r?.compare)){this.#i=e,this.#p=t,this.#a=void 0,this.#u=void 0,this.#f=!0,this.#m.clear(),this.#o(),this.#c();try{this.#u=await this.#r.compare(this.#e.repositoryId,A(i),A(o)),this.dispatchEvent(new CustomEvent("gitgraph-compare",{bubbles:!0,composed:!0,detail:this.#u}))}catch(r){this.#T(r)}this.#c()}}focusCommit(e){let t=this.#e.commits.findIndex(o=>o.oid===e);if(t<0)return;this.#t.querySelector(".scroller")?.scrollTo({top:this.#v(t,this.#A()),behavior:"smooth"}),queueMicrotask(()=>{this.#t.querySelector(`.row[data-oid="${CSS.escape(e)}"]`)?.focus()})}#re(e,t){let i=new Map(e.map(o=>[`${o.kind}:${o.name}`,o]));for(let o of t)i.set(`${o.kind}:${o.name}`,o);return[...i.values()]}#W(){this.#x=j(this.#e.commits),this.#I(!1),this.#_(),this.#j(),this.#M(),this.#Y(),this.#o()}#_(){let e=this.#t.querySelector(".shell");if(!e||e.querySelector(".toolbar"))return;e.innerHTML=`
      <div class="toolbar">
        <div class="branch-control">
          <strong>Branches:</strong>
          <button class="ref-select" type="button" aria-haspopup="menu" aria-expanded="false"
            aria-label="Select branches and tags">
            <span class="ref-select-label">Show All</span><span class="caret">\u25BE</span>
          </button>
        </div>
        <label class="remote-control">
          <input class="remote-toggle" type="checkbox" checked>
          <span>Show Remote Branches</span>
        </label>
        <span class="repository-name"></span>
        <div class="tools">
          <div class="find">
            <input class="search" type="search" placeholder="Find commits\u2026" aria-label="Search commits">
            <span class="search-count" hidden></span>
            <button class="icon-button search-prev" type="button" aria-label="Previous match" disabled>\u2191</button>
            <button class="icon-button search-next" type="button" aria-label="Next match" disabled>\u2193</button>
          </div>
          <button class="icon-button refresh" type="button" aria-label="Refresh" title="Refresh">\u21BB</button>
          <button class="icon-button theme-toggle" type="button" aria-label="Toggle theme">\u25D0</button>
        </div>
      </div>
      <div class="body">
        <section class="history">
          <div class="header" aria-hidden="true">
            <span class="col-graph">Graph</span><span class="col-description">Description</span
            ><span class="col-date">Date</span><span class="col-author">Author</span
            ><span class="col-commit">Commit</span>
          </div>
          <div class="scroller" role="treegrid" aria-label="Git commit history" tabindex="0">
            <div class="spacer"><div class="window"></div></div>
          </div>
        </section>
      </div>`;let t=e.querySelector(".search");t.value=this.#y,t.addEventListener("input",()=>{this.#y=t.value,this.#I(!0),this.#M(),this.#o(),this.#X()}),t.addEventListener("keydown",n=>{n.key==="Enter"?(n.preventDefault(),this.#F(n.shiftKey?-1:1)):n.key==="Escape"&&t.value&&(n.stopPropagation(),t.value="",this.#y="",this.#I(!0),this.#M(),this.#o())}),e.querySelector(".search-prev")?.addEventListener("click",()=>this.#F(-1)),e.querySelector(".search-next")?.addEventListener("click",()=>this.#F(1)),e.querySelector(".refresh")?.addEventListener("click",()=>this.refresh()),e.querySelector(".theme-toggle")?.addEventListener("click",()=>{this.theme=this.theme==="light"?"dark":"light"});let i=e.querySelector(".remote-toggle");i.checked=this.#L,i.addEventListener("change",()=>{this.#L=i.checked,this.#l(),this.#o()});let o=e.querySelector(".ref-select");o.addEventListener("click",()=>{this.#N?.dataset.menu==="refs"?this.#l():this.#se(o)});let r=e.querySelector(".scroller");r.addEventListener("scroll",()=>{this.#o(),this.#e.hasMore&&!this.#E&&r.scrollTop+r.clientHeight>r.scrollHeight-this.#s*4&&this.#b(!0)}),r.addEventListener("keydown",n=>this.#he(n)),this.#o()}#M(){let e=this.#t.querySelector(".shell");if(!e||!e.querySelector(".toolbar"))return;e.querySelector(".repository-name").textContent=this.#e.repositoryName??this.#e.repositoryId??"data provider";let t=this.#h;e.querySelector(".ref-select-label").textContent=t.length===0?"Show All":t.length===1?H(t[0]):`${t.length} selected`,this.#J()}#j(){let e=this.#t.querySelector(".shell");if(!e)return;let t=this.getAttribute("columns"),i=t===null?void 0:new Set(t.split(",").map(o=>o.trim().toLowerCase()).filter(Boolean));for(let o of["date","author","commit"])e.toggleAttribute(`data-hide-${o}`,i!==void 0&&!i.has(o))}#U(e,t){this.#l();let i=this.#t.querySelector(".shell"),o=document.createElement("div");o.className="menu",o.dataset.menu=e,o.setAttribute("role","menu"),i.append(o),this.#N=o;let r=m=>{let c=m.composedPath();!c.includes(o)&&!(t&&c.includes(t))&&this.#l()},n=m=>{m.key==="Escape"&&(m.stopPropagation(),this.#l())},s=()=>this.#l(),a=this.#t.querySelector(".scroller");return document.addEventListener("pointerdown",r,!0),document.addEventListener("keydown",n,!0),a?.addEventListener("scroll",s),window.addEventListener("resize",s),this.#q=()=>{document.removeEventListener("pointerdown",r,!0),document.removeEventListener("keydown",n,!0),a?.removeEventListener("scroll",s),window.removeEventListener("resize",s),o.remove()},t?.setAttribute("aria-expanded","true"),o}#l(){let e=this.#q;this.#N=void 0,this.#q=void 0,this.#R=void 0,this.#C=void 0,e?.(),this.#K(),this.#t.querySelector(".ref-select")?.setAttribute("aria-expanded","false")}#K(){for(let e of this.#t.querySelectorAll(".row"))e.classList.toggle("context-active",e.dataset.oid===this.#C)}#V(e,t,i){e.style.left="0px",e.style.top="0px";let o=this.getBoundingClientRect(),r=e.getBoundingClientRect();e.style.left=`${Math.min(Math.max(4,t),Math.max(4,o.width-r.width-4))}px`,e.style.top=`${Math.min(Math.max(4,i),Math.max(4,o.height-r.height-4))}px`}#w(e,t){let i=document.createElement("button");if(i.className="menu-item",i.type="button",i.setAttribute("role","menuitem"),i.disabled=t.enabled===!1,t.checked!==void 0){let r=document.createElement("span");r.className="menu-check",r.textContent=t.checked?"\u2713":"",i.append(r)}let o=document.createElement("span");return o.className="menu-label",o.textContent=e,i.append(o),i.addEventListener("click",t.onSelect),i}#se(e){let t=this.#U("refs",e),i=[["Local Branches","head"],["Remote Branches","remote"],["Tags","tag"]],o=new Map,r=()=>new Set(this.#h),n=this.#w("Show All",{checked:this.#h.length===0,onSelect:()=>this.#z([])});t.append(n);let s=document.createElement("div");s.className="menu-scroll";let a=0;for(let[h,g]of i){let v=this.#e.refs.filter(d=>d.kind===g&&(g!=="remote"||this.#L));if(v.length===0)continue;let b=document.createElement("div");b.className="menu-group",b.textContent=h,s.append(b);for(let d of v){let x=this.#w(H(d.name),{checked:this.#h.includes(d.name),onSelect:()=>this.#ne(d.name)});o.set(d.name,x.querySelector(".menu-check")),s.append(x),a+=1}}a>0&&t.append(Object.assign(document.createElement("div"),{className:"menu-separator"}),s),this.#R=()=>{let h=r();n.querySelector(".menu-check").textContent=h.size===0?"\u2713":"";for(let[g,v]of o)v.textContent=h.has(g)?"\u2713":""};let m=e.getBoundingClientRect(),c=this.getBoundingClientRect();this.#V(t,m.left-c.left,m.bottom-c.top+2)}#ne(e){let t=new Set(this.#h);t.has(e)?t.delete(e):t.add(e),this.#z([...t])}#z(e){this.#h=e,this.#M(),this.#R?.(),this.#r&&this.#b(!1)}#ae(e,t,i){if(!this.dispatchEvent(new CustomEvent("gitgraph-context-menu",{bubbles:!0,composed:!0,cancelable:!0,detail:{commit:e,clientX:t,clientY:i}})))return;let r=this.#U("commit");this.#C=e.oid,this.#K();let n=e.message.split(`
`,1)[0]??"";if(r.append(this.#w("Copy Commit Hash",{enabled:e.kind!=="working-tree",onSelect:()=>{this.#l(),this.#P(e.oid)}}),this.#w("Copy Commit Subject",{enabled:n.length>0,onSelect:()=>{this.#l(),this.#P(n)}}),this.#w("Compare with Selected Commit",{enabled:!!(this.#i&&this.#i!==e.oid&&this.#r?.compare),onSelect:()=>{let a=this.#i;this.#l(),a&&this.compareCommits(a,e.oid)}})),e.url){let a=e.url;r.append(this.#w("Open in Remote \u2197",{onSelect:()=>{this.#l(),window.open(a,"_blank","noopener,noreferrer")}}))}let s=this.getBoundingClientRect();this.#V(r,t-s.left,i-s.top)}async#P(e){try{await navigator.clipboard.writeText(e)}catch{let t=document.createElement("textarea");t.value=e,t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.opacity="0",document.body.append(t),t.select(),document.execCommand("copy"),t.remove()}}#le(e){let t=e.author?.email?.trim().toLowerCase()??"",i=document.createElement("span");i.className="avatar",i.setAttribute("aria-hidden","true");let o=document.createElement("span");o.textContent=(e.author?.name??"?").trim().slice(0,1).toUpperCase()||"?",i.append(o),t&&i.style.setProperty("--avatar-color",oe(t));let r=e.author?.avatarUrl??(t?z.get(t):void 0);if(r){let n=document.createElement("img");n.src=r,n.alt="",n.loading="lazy",n.decoding="async",n.addEventListener("error",()=>n.remove()),i.append(n)}return i}async#Y(){if(!this.avatars)return;let e=new Set;for(let t of this.#e.commits){let i=t.author?.email?.trim().toLowerCase();i&&!t.author?.avatarUrl&&!z.has(i)&&!P.has(i)&&e.add(i)}if(e.size!==0){for(let t of e)P.add(t);await Promise.all([...e].map(async t=>{let i=await re(t).catch(()=>{});i&&z.set(t,i),P.delete(t)})),this.#o()}}#I(e){let t=this.#y.trim().toLocaleLowerCase();if(!t){this.#d=[],this.#g=-1;return}let i=[];this.#e.commits.forEach((o,r)=>{let n=`${o.author?.name??""} ${o.author?.email??""}`;`${o.oid} ${o.message} ${n}`.toLocaleLowerCase().includes(t)&&i.push(r)}),this.#d=i,this.#g=i.length===0?-1:e?0:Math.min(Math.max(this.#g,0),i.length-1)}#J(){let e=this.#t.querySelector(".search-count");if(!e)return;let t=this.#y.trim().length>0;e.hidden=!t,e.textContent=t?`${this.#g+1}/${this.#d.length}`:"";let i=this.#d.length===0;this.#t.querySelector(".search-prev").disabled=i,this.#t.querySelector(".search-next").disabled=i}#F(e){this.#d.length!==0&&(this.#g=(this.#g+e+this.#d.length)%this.#d.length,this.#J(),this.#o(),this.#X())}#X(){let e=this.#d[this.#g];if(e===void 0)return;let t=this.#t.querySelector(".scroller");if(!t)return;let i=this.#v(e,this.#A());(i<t.scrollTop||i+this.#s>t.scrollTop+t.clientHeight)&&t.scrollTo({top:Math.max(0,i-t.clientHeight/2)})}#o(){let e=this.#t.querySelector(".scroller"),t=this.#t.querySelector(".spacer"),i=this.#t.querySelector(".window");if(!e||!t||!i)return;if(this.#e.commits.length===0&&(this.#$=void 0,this.#k=void 0),this.#B&&this.#e.commits.length===0){t.style.height="100%",i.innerHTML=`
        <div class="loading-view">
          <div class="pending pending-rows" aria-hidden="true">${ee.map(l=>`<div class="pending-row"><span class="pending-dot"></span><span class="pending-bar" style="width:${l}%"></span></div>`).join("")}</div>
          <p class="pending-label"><slot name="loading">Reading the commit DAG\u2026</slot></p>
        </div>`;return}if(this.#S&&this.#e.commits.length===0){t.style.height="100%",i.innerHTML='<div class="error"><slot name="error"></slot></div>';let l=i.querySelector("slot");l&&(l.textContent=this.#S);return}if(this.#e.commits.length===0){t.style.height="100%",i.innerHTML='<div class="empty"><slot name="empty">No commits match this view.</slot></div>';return}let o=Math.max(56,this.#x.laneCount*16+24);this.#t.querySelector(".shell")?.style.setProperty("--wgg-graph-width",`${o}px`);let r=this.#A(),n=r>=0?this.#H:0,s=(r+1)*this.#s,a=this.#e.commits.length*this.#s+n;t.style.height=`${a+(this.#e.hasMore?42:0)}px`;let m=Math.ceil(Math.max(e.clientHeight,420)/this.#s),c=l=>r<0||l<s?Math.floor(l/this.#s):l<s+n?r:Math.floor((l-n)/this.#s),h=Math.max(0,c(e.scrollTop)-this.#G),g=Math.min(this.#e.commits.length,Math.max(h+m,c(e.scrollTop+e.clientHeight)+1)+this.#G);i.style.transform="";let v=this.#$;for(let l of[...i.children])l!==v&&l.remove();let b=this.#v(h,r),d=Math.max(this.#s,this.#v(g,r)-b),x=F("svg",{class:"graph",width:`${o}`,height:`${d}`,"aria-hidden":"true"});x.style.top=`${b}px`,this.#ce(x,h,g,r),i.append(x);let k=new Map;for(let l of this.#e.refs){if(!this.#L&&l.kind==="remote")continue;let p=k.get(l.target)??[];p.push(l),k.set(l.target,p)}let u=new Map(this.#x.nodes.map(l=>[l.oid,l])),y=new Set(this.#d),E=this.#g>=0?this.#d[this.#g]:-1,$=this.avatars,q=this.dateFormat;for(let l=h;l<g;l+=1){let p=this.#e.commits[l],f=document.createElement("div");f.className="row",f.classList.toggle("merge",p.parents.length>1),f.classList.toggle("working-tree",p.kind==="working-tree"),f.classList.toggle("match",y.has(l)),f.classList.toggle("match-current",l===E),f.classList.toggle("context-active",p.oid===this.#C),p.oid===this.#i&&f.classList.add("selected"),p.oid===this.#p&&f.classList.add("compare"),f.dataset.oid=p.oid,f.dataset.index=String(l),f.setAttribute("role","row"),f.tabIndex=p.oid===this.#i||!this.#i&&l===0?0:-1,f.style.top=`${this.#v(l,r)}px`,f.innerHTML=`
        <div class="graph-cell" role="gridcell"></div>
        <div class="subject" role="gridcell"><div class="refs"></div><span class="message"></span></div>
        <div class="date" role="gridcell"></div>
        <div class="author" role="gridcell"></div>
        <div class="oid" role="gridcell"></div>`,f.querySelector(".message").textContent=p.message.split(`
`,1)[0]??"";let O=f.querySelector(".author");$&&p.kind!=="working-tree"&&O.append(this.#le(p));let R=document.createElement("span");R.className="author-name",R.textContent=p.author?.name??"\u2014",O.append(R),f.querySelector(".date").textContent=K(this.#ie(p),q),f.querySelector(".oid").textContent=D(p.oid);let J=f.querySelector(".refs"),B=new Set;for(let w of k.get(p.oid)??[]){let L=H(w.name),G=w.kind==="current"||w.kind==="head"?`branch:${L}`:`${w.kind}:${L}`;if(B.has(G))continue;B.add(G);let C=document.createElement("span");C.className=`ref ${w.kind}`;let X=w.kind==="tag"?"\u25C7":w.kind==="stash"?"\u224B":w.kind==="remote"?"\u2197":"\u2442";C.textContent=`${X} ${L}`,C.title=L;let W=u.get(p.oid);if(W&&Z.has(w.kind)&&C.style.setProperty("--ref-color",S[W.colour%S.length]),J.append(C),B.size>=4)break}f.addEventListener("click",w=>{w.button!==0||U&&w.ctrlKey||((w.metaKey||w.ctrlKey)&&this.#i&&this.#i!==p.oid?this.compareCommits(this.#i,p.oid):p.oid===this.#i&&!this.#p?this.#O():this.selectCommit(p.oid))}),f.addEventListener("mousedown",w=>{w.button===2&&w.preventDefault()}),f.addEventListener("contextmenu",w=>{w.preventDefault(),w.stopPropagation(),this.#ae(p,w.clientX,w.clientY)}),f.addEventListener("dblclick",()=>{p.url&&window.open(p.url,"_blank","noopener,noreferrer"),this.dispatchEvent(new CustomEvent("gitgraph-commit-open",{bubbles:!0,composed:!0,detail:{commit:p}}))}),i.append(f)}if(r>=0){let l=v??document.createElement("aside");l.className="inline-details",l.setAttribute("aria-label",this.#p?"Commit comparison":"Commit details"),l.style.top=`${s}px`,l.style.height=`${n}px`,l.parentNode!==i&&i.append(l),this.#$=l}else v?.remove(),this.#$=void 0,this.#k=void 0;if(this.#e.hasMore&&g===this.#e.commits.length){let l=document.createElement("button");l.className="action load-more",l.type="button",l.style.top=`${a}px`,l.textContent=this.#E?"Loading\u2026":"Load more commits",l.disabled=this.#E,l.addEventListener("click",()=>{let p=new CustomEvent("gitgraph-load-more",{bubbles:!0,composed:!0,cancelable:!0,detail:{cursor:this.#e.cursor}});this.dispatchEvent(p)&&this.#r&&this.#b(!0)}),i.append(l)}this.#c()}#ce(e,t,i,o){let r=s=>16+s*16,n=s=>this.#v(s,o)-this.#v(t,o)+this.#s*.5;for(let s of this.#x.segments){if(s.to.row<t||s.from.row>=i)continue;let a=Math.max(t,s.from.row),m=Math.min(i,s.to.row),c=r(s.from.lane),h=r(s.to.lane),g=n(a),v=n(m),b=s.anchor==="from";e.append(F("path",{d:this.#de(c,h,g,v,b),stroke:S[s.colour%S.length],...s.dangling?{"stroke-dasharray":"3 4"}:{}}))}for(let s of this.#x.nodes){if(s.row<t||s.row>=i)continue;let a=s.kind==="working-tree"?"var(--wgg-faint)":S[s.colour%S.length];e.append(F("circle",{cx:`${r(s.lane)}`,cy:`${n(s.row)}`,r:s.kind==="working-tree"?"4.5":s.kind==="stash"?"4":"3.5",fill:s.oid===this.#e.head||s.kind==="working-tree"?"var(--wgg-bg)":a,stroke:a}))}}#de(e,t,i,o,r){if(e===t)return`M ${e} ${i} L ${t} ${o}`;let n=this.#s*.55;if(o-i<=this.#s)return`M ${e} ${i} C ${e} ${i+n}, ${t} ${o-n}, ${t} ${o}`;if(r){let a=i+this.#s;return`M ${e} ${i} C ${e} ${i+n}, ${t} ${a-n}, ${t} ${a} L ${t} ${o}`}let s=o-this.#s;return`M ${e} ${i} L ${e} ${s} C ${e} ${s+n}, ${t} ${o-n}, ${t} ${o}`}#he(e){let t=[...this.#t.querySelectorAll(".row")],i=this.#t.activeElement,o=t.indexOf(i),r=o;if(e.key==="ArrowDown")r=Math.min(t.length-1,Math.max(0,o+1));else if(e.key==="ArrowUp")r=Math.max(0,o-1);else if(e.key==="Home")r=0;else if(e.key==="End")r=t.length-1;else if(e.key==="Enter"&&i?.dataset.oid){this.selectCommit(i.dataset.oid);return}else if(e.key==="Escape"){this.#O();return}else return;e.preventDefault(),t[r]?.focus()}async#Q(e){if(!this.#r?.getCommitDetails){this.#f=!1,this.#n={commit:e,refs:this.#e.refs.filter(i=>i.target===e.oid),changes:[]},this.#c();return}this.#n?.commit.oid===e.oid||(this.#n=void 0,this.#f=!0,this.#c());try{let i=await this.#r.getCommitDetails(this.#e.repositoryId,A(e));if(this.#i!==e.oid)return;this.#n=i}catch(i){if(this.#i!==e.oid)return;this.#T(i)}this.#f=!1,this.#c()}#c(e=!1){let t=e||this.#f,i=this.#t.querySelector(".inline-details");if(!i||!this.#i)return;let o=JSON.stringify([this.#i,this.#p,t,this.#n?.commit.oid,this.#n?.changes.length,!!this.#u,this.#a?.path,this.#a?.patch?.length,[...this.#m].sort()]);if(o===this.#k&&i.firstChild)return;this.#k=o,i.innerHTML=`
      <button class="details-close" type="button" aria-label="Close details">\xD7</button>
      <div class="details-summary"></div>
      <div class="details-files"></div>`,i.querySelector(".details-close")?.addEventListener("click",()=>this.#O());let r=i.querySelector(".details-summary"),n=i.querySelector(".details-files");if(this.#p){if(t||!this.#u){r.innerHTML='<p class="pending-label">Calculating tree difference\u2026</p>',r.append(N(M.slice(0,3))),n.append(N(M));return}this.#ge(r,n,this.#u);return}let s=this.#n?.commit??this.#e.commits.find(d=>d.oid===this.#i);if(!s){r.innerHTML='<p class="pending-label">Reading commit object\u2026</p>',r.append(N(M.slice(0,3)));return}let a=document.createElement("dl");a.className="meta";let m=[["Commit",s.kind==="working-tree"?"uncommitted changes":s.oid,!0],["Parents",s.parents.map(D).join(", ")||"root commit",!0],["Author",`${s.author?.name??"Unknown"}${s.author?.email?` <${s.author.email}>`:""}`],["Date",K(this.#ie(s))]];for(let[d,x,k]of m){let u=document.createElement("dt"),y=document.createElement("dd");u.textContent=d,y.textContent=x,k&&(y.className="oid-value"),a.append(u,y)}r.append(a);let c=document.createElement("p");c.className="commit-body",c.textContent=(this.#n?.body??s.message).trim(),r.append(c);let h=document.createElement("div");if(h.className="actions",h.innerHTML='<button class="action primary copy" type="button">Copy SHA</button>',h.querySelector(".copy")?.addEventListener("click",()=>void this.#P(s.oid)),this.#r?.compare){let d=document.createElement("button");d.className="action compare-action",d.type="button",d.textContent="Compare with\u2026",d.addEventListener("click",()=>{d.textContent=U?"Cmd-click another commit":"Ctrl-click another commit",d.disabled=!0,this.#t.querySelector(".scroller")?.focus()}),h.append(d)}if(s.url){let d=document.createElement("button");d.className="action",d.textContent="Open remote \u2197",d.addEventListener("click",()=>window.open(s.url,"_blank","noopener,noreferrer")),h.append(d)}if(r.append(h),t){n.append(N(M));return}let g=this.#n?.changes??[],v=s.parents[0],b=v&&this.#r?.getFileDiff?{base:{kind:"commit",oid:v},head:A(s)}:void 0;if(this.#a)r.append(this.#Z());else if(b&&g.length>0){let d=document.createElement("p");d.className="no-changes",d.textContent="Select a file to view its diff.",r.append(d)}this.#ee(n,g,b)}#Z(){let e=document.createElement("pre");return e.className="patch",e.textContent=this.#a?.patch??this.#a?.unavailableReason??(this.#a?.binary?"Binary file \u2014 patch unavailable.":"No textual patch."),e}#ge(e,t,i){let o=document.createElement("h2");o.className="details-heading",o.textContent=`${this.#oe(i.base)} \u2192 ${this.#oe(i.head)}`,e.append(o);let r=document.createElement("p");if(r.className="stats",r.textContent=`${i.changes.length} files \xB7 +${i.additions} \u2212${i.deletions}${i.truncated?" \xB7 truncated":""}`,e.append(r),this.#a)e.append(this.#Z());else if(i.changes.length>0){let n=document.createElement("p");n.className="no-changes",n.textContent="Select a file to view its diff.",e.append(n)}this.#ee(t,i.changes,{base:i.base,head:i.head,comparison:i})}#ee(e,t,i){if(t.length===0){e.innerHTML='<p class="no-changes">No file changes.</p>';return}let o=document.createElement("ul");o.className="tree",this.#te(o,se(t),"",i),e.append(o)}#te(e,t,i,o){for(let[r,n]of[...t.dirs.entries()].sort((s,a)=>s[0].localeCompare(a[0]))){for(;n.files.length===0&&n.dirs.size===1;){let[v]=n.dirs;r=`${r}/${v[0]}`,n=v[1]}let s=i?`${i}/${r}`:r,a=this.#m.has(s),m=document.createElement("li"),c=document.createElement("button");c.className="tree-dir",c.type="button",c.setAttribute("aria-expanded",String(!a));let h=document.createElement("span");h.className="twistie",h.textContent=a?"\u25B8":"\u25BE";let g=document.createElement("span");if(g.className="dir-name",g.textContent=r,c.append(h,g),c.addEventListener("click",()=>{a?this.#m.delete(s):this.#m.add(s),this.#c()}),m.append(c),!a){let v=document.createElement("ul");this.#te(v,n,s,o),m.append(v)}e.append(m)}for(let r of[...t.files].sort((n,s)=>n.path.localeCompare(s.path))){let n=document.createElement("li"),s=document.createElement("button");s.className="tree-file",s.type="button",this.#a?.path===r.path&&s.classList.add("active"),s.title=r.previousPath?`${r.previousPath} \u2192 ${r.path}`:r.path;let a=document.createElement("span");a.className=`change-code ${r.kind}`,a.textContent=r.kind.slice(0,1).toUpperCase();let m=document.createElement("span");m.className="change-path",m.textContent=r.previousPath?`${I(r.previousPath)} \u2192 ${I(r.path)}`:I(r.path);let c=document.createElement("span");c.className="stats",c.textContent=r.binary?"binary":`${r.additions===void 0?"":`+${r.additions}`} ${r.deletions===void 0?"":`\u2212${r.deletions}`}`.trim(),s.append(a,m,c),s.addEventListener("click",async()=>{if(!(!this.dispatchEvent(new CustomEvent("gitgraph-file-open",{bubbles:!0,composed:!0,cancelable:!0,detail:{change:r,base:o?.base,head:o?.head,comparison:o?.comparison}}))||!o||!this.#r?.getFileDiff)){if(r.unavailableReason){this.#a={base:o.base,head:o.head,path:r.path,unavailableReason:r.unavailableReason},this.#c();return}try{this.#a=await this.#r.getFileDiff(this.#e.repositoryId,o.base,o.head,r.path,3)}catch(g){this.#T(g)}this.#c()}}),n.append(s),e.append(n)}}#ie(e){return this.dateType==="authored"?e.authoredAt??e.committedAt:e.committedAt??e.authoredAt}#oe(e){return e.kind==="working-tree"?"working tree":D(e.oid)}#O(){this.#i=void 0,this.#p=void 0,this.#n=void 0,this.#f=!1,this.#u=void 0,this.#a=void 0,this.#m.clear(),this.#k=void 0,this.#o(),this.#c()}#A(){return this.#i?this.#e.commits.findIndex(e=>e.oid===this.#i):-1}#v(e,t){return e*this.#s+(t>=0&&e>t?this.#H:0)}#pe(e){if(this.#i!==e)return;let t=this.#A(),i=this.#t.querySelector(".scroller");if(t<0||!i)return;let o=t*this.#s,r=o+this.#s+this.#H,n=i.scrollTop;r>n+i.clientHeight&&(n=r-i.clientHeight),o<n&&(n=o),n!==i.scrollTop&&i.scrollTo({top:n,behavior:"smooth"})}async#b(e,t=!1){if(!this.#r||e&&!this.#e.hasMore)return;this.#D?.abort();let i=new AbortController;this.#D=i;let o=t?{scrollTop:this.#t.querySelector(".scroller")?.scrollTop??0,selectedOid:this.#i,details:this.#n}:void 0;this.#B=!e&&!t,this.#E=e,this.#S=void 0,this.setAttribute("aria-busy","true"),this.#o();try{let r=await this.#r.getHistory({repositoryId:this.#e.repositoryId,refs:this.#h.length?this.#h:void 0,cursor:e?this.#e.cursor:void 0,limit:200,includeWorkingTree:!0,signal:i.signal});e?this.appendPage(r):(this.setData(r),o&&this.#ue(o))}catch(r){if(i.signal.aborted)return;this.#T(r)}finally{this.#B=!1,this.#E=!1,this.#D===i&&this.setAttribute("aria-busy","false"),this.#o()}}#ue(e){let t=e.selectedOid?this.#e.commits.find(o=>o.oid===e.selectedOid):void 0;t&&(this.#i=t.oid,e.details?.commit.oid===t.oid&&(this.#n=e.details),this.#Q(t)),this.#o();let i=this.#t.querySelector(".scroller");i&&e.scrollTop!==i.scrollTop&&(i.scrollTop=e.scrollTop,this.#o())}#T(e){this.#S=e instanceof Error?e.message:String(e),this.dispatchEvent(new CustomEvent("gitgraph-error",{bubbles:!0,composed:!0,detail:{error:e}})),this.#o()}};function Y(e=Q){return typeof customElements<"u"&&!customElements.get(e)&&customElements.define(e,V),V}Y();
