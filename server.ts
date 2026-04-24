import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Hierarchy {
  root: string;
  tree: Record<string, any>;
  depth?: number;
  has_cycle?: true;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  app.post("/bfhl", (req, res) => {
    const data = Array.isArray(req.body.data) ? req.body.data : [];
    
    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];
    const hierarchies: Hierarchy[] = [];
    
    const childToParent = new Map<string, string>();
    const seenEdges = new Set<string>();
    const reportedDuplicates = new Set<string>();
    
    const validEdges: { from: string, to: string }[] = [];
    const allValidNodes = new Set<string>();
    
    // 1. Validation & Edge Processing
    for (const item of data) {
      if (typeof item !== "string") {
        invalid_entries.push(String(item));
        continue;
      }
      
      const trimmed = item.trim();
      if (!trimmed) {
        invalid_entries.push(item);
        continue;
      }
      
      // Strict Format: Single uppercase letter -> Single uppercase letter
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalid_entries.push(item);
        continue;
      }
      
      const [, from, to] = match;
      if (from === to) {
        invalid_entries.push(item); // Self-loop treated as invalid per spec
        continue;
      }
      
      const edgeKey = `${from}->${to}`;
      if (seenEdges.has(edgeKey)) {
        if (!reportedDuplicates.has(edgeKey)) {
          duplicate_edges.push(item);
          reportedDuplicates.add(edgeKey);
        }
        continue;
      }
      
      // Multi-parent rule: ignore subsequent parents for same child
      if (childToParent.has(to)) {
        // Silently discarded - do not add to duplicates
        continue;
      }
      
      seenEdges.add(edgeKey);
      childToParent.set(to, from);
      validEdges.push({ from, to });
      allValidNodes.add(from);
      allValidNodes.add(to);
    }
    
    // 2. Adjacency List
    const adj = new Map<string, string[]>();
    for (const node of allValidNodes) adj.set(node, []);
    for (const { from, to } of validEdges) {
      adj.get(from)!.push(to);
    }
    
    // 3. Component Grouping (Undirected reachability)
    const undirectedAdj = new Map<string, string[]>();
    for (const node of allValidNodes) undirectedAdj.set(node, []);
    for (const { from, to } of validEdges) {
      undirectedAdj.get(from)!.push(to);
      undirectedAdj.get(to)!.push(from);
    }
    
    const visited = new Set<string>();
    const components: string[][] = [];
    for (const node of Array.from(allValidNodes).sort()) {
      if (!visited.has(node)) {
        const comp: string[] = [];
        const stack = [node];
        visited.add(node);
        while (stack.length > 0) {
          const curr = stack.pop()!;
          comp.push(curr);
          for (const neighbor of undirectedAdj.get(curr) || []) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              stack.push(neighbor);
            }
          }
        }
        components.push(comp.sort());
      }
    }
    
    // 4. Hierarchy Resolution for each component
    for (const comp of components) {
      const compNodes = new Set(comp);
      
      // Find root (node in comp with no parent)
      const rootsInComp = comp.filter(n => !childToParent.has(n));
      let root = "";
      
      if (rootsInComp.length > 0) {
        root = rootsInComp[0]; // connected component with root(s)
      } else {
        root = comp[0]; // pure cycle (lexicographical)
      }
      
      // Tree building & cycle detection
      let hasCycleInComp = false;
      let maxDepth = 0;
      
      function buildTree(node: string, path: Set<string>, depth: number): Record<string, any> {
        if (path.has(node)) {
          hasCycleInComp = true;
          return {};
        }
        path.add(node);
        maxDepth = Math.max(maxDepth, depth);
        
        const tree: Record<string, any> = {};
        const children = (adj.get(node) || []).sort();
        for (const child of children) {
          const childTree = buildTree(child, path, depth + 1);
          tree[child] = childTree;
        }
        
        path.delete(node);
        return tree;
      }
      
      if (rootsInComp.length === 0) {
        // Pure cycle
        hierarchies.push({ root, tree: {}, has_cycle: true });
      } else {
        // We might have multiple roots in the undirected component if we follow Rule 4?
        // Actually, with Rule 4 (1 parent max), undirected component roots 
        // will always lead to unique tree roots in directed graph.
        // Wait, if R1->A, R2->B, A->B is discarded... R2 and R1 are separate? No, undirected component.
        // If rootsInComp contains multiple roots, we only pick the first one and the others will be roots of their own in this loop eventually?
        // No, the loop is per undirected component.
        // If there are multiple nodes with in-degree 0 in an undirected connected component, 
        // they are separate roots for the same component.
        // Actually, in a graph where each node has in-degree <= 1, 
        // each undirected component has EXACTLY one root OR exactly one cycle.
        
        const treeStructure = buildTree(root, new Set(), 1);
        if (hasCycleInComp) {
          hierarchies.push({ root, tree: {}, has_cycle: true });
        } else {
          const finalTree: Record<string, any> = {};
          finalTree[root] = treeStructure;
          hierarchies.push({ root, tree: finalTree, depth: maxDepth });
        }
      }
    }
    
    // Sort hierarchies by root lexicographically
    hierarchies.sort((a, b) => a.root.localeCompare(b.root));
    
    // 5. Summary
    const trees = hierarchies.filter(h => !h.has_cycle);
    const total_trees = trees.length;
    const total_cycles = hierarchies.length - total_trees;
    
    let largest_tree_root = "";
    if (trees.length > 0) {
      let maxD = -1;
      for (const t of trees) {
        if (t.depth! > maxD) {
          maxD = t.depth!;
          largest_tree_root = t.root;
        } else if (t.depth! === maxD) {
          if (t.root < largest_tree_root) {
            largest_tree_root = t.root;
          }
        }
      }
    }
    
    res.json({
      user_id: "john_doe_17091999",
      email_id: "john.doe@college.edu",
      college_roll_number: "21CS1001",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root
      }
    });
  });

  // Vite Integration
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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
