/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, ReactNode } from "react";
import { 
  Send, 
  Trash2, 
  Plus, 
  Info, 
  ChevronRight, 
  ChevronDown, 
  TreePine, 
  RefreshCcw, 
  Code2, 
  Layout, 
  AlertCircle,
  Copy,
  Check,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TreeResult {
  root: string;
  nodes: string[];
  depth: number;
  structure: Record<string, string[]>;
}

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string;
}

interface BFHLResponse {
  is_success: boolean;
  trees: TreeResult[];
  cycles: { nodes: string[] }[];
  invalid_entries: string[];
  duplicates: string[];
  summary: Summary;
  message?: string;
}

const DEFAULT_INPUT = "A->B\nB->C\nA->D\nF->G\nH->I\nI->H\nINVALID_X";

export default function App() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BFHLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = input.split("\n").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const result = await res.json();
      if (res.ok) {
        setResponse(result);
      } else {
        setError(result.message || "Something went wrong. Please check your connection.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Header */}
      <header className="border-bottom border-zinc-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">BFHL Visualizer</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Pipeline v1.0.4</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <a href="https://github.com" target="_blank" className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-medium">Documentation</a>
             <div className="w-[1px] h-4 bg-zinc-200" />
             <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">Systems Operational</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Input Panel */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Node Definitions</label>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setInput("")}
                    className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors rounded hover:bg-zinc-100"
                    title="Clear input"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter nodes like: A->B"
                  spellCheck={false}
                  className="w-full h-80 bg-white border border-zinc-200 rounded-xl p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-zinc-400 font-medium">Press CMD+Enter to run</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 px-1">
                <Info className="w-3.5 h-3.5 text-zinc-400 mt-0.5" />
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Format: <code className="text-zinc-900">PARENT{"->"}CHILD</code> (one per line). 
                  Nodes must be uppercase alphabetical strings.
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="w-full h-11 bg-zinc-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
              >
                {loading ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Run Analysis</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start"
              >
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-red-900">Analysis Failed</p>
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            {!response && !error && !loading && (
              <div className="h-full min-h-[400px] border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400 px-12 text-center">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <Layout className="w-6 h-6 text-zinc-200" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900 mb-1">Ready for Analysis</h3>
                <p className="text-xs leading-relaxed max-w-[240px]">
                  Input your node strings on the left to visualize trees, hierarchies, and cycles.
                </p>
              </div>
            )}

            {response && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Visual / JSON Toggle */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex bg-zinc-100 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode("visual")}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-2 ${
                        viewMode === "visual" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      Visual Mode
                    </button>
                    <button
                      onClick={() => setViewMode("json")}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-2 ${
                        viewMode === "json" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      JSON Output
                    </button>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 hover:text-zinc-900 transition-colors text-[11px] font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </button>
                </div>

                {viewMode === "visual" ? (
                  <div className="space-y-10">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <SummaryCard label="Total Trees" value={response.summary.total_trees} icon={<TreePine className="w-3.5 h-3.5" />} />
                      <SummaryCard label="Detected Cycles" value={response.summary.total_cycles} icon={<RefreshCcw className="w-3.5 h-3.5" />} />
                      <SummaryCard label="Largest Tree" value={response.summary.largest_tree_root || "N/A"} icon={<ChevronRight className="w-3.5 h-3.5" />} color="text-zinc-900" />
                    </div>

                    {/* Valid Trees */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Valid Hierarchies</span>
                        <div className="flex-1 h-[1px] bg-zinc-100" />
                      </div>
                      <div className="space-y-4">
                        {response.trees.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic py-4">No valid trees detected.</p>
                        ) : (
                          response.trees.map((tree, idx) => (
                            <TreeVisual key={idx} tree={tree} />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Cycles & Issues */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Detected Inconsistencies</span>
                        <div className="flex-1 h-[1px] bg-zinc-100" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <IssueBlock 
                          title="Cycles Found" 
                          items={response.cycles.map(c => c.nodes.join(" ⇄ "))} 
                          type="cycle"
                        />
                        <IssueBlock 
                          title="Invalid Strings" 
                          items={response.invalid_entries} 
                          type="invalid"
                        />
                      </div>
                      {response.duplicates.length > 0 && (
                        <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                           <p className="text-[10px] text-zinc-400 font-semibold uppercase mb-2">Redundant Edges Cleaned</p>
                           <div className="flex flex-wrap gap-2">
                              {response.duplicates.map((d, i) => (
                                <span key={i} className="text-[11px] text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">{d}</span>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-zinc-900 rounded-2xl shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-50 text-white/10 group-hover:text-white/20 transition-colors pointer-events-none">
                      <Code2 className="w-32 h-32" />
                    </div>
                    <pre className="text-[13px] font-mono text-zinc-100 leading-relaxed overflow-x-auto selection:bg-white/20 whitespace-pre-wrap">
                      {JSON.stringify(response, null, 4)}
                    </pre>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-100 py-12 mt-20">
         <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
               <Hash className="w-4 h-4 text-zinc-300" />
               <span className="text-xs font-semibold text-zinc-400 tracking-tight">BFHL SYSTEMS</span>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-[400px] text-center leading-relaxed">
              Designed and built for peak performance. The BFHL Visualizer is a professional-grade diagnostic tool for graph data analysis and hierarchy resolution.
            </p>
         </div>
      </footer>
    </div>
  );
}

function SummaryCard({ label, value, icon, color = "text-zinc-500" }: { label: string; value: string | number; icon: ReactNode; color?: string }) {
  return (
    <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-zinc-300 transition-colors">
      <div className="flex items-center gap-2 mb-2 text-zinc-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-semibold tracking-tight ${color}`}>
        {value}
      </div>
    </div>
  );
}

const TreeVisual: React.FC<{ tree: TreeResult }> = ({ tree }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-xs ring-4 ring-zinc-50">
            {tree.root}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900">Tree Hierarchy</h4>
            <p className="text-[10px] text-zinc-400 flex items-center gap-2">
               <span>Depth: {tree.depth}</span>
               <span className="w-1 h-1 bg-zinc-200 rounded-full" />
               <span>Nodes: {tree.nodes.length}</span>
            </p>
          </div>
        </div>
        <div className={`p-1 text-zinc-400 transition-transform ${collapsed ? "" : "rotate-180"}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      
      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-zinc-100"
          >
            <div className="p-6 bg-zinc-50/30">
              <TreeNode 
                node={tree.root} 
                structure={tree.structure} 
                isRoot={true} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TreeNode: React.FC<{ node: string; structure: Record<string, string[]>; depth?: number; isRoot?: boolean }> = ({ node, structure, depth = 0, isRoot = false }) => {
  const children = structure[node] || [];

  return (
    <div className={`${isRoot ? "" : "ml-6 mt-3 pl-4 border-l border-zinc-200"}`}>
      <div className="flex items-center gap-3 group">
        <div className={`
          flex items-center justify-center font-bold text-[11px] rounded-md transition-all
          ${isRoot ? "w-6 h-6 bg-zinc-900 text-white" : "w-5 h-5 bg-white border border-zinc-300 text-zinc-700 shadow-sm group-hover:border-zinc-900"}
        `}>
          {node}
        </div>
        {children.length > 0 && (
          <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-tight group-hover:text-zinc-500 transition-colors">
            {children.length} Children
          </span>
        )}
      </div>
      <div>
        {children.map((child, i) => (
          <TreeNode key={`${child}-${i}`} node={child} structure={structure} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

function IssueBlock({ title, items, type }: { title: string; items: string[]; type: "cycle" | "invalid" }) {
  return (
    <div className={`p-4 rounded-2xl border ${items.length > 0 ? "bg-white border-zinc-200" : "bg-zinc-50 border-transparent opacity-50"}`}>
      <div className="flex items-center gap-2 mb-3">
         <span className={`w-1.5 h-1.5 rounded-full ${items.length > 0 ? (type === "cycle" ? "bg-amber-500" : "bg-red-500") : "bg-zinc-300"}`} />
         <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-[11px] text-zinc-400 italic">None detected</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg group hover:bg-zinc-100 transition-colors">
               {type === "cycle" ? <RefreshCcw className="w-3 h-3 text-zinc-400" /> : <AlertCircle className="w-3 h-3 text-zinc-400" />}
               <span className="text-xs font-mono text-zinc-700">{item}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
