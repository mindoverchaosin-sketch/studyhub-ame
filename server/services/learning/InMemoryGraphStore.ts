import type { IGraphStore } from './GraphStore';
import type { GraphNode, GraphEdge, StudentSignal, StudentGraphState, StudentNodeState, KnowledgeGraphSummary } from '@/types/learning';

export class InMemoryGraphStore implements IGraphStore {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();
  private studentStates = new Map<string, Map<string, StudentNodeState>>();

  async upsertNode(node: GraphNode): Promise<void> {
    this.nodes.set(node.id, node);
  }

  async upsertEdge(edge: GraphEdge): Promise<void> {
    this.edges.set(edge.id, edge);
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.nodes.get(id) ?? null;
  }

  async listNodes(filter?: Partial<GraphNode>): Promise<GraphNode[]> {
    const arr = Array.from(this.nodes.values());
    if (!filter) return arr;
    return arr.filter((n) => {
      return Object.entries(filter).every(([k, v]) => (n as any)[k] === v);
    });
  }

  async listEdges(filter?: Partial<GraphEdge>): Promise<GraphEdge[]> {
    const arr = Array.from(this.edges.values());
    if (!filter) return arr;
    return arr.filter((e) => {
      return Object.entries(filter).every(([k, v]) => (e as any)[k] === v);
    });
  }

  async recordStudentSignal(studentId: string, nodeId: string, signal: StudentSignal): Promise<void> {
    let map = this.studentStates.get(studentId);
    if (!map) {
      map = new Map();
      this.studentStates.set(studentId, map);
    }

    let state = map.get(nodeId);
    if (!state) {
      state = { nodeId, signals: [] } as StudentNodeState;
      map.set(nodeId, state);
    }

    state.signals.push(signal as any);
  }

  async getStudentGraph(studentId: string): Promise<StudentGraphState> {
    const map = this.studentStates.get(studentId) ?? new Map();
    const nodes: Record<string, StudentNodeState> = {};
    for (const [nodeId, state] of map.entries()) {
      nodes[nodeId] = state;
    }
    return { studentId, nodes };
  }

  async summary(): Promise<KnowledgeGraphSummary> {
    return { nodesCount: this.nodes.size, edgesCount: this.edges.size };
  }
}
