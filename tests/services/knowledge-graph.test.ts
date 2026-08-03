import { describe, it, expect } from 'vitest';
import { KnowledgeGraphService } from '@/server/services/learning/knowledge-graph.service';

describe('KnowledgeGraphService', () => {
  it('upserts nodes, edges and records student signals', async () => {
    const svc = new KnowledgeGraphService();

    await svc.upsertNode({ id: 'm1', type: 'module', title: 'Module 1' });
    await svc.upsertNode({ id: 't1', type: 'topic', title: 'Topic 1' });
    await svc.upsertEdge({ id: 'e1', sourceId: 'm1', targetId: 't1', relation: 'parent' });

    const neighbors = await svc.getNeighbors('m1', 'parent');
    expect(neighbors.length).toBe(1);
    expect(neighbors[0].id).toBe('t1');

    await svc.recordStudentSignal('studentA', 't1', { kind: 'viewed', timestamp: Date.now() });
    await svc.recordStudentSignal('studentA', 't1', { kind: 'completed', timestamp: Date.now() });

    const sg = await svc.getStudentGraph('studentA');
    expect(sg.studentId).toBe('studentA');
    expect(Object.keys(sg.nodes)).toContain('t1');
    expect(sg.nodes['t1'].signals.length).toBe(2);
  });
});
