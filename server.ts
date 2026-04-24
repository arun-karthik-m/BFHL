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
  has_cycle?: boolean;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  app.post("/bfhl", (req, res) => {
    const data: any[] = Array.isArray(req.body.data) ? req.body.data : [];
    
    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];
    const reported_duplicates = new Set<string>();
    const seen_edges = new Set<string>();
    
    const all_nodes = new Set<string>();
    const child_to_parent = new Map<string, string>();
    const adj = new Map<string, string[]>();
    
    // 1. Process Input and Build Graph
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
      
      // Strict regex for validation: Single [A-Z] -> [A-Z]
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      if (!match) {
        invalid_entries.push(item);
        continue;
      }
      
      const [, from, to] = match;
      if (from === to) { // Self-loop
        invalid_entries.push(item);
        continue;
      }
      
      const edge_str = `${from}->${to}`;
      if (seen_edges.has(edge_str)) {
        if (!reported_duplicates.has(edge_str)) {
          duplicate_edges.push(edge_str);
          reported_duplicates.add(edge_str);
        }
        continue;
      }
      seen_edges.add(edge_str);
      
      // Multi-parent rule: ignore future parents
      if (child_to_parent.has(to)) {
        // Just skip node addition to graph, don't mark as duplicate
        // BUT we should still mark the nodes as existing?
        // Spec says "Build only valid edges". "Ignore ALL future parents".
        // This means the edge is invalid, but the nodes might still be part of the set.
        all_nodes.add(from);
        all_nodes.add(to);
        continue;
      }
      
      // Add to graph
      all_nodes.add(from);
      all_nodes.add(to);
      child_to_parent.set(to, from);
      
      if (!adj.has(from)) adj.set(from, []);
      adj.get(from)!.push(to);
    }
    
    // Ensure all nodes are in adj list even if they have no outgoing edges
    for (const node of all_nodes) {
      if (!adj.has(node)) adj.set(node, []);
    }
    
    // 2. Component Detection (using Undirected Graph)
    const undir_adj = new Map<string, string[]>();
    for (const node of all_nodes) {
      undir_adj.set(node, []);
    }
    for (const [child, parent] of child_to_parent.entries()) {
      undir_adj.get(parent)!.push(child);
      undir_adj.get(child)!.push(parent);
    }
    
    const visited_global = new Set<string>();
    const hierarchies: Hierarchy[] = [];
    
    // Sort nodes lexicographically for deterministic processing
    const sorted_nodes = Array.from(all_nodes).sort();
    
    for (const start_node of sorted_nodes) {
      if (visited_global.has(start_node)) continue;
      
      // BFS/DFS to find all nodes in this undirected component
      const component_nodes: string[] = [];
      const queue = [start_node];
      visited_global.add(start_node);
      
      let head = 0;
      while(head < queue.length) {
        const curr = queue[head++];
        component_nodes.push(curr);
        for (const neighbor of undir_adj.get(curr) || []) {
          if (!visited_global.has(neighbor)) {
            visited_global.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      // 3. Hierarchy Logic for the component
      // Find nodes with no parent in this component
      const component_roots = component_nodes.filter(n => !child_to_parent.has(n));
      component_roots.sort(); // Lexicographical just in case, though it should be at most 1
      
      if (component_roots.length === 0) {
        // Component is a cycle (every node has exactly one parent)
        const root = component_nodes.sort()[0];
        hierarchies.push({
          root,
          tree: {},
          has_cycle: true
        });
      } else {
        // Component has at least one root. In our in-degree <= 1 graph, 
        // a connected component can have at most one root if it has no cycles.
        // Actually, if it's undirected connected, it MUST have exactly one root.
        const root = component_roots[0];
        
        // Build nested tree structure and calculate depth
        let max_depth = 0;
        
        const buildNestedTree = (node: string, depth: number): Record<string, any> => {
          max_depth = Math.max(max_depth, depth);
          const children = (adj.get(node) || []).sort();
          const tree: Record<string, any> = {};
          for (const child of children) {
            tree[child] = buildNestedTree(child, depth + 1);
          }
          return tree;
        };
        
        const tree_content = buildNestedTree(root, 1);
        const final_hierarchy_tree: Record<string, any> = {};
        final_hierarchy_tree[root] = tree_content;
        
        hierarchies.push({
          root,
          tree: final_hierarchy_tree,
          depth: max_depth
        });
      }
    }
    
    // Sort hierarchies by root name
    hierarchies.sort((a, b) => a.root.localeCompare(b.root));
    
    // 4. Summary
    const trees = hierarchies.filter(h => !h.has_cycle);
    const cycles = hierarchies.filter(h => h.has_cycle);
    
    let largest_tree_root = "";
    if (trees.length > 0) {
      // Find based on depth, then lexicographical
      let best = trees[0];
      for (let i = 1; i < trees.length; i++) {
        const curr = trees[i];
        if ((curr.depth || 0) > (best.depth || 0)) {
          best = curr;
        } else if ((curr.depth || 0) === (best.depth || 0)) {
          if (curr.root < best.root) {
            best = curr;
          }
        }
      }
      largest_tree_root = best.root;
    }
    
    res.json({
      user_id: "arunkarthikm_24042026",
      email_id: "arunkarthik.m@college.edu",
      college_roll_number: "21CS9999",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees: trees.length,
        total_cycles: cycles.length,
        largest_tree_root
      }
    });
  });

  // Vite Development Server or Static Production Build
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
