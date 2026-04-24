/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Send, 
  Trash2, 
  Layout, 
  Code2, 
  Copy, 
  Check, 
  Hash, 
  RefreshCcw, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  CornerDownRight 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Hierarchy {
  root: string;
  tree: Record<string, any>;
  depth?: number;
  has_cycle?: true;
}

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string | null;
}

interface BFHLResponse {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  hierarchies: Hierarchy[];
  invalid_entries: string[];
  duplicate_edges: string[];
  summary: Summary;
  message?: string;
}

const DEFAULT_INPUT = "A->B\nA->C\nB->D\nC->E\nE->F\nX->Y\nY->Z\nZ->X\nP->Q\nQ->R\nINVALID_TRY";

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
    setResponse(null);
    try {
      const data = input.split("\n");
      const res = await fetch("/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const result = await res.json();
      if (res.ok) {
        setResponse(result);
      } else {
        setError(result.message || "Failed to process data.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
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

  const trees = response?.hierarchies.filter(h => !h.has_cycle) || [];
  const cycles = response?.hierarchies.filter(h => h.has_cycle) || [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200">
      <header className="border-b border-neutral-200/60 sticky top-0 bg-neutral-50/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-neutral-800" />
            <h1 className="text-sm font-semibold tracking-tight text-neutral-800">SRM Engineering Challenge</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
             <span>BFHL v2.1</span>
             <div className="w-[1px] h-3 bg-neutral-300" />
             <div className="flex items-center gap-2 px-2 py-1 bg-neutral-100 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] text-neutral-600 uppercase tracking-wide">Operational</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 line-tight">Full Stack Hierarchy Analyzer</h2>
          <p className="text-sm text-neutral-500 font-medium max-w-2xl">
             Candidate: <span className="text-neutral-900 font-semibold">Arun Karthik M</span> • Roll: <span className="text-neutral-900 font-semibold">21CS9999</span>
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Input Data</label>
                <button 
                  onClick={() => setInput("")}
                  className="text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="A->B"
                spellCheck={false}
                className="w-full h-80 bg-white border border-neutral-200/80 rounded-xl p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 transition-all shadow-sm"
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="w-full h-11 bg-neutral-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
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

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-sm text-red-700 flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-8">
            {!response && !error && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 min-h-[400px]">
                <Layout className="w-8 h-8 mb-4 opacity-20" />
                <p className="text-sm font-medium">Awaiting input data</p>
                <p className="text-[11px] mt-2 max-w-[200px] text-center">Analyze hierarchical data using graph verification.</p>
              </div>
            )}

            {response && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-4">
                  <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode("visual")}
                      className={`px-4 py-1.5 text-[11px] font-medium rounded-md transition-all flex items-center gap-2 ${
                        viewMode === "visual" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      Visual Mode
                    </button>
                    <button
                      onClick={() => setViewMode("json")}
                      className={`px-4 py-1.5 text-[11px] font-medium rounded-md transition-all flex items-center gap-2 ${
                        viewMode === "json" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Raw JSON
                    </button>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-neutral-500 hover:text-neutral-900 transition-colors text-xs font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied to clipboard" : "Copy output"}
                  </button>
                </div>

                {viewMode === "visual" ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-3 gap-4">
                      <SummaryCard label="Valid Trees" value={response.summary.total_trees} />
                      <SummaryCard label="Detected Cycles" value={response.summary.total_cycles} />
                      <SummaryCard label="Largest Root" value={response.summary.largest_tree_root || "—"} />
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">Hierarchies</h3>
                      <div className="space-y-4">
                        {trees.length === 0 ? (
                          <p className="text-sm text-neutral-400 p-4 bg-white rounded-2xl border border-neutral-200/60 shadow-sm text-center italic">No valid trees generated.</p>
                        ) : (
                          trees.map((tree, idx) => (
                            <TreeVisual key={idx} tree={tree} />
                          ))
                        )}
                      </div>
                    </div>

                    {(cycles.length > 0 || response.invalid_entries.length > 0 || response.duplicate_edges.length > 0) && (
                      <div className="space-y-6">
                        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">Diagnostics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cycles.length > 0 && (
                            <IssueBlock title="Cyclic Groups" items={cycles.map(c => c.root + " (Smallest Edge)")} />
                          )}
                          {response.invalid_entries.length > 0 && (
                            <IssueBlock title="Invalid Syntax" items={response.invalid_entries} />
                          )}
                        </div>
                        {response.duplicate_edges.length > 0 && (
                          <IssueBlock title="Redundant Edges Cleaned" items={response.duplicate_edges} />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-neutral-900 rounded-2xl shadow-xl overflow-x-auto"
                  >
                    <pre className="text-[13px] font-mono text-neutral-300 leading-relaxed">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 bg-white border border-neutral-200/80 rounded-2xl shadow-sm hover:border-neutral-300 transition-colors">
      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5">{label}</div>
      <div className="text-2xl font-semibold text-neutral-900 tracking-tight">{value}</div>
    </div>
  );
}

const TreeVisual: React.FC<{ tree: Hierarchy }> = ({ tree }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-neutral-300">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-50/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-4 pl-1">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 font-semibold text-sm">
            {tree.root}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-neutral-900 tracking-tight">Tree Group</span>
            <span className="text-[11px] font-medium text-neutral-400">Depth: {tree.depth}</span>
          </div>
        </div>
        <div className="pr-2 text-neutral-400">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-100/60"
          >
            <div className="p-6 pl-8 bg-neutral-50/40">
              <TreeNode node={tree.root} tree={tree.tree} isRoot />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TreeNode: React.FC<{ node: string; tree: Record<string, any>; isRoot?: boolean }> = ({ node, tree, isRoot }) => {
  const children = Object.keys(tree);

  return (
    <div className={`${isRoot ? "" : "ml-4 mt-3"} relative`}>
      {!isRoot && (
        <div className="absolute -left-4 top-[9px] text-neutral-300">
          <CornerDownRight className="w-3.5 h-3.5" />
        </div>
      )}
      
      <div className="flex items-center gap-2 relative z-10 w-fit">
        <div className="w-6 h-6 flex items-center justify-center font-medium text-[13px] bg-white border border-neutral-200/80 rounded text-neutral-700 shadow-sm leading-none">
          {node}
        </div>
      </div>
      
      {children.length > 0 && (
        <div className="ml-2.5 border-l border-neutral-200/80">
          {children.map(child => (
            <TreeNode key={child} node={child} tree={tree[child]} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-5 bg-white border border-neutral-200/80 rounded-2xl shadow-sm">
      <h4 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="px-2 py-1 text-[11px] font-mono text-neutral-600 bg-neutral-100/80 rounded shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
             {item}
          </span>
        ))}
      </div>
    </div>
  );
}
