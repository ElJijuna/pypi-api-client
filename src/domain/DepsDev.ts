/** Identifies a specific version of a package in the deps.dev registry. */
export interface PyPIDepsDevVersionKey {
  /** Package ecosystem (always `'PYPI'` for Python packages) */
  system: string;
  /** Package name */
  name: string;
  /** Exact resolved version string */
  version: string;
}

/** A node in the resolved dependency graph returned by deps.dev. */
export interface PyPIDepsDevNode {
  /** Package and version this node represents */
  versionKey: PyPIDepsDevVersionKey;
  /**
   * Position of this package in the dependency tree:
   * - `'SELF'` — the root package itself
   * - `'DIRECT'` — declared in `requires_dist`
   * - `'INDIRECT'` — transitive (pulled in by a direct or indirect dep)
   */
  relation: 'SELF' | 'DIRECT' | 'INDIRECT';
  /** Whether this package is bundled inside another distribution file */
  bundled: boolean;
  /** Resolution errors for this node, if any */
  errors: string[];
}

/** A directed edge in the dependency graph, linking two {@link PyPIDepsDevNode} entries. */
export interface PyPIDepsDevEdge {
  /** Index into `nodes` of the requiring package */
  fromNode: number;
  /** Index into `nodes` of the required package */
  toNode: number;
  /** Version constraint as declared by the requiring package (PEP 508) */
  requirement: string;
}

/**
 * Full response of `GET /systems/pypi/packages/{name}/versions/{version}:dependencies`
 * from the deps.dev API.
 */
export interface PyPIDepsDevDependencies {
  /** All packages in the resolved dependency graph, including the root */
  nodes: PyPIDepsDevNode[];
  /** Directed edges describing which package requires which */
  edges: PyPIDepsDevEdge[];
  /** Top-level resolution error message, if the graph could not be resolved */
  error?: string;
}
