// Harness-only accounting of explicit WebGL allocations; no production monkey-patches.
export const gpuResources: Record<string, number> = {};
const tracked = new WeakMap<object, Map<string, Set<object>>>();
for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
  for (const kind of ['Buffer', 'Texture', 'Program', 'Shader', 'Framebuffer', 'Renderbuffer', 'VertexArray']) {
    const p = proto as any, create = p[`create${kind}`], remove = p[`delete${kind}`]; if (!create || !remove) continue;
    gpuResources[kind] = 0;
    p[`create${kind}`] = function(...args: unknown[]) {
      let state = tracked.get(this);
      if (!state) {
        state = new Map(); tracked.set(this, state);
        this.canvas.addEventListener('webglcontextlost', () => {
          for (const [k, objects] of state!) { gpuResources[k] -= objects.size; objects.clear(); }
        });
      }
      const object = create.apply(this, args);
      if (object) { if (!state.has(kind)) state.set(kind, new Set()); state.get(kind)!.add(object); gpuResources[kind]++; }
      return object;
    };
    p[`delete${kind}`] = function(object: object) {
      if (tracked.get(this)?.get(kind)?.delete(object)) gpuResources[kind]--;
      return remove.call(this, object);
    };
  }
}
