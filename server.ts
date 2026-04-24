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
      
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalid_entries.push(item);
        continue;
      }
      
      const [, from, to] = match;
      if (from === to) {
        invalid_entries.push(item);
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
      seenEdges.add(edgeKey);
      
      if (childToParent.has(to)) {
        continue;
      }
      
      childToParent.set(to, from);
      validEdges.push({ from, to });
      allValidNodes.add(from);
      allValidNodes.add(to);
    }
    
    // 2. Adjacency List & Roots
    const adj = new Map<string, string[]>();
    for (const node of allValidNodes) adj.set(node, []);
    for (const { from, to } of validEdges) {
      adj.get(from)!.push(to);
    }
    
    const roots: string[] = [];
    for (const node of allValidNodes) {
      if (!childToParent.has(node)) {
        roots.push(node);
      }
    }
    roots.sort();
    
    // 3. Tree Exploration
    const visited = new Set<string>();
    
    function explore(root: string): { tree: any, hasCycle: boolean, depth: number } {
      const tree: any = {};
      let cycle = false;
      let maxPathDepth = 0;
      
      function dfs(node: string, currentPath: Set<string>, currentTree: any, currDepth: number) {
        visited.add(node);
        maxPathDepth = Math.max(maxPathDepth, currDepth);
        currentTree[node] = {};
        
        const children = adj.get(node) || [];
        children.sort();
        
        for (const child of children) {
          if (currentPath.has(child)) {
            cycle = true;
          } else {
            currentPath.add(child);
            dfs(child, currentPath, currentTree[node], currDepth + 1);
            currentPath.delete(child);
          }
        }
      }
      
      dfs(root, new Set([root]), tree, 1);
      return { tree, hasCycle: cycle, depth: maxPathDepth };
    }
    
    for (const root of roots) {
      const res = explore(root);
      if (res.hasCycle) {
        hierarchies.push({ root, tree: {}, has_cycle: true });
      } else {
        hierarchies.push({ root, tree: res.tree, depth: res.depth });
      }
    }
    
    // 4. Pure Cycles
    const unvisitedNodes = Array.from(allValidNodes).filter(n => !visited.has(n));
    if (unvisitedNodes.length > 0) {
      const undirectedAdj = new Map<string, string[]>();
      for (const n of allValidNodes) undirectedAdj.set(n, []);
      for (const { from, to } of validEdges) {
        undirectedAdj.get(from)!.push(to);
        undirectedAdj.get(to)!.push(from);
      }
      
      const compVisited = new Set<string>();
      for (const node of unvisitedNodes) {
        if (!compVisited.has(node)) {
          const compNodes: string[] = [];
          const q = [node];
          compVisited.add(node);
          
          while (q.length > 0) {
            const curr = q.shift()!;
            compNodes.push(curr);
            visited.add(curr);
            
            for (const neighbor of undirectedAdj.get(curr) || []) {
              if (!compVisited.has(neighbor)) {
                compVisited.add(neighbor);
                q.push(neighbor);
              }
            }
          }
          
          compNodes.sort();
          hierarchies.push({ root: compNodes[0], tree: {}, has_cycle: true });
        }
      }
    }
    
    // 5. Summary
    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let maxDepth = -1;
    
    for (const h of hierarchies) {
      if (h.has_cycle) {
        total_cycles++;
      } else {
        total_trees++;
        const currentDepth = h.depth || 0;
        if (currentDepth > maxDepth) {
          maxDepth = currentDepth;
          largest_tree_root = h.root;
        } else if (currentDepth === maxDepth) {
          if (!largest_tree_root || h.root < largest_tree_root) {
            largest_tree_root = h.root;
          }
        }
      }
    }
    
    res.json({
      user_id: "arunkarthik_15082002",
      email_id: "ak4789@srmist.edu.in",
      college_roll_number: "RA2111003011181",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root: largest_tree_root || ""
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
