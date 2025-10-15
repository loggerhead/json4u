export * from "./pointer";

declare const brandedSymbol: unique symbol;

// We do not use the `TreeNodeId` type. It is defined here only to facilitate understanding
// the meaning of `GraphNodeId`. If an ID is of type string, then it is of type `TreeNodeId`.
// If it is of another ID type, the corresponding specific type will be explicitly used.
export type TreeNodeId = string;

/* For the graph connection a -> b, the nodes in the graph are of iterable types (i.e., object or array). Therefore, for the key or value in a key-value pair, they share the tree node ID corresponding to the key:
 * 1. The graph node ID of node a is `$/a`.
 * 2. The graph node ID of node b is `$/a/b`.
 * 3. The graph edge ID of edge a->b is the same as the graph node ID of the target node, which is `$/a/b`.
 * 4. For the key-value pair in node a (e.g., {"foo": "bar"}), the tree node ID of the key is `$/a/foo`, and the tree node ID of the value is also `$/a/foo`.
 */
export type GraphNodeId = string & { [brandedSymbol]: "graph" };
