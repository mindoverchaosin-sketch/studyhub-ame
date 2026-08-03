import type { GraphNode, GraphEdge, StudentSignal, StudentGraphState, KnowledgeGraphSummary } from '@/types/learning';

export interface IGraphStore {
  upsertNode(node: GraphNode): Promise<void>;
  upsertEdge(edge: GraphEdge): Promise<void>;
  getNode(id: string): Promise<GraphNode | null>;
  listNodes(filter?: Partial<GraphNode>): Promise<GraphNode[]>;
  listEdges(filter?: Partial<GraphEdge>): Promise<GraphEdge[]>;
  recordStudentSignal(studentId: string, nodeId: string, signal: StudentSignal): Promise<void>;
  getStudentGraph(studentId: string): Promise<StudentGraphState>;
  summary(): Promise<KnowledgeGraphSummary>;
}

export const GraphStoreToken = 'GraphStore';
