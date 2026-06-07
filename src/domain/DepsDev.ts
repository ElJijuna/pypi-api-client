export interface PyPIDepsDevVersionKey {
  system: string;
  name: string;
  version: string;
}

export interface PyPIDepsDevNode {
  versionKey: PyPIDepsDevVersionKey;
  relation: 'SELF' | 'DIRECT' | 'INDIRECT';
  bundled: boolean;
  errors: string[];
}

export interface PyPIDepsDevEdge {
  fromNode: number;
  toNode: number;
  requirement: string;
}

export interface PyPIDepsDevDependencies {
  nodes: PyPIDepsDevNode[];
  edges: PyPIDepsDevEdge[];
  error?: string;
}
