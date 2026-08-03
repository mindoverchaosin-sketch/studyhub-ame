import { InMemoryGraphStore } from './InMemoryGraphStore';
import type { IGraphStore } from './GraphStore';
import type { GraphNode, GraphEdge, StudentSignal, StudentGraphState, KnowledgeGraphSummary } from '@/types/learning';

export class KnowledgeGraphService {
  private store: IGraphStore;

  constructor(store?: IGraphStore) {
    this.store = store ?? new InMemoryGraphStore();
  }

  async upsertNode(node: GraphNode) {
    await this.store.upsertNode(node);
  }

  async upsertEdge(edge: GraphEdge) {
    await this.store.upsertEdge(edge);
  }

  async getNode(id: string) {
    return this.store.getNode(id);
  }

  async listNodes(filter?: Partial<GraphNode>) {
    return this.store.listNodes(filter);
  }

  async listEdges(filter?: Partial<GraphEdge>) {
    return this.store.listEdges(filter);
  }

  async recordStudentSignal(studentId: string, nodeId: string, signal: StudentSignal) {
    await this.store.recordStudentSignal(studentId, nodeId, signal);
  }

  async getStudentGraph(studentId: string): Promise<StudentGraphState> {
    return this.store.getStudentGraph(studentId);
  }

  async summary(): Promise<KnowledgeGraphSummary> {
    return this.store.summary();
  }

  // Utility: get neighbors for a node
  async getNeighbors(nodeId: string, relation?: string) {
    const edges = await this.store.listEdges({ sourceId: nodeId } as any);
    const filtered = relation ? edges.filter((e) => e.relation === relation) : edges;
    const nodes = [] as GraphNode[];
    for (const e of filtered) {
      const n = await this.store.getNode(e.targetId);
      if (n) nodes.push(n);
    }
    return nodes;
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
