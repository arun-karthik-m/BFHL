// Standalone logic verification script
interface Hierarchy {
  root: string;
  tree: Record<string, any>;
  depth?: number;
  has_cycle?: boolean;
}

function processBFHL(data: any[]) {
    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];
    const reported_duplicates = new Set<string>();
    const seen_edges = new Set<string>();
    
    const all_nodes = new Set<string>();
    const child_to_parent = new Map<string, string>();
    const adj = new Map<string, string[]>();
    
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
      
      const edge_str = `${from}->${to}`;
      if (seen_edges.has(edge_str)) {
        if (!reported_duplicates.has(edge_str)) {
          duplicate_edges.push(edge_str);
          reported_duplicates.add(edge_str);
        }
        continue;
      }
      seen_edges.add(edge_str);
      
      if (child_to_parent.has(to)) {
        all_nodes.add(from);
        all_nodes.add(to);
        continue;
      }
      
      all_nodes.add(from);
      all_nodes.add(to);
      child_to_parent.set(to, from);
      
      if (!adj.has(from)) adj.set(from, []);
      adj.get(from)!.push(to);
    }
    
    for (const node of all_nodes) {
      if (!adj.has(node)) adj.set(node, []);
    }
    
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
    const sorted_nodes = Array.from(all_nodes).sort();
    
    for (const start_node of sorted_nodes) {
      if (visited_global.has(start_node)) continue;
      
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
      
      const component_roots = component_nodes.filter(n => !child_to_parent.has(n));
      component_roots.sort();
      
      if (component_roots.length === 0) {
        const root = component_nodes.sort()[0];
        hierarchies.push({ root, tree: {}, has_cycle: true });
      } else {
        const root = component_roots[0];
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
        
        hierarchies.push({ root, tree: final_hierarchy_tree, depth: max_depth });
      }
    }
    
    hierarchies.sort((a, b) => a.root.localeCompare(b.root));
    const trees = hierarchies.filter(h => !h.has_cycle);
    const cycles = hierarchies.filter(h => h.has_cycle);
    
    let largest_tree_root = "";
    if (trees.length > 0) {
      let best = trees[0];
      for (let i = 1; i < trees.length; i++) {
        if ((trees[i].depth || 0) > (best.depth || 0)) {
          best = trees[i];
        } else if ((trees[i].depth || 0) === (best.depth || 0)) {
          if (trees[i].root < best.root) best = trees[i];
        }
      }
      largest_tree_root = best.root;
    }
    
    return {
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees: trees.length,
        total_cycles: cycles.length,
        largest_tree_root
      }
    };
}

const tests = [
    ["A->B","A->B","A->B","A->B"],
    ["A->D","B->D","C->D"],
    ["A->B","B->C","C->A","D->E"],
    ["A->B","B->C","C->A","C->D"],
    ["A->B","A->C","B->D","C->E","E->F"],
    ["B->C","A->C"],
    ["A->B","hello","X->Y","Y->X"],
    [],
    ["   "]
];

tests.forEach((t, i) => {
    console.log(`\n--- Test Case ${i+1}: ${JSON.stringify(t)} ---`);
    console.log(JSON.stringify(processBFHL(t), null, 2));
});
