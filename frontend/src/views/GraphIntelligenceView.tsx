import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  RefreshCw, 
  AlertTriangle, 
  Users, 
  Smartphone, 
  Repeat, 
  ArrowRight, 
  Activity,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import type { GraphNetworkResponse, GraphNode } from '../types';

export const GraphIntelligenceView: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphNetworkResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'network' | 'mules' | 'cycles' | 'devices'>('network');

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactionGraph(120);
      setGraphData(data);
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load transaction graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* View Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] glass-panel shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-glow-safe">
            <Share2 className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-mono tracking-tight">
                GRAPH INTELLIGENCE & MONEY MULE NETWORK EXPLORER
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                TOPOLOGY RADAR
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Uncovering circular wash trading cycles, rapid fan-in/fan-out mule accounts, and shared hardware botnets
            </p>
          </div>
        </div>

        <button
          onClick={fetchGraph}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Topology</span>
        </button>
      </div>

      {/* Network Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase">Entity Nodes</span>
            <Users className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <span className="text-2xl font-bold text-white mt-1 block">
            {graphData?.summary.total_nodes || 0}
          </span>
          <span className="text-[10px] text-zinc-400">Account vertices</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase">Transfer Edges</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold text-cyan-400 mt-1 block">
            {graphData?.summary.total_edges || 0}
          </span>
          <span className="text-[10px] text-zinc-400">Directed fund flows</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase">Circular Cycles</span>
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {graphData?.summary.detected_cycles_count || 0}
          </span>
          <span className="text-[10px] text-zinc-400">Wash trading loops</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase">Shared Device Rings</span>
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">
            {graphData?.summary.shared_device_clusters_count || 0}
          </span>
          <span className="text-[10px] text-zinc-400">Multi-user hardware clusters</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase">Mule Hotspots</span>
            <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-2xl font-bold text-purple-400 mt-1 block">
            {graphData?.summary.high_risk_mules_count || 0}
          </span>
          <span className="text-[10px] text-zinc-400">Elevated funnel ratio</span>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-white/[0.06] w-fit font-mono text-xs">
        <button
          onClick={() => setActiveSubTab('network')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'network' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Visual Network Graph
        </button>
        <button
          onClick={() => setActiveSubTab('mules')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'mules' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Mule Hotspots ({graphData?.mule_hotspots.length || 0})
        </button>
        <button
          onClick={() => setActiveSubTab('cycles')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'cycles' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Circular Cycles ({graphData?.detected_cycles.length || 0})
        </button>
        <button
          onClick={() => setActiveSubTab('devices')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'devices' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Device Rings ({graphData?.shared_device_clusters.length || 0})
        </button>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'network' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Graph Canvas / SVG Map */}
          <div className="lg:col-span-8 rounded-2xl glass-panel border border-white/[0.08] p-5 flex flex-col justify-between relative overflow-hidden min-h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Directed Transaction Topology Map
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Legitimate Flow
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  Suspicious / Mule Edge
                </span>
              </div>
            </div>

            {/* SVG Interactive Topology Visualization */}
            <div className="relative flex-1 w-full flex items-center justify-center p-4">
              {loading ? (
                <div className="text-xs font-mono text-zinc-400">Analyzing Network Topologies...</div>
              ) : (
                <svg className="w-full h-[380px] overflow-visible">
                  <defs>
                    <linearGradient id="grad-legit" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="grad-threat" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Render Connections */}
                  {graphData?.nodes && graphData.nodes.length > 1 && (
                    graphData.nodes.map((node, i) => {
                      const total = graphData.nodes.length;
                      const cx = 350 + Math.cos((i / total) * 2 * Math.PI) * 180;
                      const cy = 190 + Math.sin((i / total) * 2 * Math.PI) * 140;

                      return graphData.edges
                        .filter(e => e.source === node.id)
                        .map((edge, edgeIdx) => {
                          const targetIdx = graphData.nodes.findIndex(n => n.id === edge.target);
                          if (targetIdx === -1) return null;
                          const tx = 350 + Math.cos((targetIdx / total) * 2 * Math.PI) * 180;
                          const ty = 190 + Math.sin((targetIdx / total) * 2 * Math.PI) * 140;

                          return (
                            <g key={`${edge.id}-${edgeIdx}`}>
                              <line
                                x1={cx}
                                y1={cy}
                                x2={tx}
                                y2={ty}
                                stroke={edge.is_flagged ? "url(#grad-threat)" : "url(#grad-legit)"}
                                strokeWidth={edge.is_flagged ? 2.5 : 1.5}
                                strokeDasharray={edge.is_flagged ? "4,4" : undefined}
                                opacity={0.6}
                              />
                            </g>
                          );
                        });
                    })
                  )}

                  {/* Render Nodes */}
                  {graphData?.nodes.map((node, i) => {
                    const total = graphData.nodes.length;
                    const cx = 350 + Math.cos((i / total) * 2 * Math.PI) * 180;
                    const cy = 190 + Math.sin((i / total) * 2 * Math.PI) * 140;
                    const isSelected = selectedNode?.id === node.id;
                    const isMule = node.mule_risk_score >= 50.0;

                    return (
                      <g 
                        key={node.id} 
                        className="cursor-pointer group"
                        onClick={() => setSelectedNode(node)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 26 : 20}
                          fill={isMule ? "#881337" : "#09090b"}
                          stroke={isMule ? "#f43f5e" : (isSelected ? "#6366f1" : "#27272a")}
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-all duration-200 group-hover:scale-110"
                        />
                        {isMule && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={28}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth={1}
                            opacity={0.4}
                            className="animate-ping"
                          />
                        )}
                        <text
                          x={cx}
                          y={cy + 4}
                          fill="#ffffff"
                          fontSize={9}
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="Consolas"
                        >
                          {node.label.split(' ')[0]}
                        </text>
                        <text
                          x={cx}
                          y={cy + 34}
                          fill="#a1a1aa"
                          fontSize={9}
                          textAnchor="middle"
                          fontFamily="Consolas"
                        >
                          {node.mule_risk_score.toFixed(0)} pts
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Interactive Graph: Click any node to open forensic dossier</span>
              <span className="text-purple-400 font-semibold">{graphData?.summary.total_edges || 0} active links analyzed</span>
            </div>
          </div>

          {/* Right Column: Node Forensic Dossier */}
          <div className="lg:col-span-4 rounded-2xl glass-panel border border-white/[0.08] p-5 flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase">Entity Dossier</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedNode.is_suspicious 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {selectedNode.is_suspicious ? 'MULE SUSPECT' : 'NORMAL ENTITY'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedNode.label}</h3>
                  <span className="text-[11px] text-zinc-400 font-sans block">{selectedNode.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block">Current Balance</span>
                    <span className="font-bold text-white text-sm">◈ {selectedNode.balance.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block">Mule Risk Score</span>
                    <span className={`font-bold text-sm ${selectedNode.is_suspicious ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedNode.mule_risk_score} / 100
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block">In-Degree (Inflows)</span>
                    <span className="font-bold text-cyan-400 text-sm">{selectedNode.in_degree} txns</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">◈ {selectedNode.total_inflow.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block">Out-Degree (Outflows)</span>
                    <span className="font-bold text-indigo-400 text-sm">{selectedNode.out_degree} txns</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">◈ {selectedNode.total_outflow.toLocaleString()}</span>
                  </div>
                </div>

                {/* Flags Section */}
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase mb-1.5 font-bold">
                    Syndicate & Graph Telemetry Flags
                  </span>
                  {selectedNode.syndicate_flags.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedNode.syndicate_flags.map((flag, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-zinc-900/40 text-zinc-400 text-[11px]">
                      No anomalous syndicate or cycle patterns detected for this user.
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-zinc-400">
                  <span>Registered Location: </span>
                  <span className="text-white font-semibold">{selectedNode.city}</span>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-400 text-xs font-mono">
                Select an entity node from the network graph to inspect details.
              </div>
            )}

            <button
              onClick={() => setActiveSubTab('mules')}
              className="w-full mt-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Full Mule Leaderboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mule Hotspots Table */}
      {activeSubTab === 'mules' && (
        <div className="rounded-2xl glass-panel border border-white/[0.08] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white font-mono">High-Risk Mule Accounts</h3>
              <p className="text-xs text-zinc-400 font-sans">Accounts exhibiting extreme in-degree aggregation or rapid dispersal ratios</p>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold">
              {graphData?.mule_hotspots.length || 0} Accounts Flagged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Mule Risk Score</th>
                  <th className="py-2.5 px-3">Identified Syndicate Telemetry</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {graphData?.mule_hotspots && graphData.mule_hotspots.length > 0 ? (
                  graphData.mule_hotspots.map((mule) => (
                    <tr key={mule.user_id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{mule.name}</span>
                        <span className="text-[10px] text-zinc-400">{mule.user_id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {mule.mule_risk_score} / 100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {mule.flags.map((f, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 border border-white/[0.06]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => {
                            const n = graphData.nodes.find(x => x.id === mule.user_id);
                            if (n) {
                              setSelectedNode(n);
                              setActiveSubTab('network');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px]"
                        >
                          View in Graph
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400">
                      No critical mule hotspots currently identified in active transaction stream.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Circular Cycles Tab */}
      {activeSubTab === 'cycles' && (
        <div className="rounded-2xl glass-panel border border-white/[0.08] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white font-mono">Circular Wash Trading Cycles</h3>
            <p className="text-xs text-zinc-400 font-sans">Directed cycles where capital flows in loops (A &rarr; B &rarr; C &rarr; A) to simulate synthetic volume or launder funds</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {graphData?.detected_cycles && graphData.detected_cycles.length > 0 ? (
              graphData.detected_cycles.map((cycle, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Repeat className="w-5 h-5 text-amber-400 animate-spin-slow" />
                    <div>
                      <div className="text-white font-bold">
                        {cycle.join('  ➔  ')}  ➔  {cycle[0]}
                      </div>
                      <span className="text-[10px] text-amber-300">
                        {cycle.length}-Hop Closed Loop Identified
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    WASH TRADING
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-400">
                Zero circular cycles detected in recent transaction window.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Devices Tab */}
      {activeSubTab === 'devices' && (
        <div className="rounded-2xl glass-panel border border-white/[0.08] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white font-mono">Shared Hardware Device Clusters</h3>
            <p className="text-xs text-zinc-400 font-sans">Multiple distinct accounts transacting from the exact same physical device hardware identifier</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {graphData?.shared_device_clusters && graphData.shared_device_clusters.length > 0 ? (
              graphData.shared_device_clusters.map((cluster, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-900/60 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-rose-400" />
                    <div>
                      <div className="text-white font-bold">{cluster.device_id}</div>
                      <span className="text-[10px] text-zinc-400">
                        Shared across {cluster.user_ids.length} accounts: {cluster.user_ids.join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    BOTNET / ATO RISK
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-400">
                No shared hardware device collisions detected.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
