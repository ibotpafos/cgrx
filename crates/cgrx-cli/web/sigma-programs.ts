import EdgeCurveProgram from '@sigma/edge-curve';
import { createEdgeCompoundProgram } from 'sigma/rendering';
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types';
// Sigma's quadratic program has an undefined normal when both endpoints coincide.
// Two lens halves retain the SAME semantic edge/picking ID; no fake graph nodes.
class LoopLeft extends EdgeCurveProgram {
  process(id: number, offset: number, source: NodeDisplayData, target: NodeDisplayData, edge: EdgeDisplayData): void {
    const curved = { ...edge, curvature: 1.2 };
    super.process(id, offset, source, { ...target, y: target.y + .016 }, curved);
  }
}
class LoopRight extends EdgeCurveProgram {
  process(id: number, offset: number, source: NodeDisplayData, target: NodeDisplayData, edge: EdgeDisplayData): void {
    const curved = { ...edge, curvature: 1.2 };
    super.process(id, offset, { ...source, y: source.y + .016 }, target, curved);
  }
}
export const SelfLoopProgram = createEdgeCompoundProgram([LoopLeft, LoopRight]);
// Per-pair ordinals, not global edge indices: CALLS and IMPLEMENTS must stay pickable.
export function nextCurvature(ordinals: Map<string, number>, source: string, target: string): number {
  const key = JSON.stringify([source, target]); const ordinal = ordinals.get(key) || 0;
  ordinals.set(key, ordinal + 1); return .006 * (ordinal + 1);
}
