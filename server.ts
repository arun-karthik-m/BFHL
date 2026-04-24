import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NodeEdge {
  from: string;
  to: string;
}

interface TreeResult {
  root: string;
  nodes: string[];
  depth: number;
  structure: Record<string, string[]>;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // BFHL API Implementation
  app.post("/bfhl", (req, res) => {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ is_success: false, message: "Invalid input format" });
    }

    const validEdges: NodeEdge[] = [];
    const invalidEntries: string[] = [];
    const duplicates: string[] = [];
    const seenEdges = new Set<string>();

    // Step 1: Parsing and Basic Validation
    data.forEach((entry: string) => {
      if (typeof entry !== "string") {
        invalidEntries.push(String(entry));
        return;
      }

      const match = entry.match(/^([A-Z]+)->([A-Z]+)$/);
      if (!match) {
        invalidEntries.push(entry);
        return;
      }

      const [, from, to] = match;
      const edgeKey = `${from}->${to}`;

      if (seenEdges.has(edgeKey)) {
        duplicates.push(entry);
      } else {
        seenEdges.add(edgeKey);
        validEdges.push({ from, to });
      }
    });

    // Step 2: Graph Analysis
    const adj: Record<string, string[]> = {};
    const nodes = new Set<string>();
    const inDegree: Record<string, number> = {};

    validEdges.forEach((edge) => {
      nodes.add(edge.from);
      nodes.add(edge.to);
      if (!adj[edge.from]) adj[edge.from] = [];
      adj[edge.from].push(edge.to);
      inDegree[edge.to] = (inDegree[edge.to] || 0) + 1;
      if (inDegree[edge.from] === undefined) inDegree[edge.from] = 0;
    });

    // Detect Components and Cycles
    const visited = new Set<string>();
    const components: string[][] = [];
    const allNodes = Array.from(nodes);

    allNodes.forEach((node) => {
      if (!visited.has(node)) {
        const component: string[] = [];
        const stack = [node];
        while (stack.length > 0) {
          const curr = stack.pop()!;
          if (!visited.has(curr)) {
            visited.add(curr);
            component.push(curr);
            // Bidirectional traversal to find components
            // This is simplified; for true components we'd need an undirected version
          }
        }
        // Simplified approach: use roots to identify hierarchies
      }
    });

    // Identifying Hierarchies
    const roots = allNodes.filter((node) => (inDegree[node] || 0) === 0);
    const trees: TreeResult[] = [];
    const cycles: { nodes: string[] }[] = [];
    const processedNodes = new Set<string>();

    roots.forEach((root) => {
      const componentNodes = new Set<string>();
      const componentAdj: Record<string, string[]> = {};
      let hasCycle = false;
      let maxDepth = 0;

      const dfs = (node: string, depth: number, path: Set<string>) => {
        componentNodes.add(node);
        processedNodes.add(node);
        maxDepth = Math.max(maxDepth, depth);

        const neighbors = adj[node] || [];
        neighbors.forEach((neighbor) => {
          if (!componentAdj[node]) componentAdj[node] = [];
          componentAdj[node].push(neighbor);

          if (path.has(neighbor)) {
            hasCycle = true;
          } else {
            const nextPath = new Set(path);
            nextPath.add(neighbor);
            dfs(neighbor, depth + 1, nextPath);
          }
        });
      };

      dfs(root, 1, new Set([root]));

      if (!hasCycle) {
        trees.push({
          root,
          nodes: Array.from(componentNodes),
          depth: maxDepth,
          structure: componentAdj,
        });
      } else {
        cycles.push({ nodes: Array.from(componentNodes) });
      }
    });

    // Find cycles in components without roots
    allNodes.forEach(node => {
      if (!processedNodes.has(node)) {
        const componentNodes = new Set<string>();
        const dfs = (curr: string) => {
          componentNodes.add(curr);
          processedNodes.add(curr);
          (adj[curr] || []).forEach(next => {
             if (!processedNodes.has(next)) dfs(next);
          });
        };
        dfs(node);
        cycles.push({ nodes: Array.from(componentNodes) });
      }
    });

    res.json({
      is_success: true,
      trees,
      cycles,
      invalid_entries: invalidEntries,
      duplicates,
      summary: {
        total_trees: trees.length,
        total_cycles: cycles.length,
        largest_tree_root: trees.reduce((prev, curr) => (curr.nodes.length > (prev?.nodes.length || 0) ? curr : prev), null as any)?.root || ""
      }
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
