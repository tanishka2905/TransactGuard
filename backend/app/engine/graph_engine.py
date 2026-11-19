import time
import datetime
from typing import Dict, Any, List, Set, Tuple
from collections import defaultdict

class GraphIntelligenceEngine:
    """
    Real-Time Financial Graph & Money Mule Syndicate Detector.
    Constructs graph topologies of entity interactions and flags:
    1. Circular Wash Cycles (e.g. A -> B -> C -> A)
    2. Rapid Fan-In Aggregation (Mule Funnel)
    3. Rapid Fan-Out Dispersal (Layering Smurf)
    4. Shared Entity Botnets (Multiple users sharing device_id or IP)
    """

    @classmethod
    def analyze_graph_topology(cls, transactions: List[Any], users: List[Any]) -> Dict[str, Any]:
        """
        Builds graph adjacency lists, computes network centrality,
        and uncovers organized fraud syndicates.
        """
        # Node dictionaries
        user_nodes = {}
        for u in users:
            uid = getattr(u, "id", None) or u.get("id")
            uname = getattr(u, "name", None) or u.get("name", uid)
            ubal = getattr(u, "balance", 0.0) or u.get("balance", 0.0)
            ucity = getattr(u, "city", "Unknown") or u.get("city", "Unknown")
            user_nodes[uid] = {
                "id": uid,
                "name": uname,
                "balance": ubal,
                "city": ucity,
                "in_degree": 0,
                "out_degree": 0,
                "total_inflow": 0.0,
                "total_outflow": 0.0,
                "connected_devices": set(),
                "connected_ips": set(),
                "mule_risk_score": 0.0,
                "syndicate_flags": []
            }

        # Shared hardware/IP maps: device_id -> set of user_ids
        device_to_users: Dict[str, Set[str]] = defaultdict(set)
        ip_to_users: Dict[str, Set[str]] = defaultdict(set)

        # Adjacency matrix for cycle detection: sender -> list of (beneficiary, amount, timestamp)
        adj: Dict[str, List[Tuple[str, float, Any]]] = defaultdict(list)
        edges = []

        for txn in transactions:
            sender_id = getattr(txn, "user_id", None)
            ben_id = getattr(txn, "beneficiary_user_id", None) or getattr(txn, "beneficiary_id", None)
            amt = float(getattr(txn, "amount", 0.0))
            dev = getattr(txn, "device_id", None)
            ip = getattr(txn, "ip_address", None)
            ts = getattr(txn, "timestamp", None)
            status = getattr(txn, "status", "APPROVED")

            # Track shared devices / IPs
            if sender_id and dev:
                device_to_users[dev].add(sender_id)
                if sender_id in user_nodes:
                    user_nodes[sender_id]["connected_devices"].add(dev)
            if sender_id and ip:
                ip_to_users[ip].add(sender_id)
                if sender_id in user_nodes:
                    user_nodes[sender_id]["connected_ips"].add(ip)

            # Build directed graph edges
            if sender_id and ben_id and sender_id != ben_id:
                adj[sender_id].append((ben_id, amt, ts))
                
                # Update degrees
                if sender_id in user_nodes:
                    user_nodes[sender_id]["out_degree"] += 1
                    user_nodes[sender_id]["total_outflow"] += amt
                if ben_id in user_nodes:
                    user_nodes[ben_id]["in_degree"] += 1
                    user_nodes[ben_id]["total_inflow"] += amt

                edges.append({
                    "id": f"{sender_id}->{ben_id}-{len(edges)}",
                    "source": sender_id,
                    "target": ben_id,
                    "amount": amt,
                    "timestamp": str(ts) if ts else "",
                    "status": status,
                    "is_flagged": status in ["FLAGGED", "BLOCKED"]
                })

        # --- Detection 1: Circular Wash Cycles (Length 2 and 3) ---
        detected_cycles = []
        for u1, edges_u1 in adj.items():
            for u2, _, _ in edges_u1:
                # 2-cycle: A -> B -> A
                if u2 in adj:
                    for u3, _, _ in adj[u2]:
                        if u3 == u1:
                            cycle = sorted([u1, u2])
                            if cycle not in detected_cycles:
                                detected_cycles.append(cycle)
                                if u1 in user_nodes:
                                    user_nodes[u1]["syndicate_flags"].append("Circular Wash Trading Loop (2-Node)")
                                if u2 in user_nodes:
                                    user_nodes[u2]["syndicate_flags"].append("Circular Wash Trading Loop (2-Node)")
                        # 3-cycle: A -> B -> C -> A
                        elif u3 in adj:
                            for u4, _, _ in adj[u3]:
                                if u4 == u1:
                                    cycle = sorted([u1, u2, u3])
                                    if cycle not in detected_cycles:
                                        detected_cycles.append(cycle)
                                        for n in cycle:
                                            if n in user_nodes:
                                                user_nodes[n]["syndicate_flags"].append("Multi-Hop Laundering Syndicate Loop (3-Node)")

        # --- Detection 2: Shared Hardware Device Rings ---
        shared_device_clusters = []
        for dev, u_set in device_to_users.items():
            if len(u_set) >= 2 and not dev.startswith("dev_default"):
                shared_device_clusters.append({
                    "device_id": dev,
                    "user_ids": list(u_set)
                })
                for uid in u_set:
                    if uid in user_nodes:
                        user_nodes[uid]["syndicate_flags"].append(f"Shared Device Fingerprint with {len(u_set)-1} other accounts")

        # --- Detection 3: Rapid Fan-In Mule Accounts ---
        mule_hotspots = []
        for uid, node in user_nodes.items():
            in_deg = node["in_degree"]
            out_deg = node["out_degree"]
            inflow = node["total_inflow"]
            outflow = node["total_outflow"]

            mule_score = 10.0
            if in_deg >= 3 and out_deg <= 1:
                mule_score += 45.0
                node["syndicate_flags"].append(f"Mule Aggregator Hotspot: {in_deg} Inflows vs {out_deg} Outflows")
            if out_deg >= 3 and in_deg <= 1:
                mule_score += 40.0
                node["syndicate_flags"].append(f"Rapid Fan-Out Smurf Dispersal: {out_deg} outgoing transfers")
            if len(node["syndicate_flags"]) > 0:
                mule_score += (len(node["syndicate_flags"]) * 15.0)

            node["mule_risk_score"] = round(min(98.0, max(5.0, mule_score)), 1)
            if node["mule_risk_score"] >= 60.0:
                mule_hotspots.append({
                    "user_id": uid,
                    "name": node["name"],
                    "mule_risk_score": node["mule_risk_score"],
                    "flags": node["syndicate_flags"]
                })

        # Format nodes for JSON visualization
        formatted_nodes = []
        for uid, node in user_nodes.items():
            formatted_nodes.append({
                "id": uid,
                "label": node["name"],
                "balance": node["balance"],
                "city": node["city"],
                "in_degree": node["in_degree"],
                "out_degree": node["out_degree"],
                "total_inflow": node["total_inflow"],
                "total_outflow": node["total_outflow"],
                "mule_risk_score": node["mule_risk_score"],
                "syndicate_flags": list(set(node["syndicate_flags"])),
                "is_suspicious": node["mule_risk_score"] >= 50.0
            })

        return {
            "summary": {
                "total_nodes": len(formatted_nodes),
                "total_edges": len(edges),
                "detected_cycles_count": len(detected_cycles),
                "shared_device_clusters_count": len(shared_device_clusters),
                "high_risk_mules_count": len(mule_hotspots)
            },
            "nodes": formatted_nodes,
            "edges": edges,
            "detected_cycles": detected_cycles,
            "shared_device_clusters": shared_device_clusters,
            "mule_hotspots": sorted(mule_hotspots, key=lambda x: x["mule_risk_score"], reverse=True)
        }
