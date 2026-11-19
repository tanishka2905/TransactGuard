from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models import Transaction, User
from app.engine.graph_engine import GraphIntelligenceEngine

router = APIRouter(prefix="/graph", tags=["Graph Intelligence & Mule Ring Syndicate Detection"])

@router.get("/network")
def get_transaction_network_graph(limit: int = 150, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Constructs the directed financial interaction graph from persistent transaction history.
    Detects circular wash cycles, rapid fan-in/fan-out mule accounts, and shared hardware clusters.
    """
    # Fetch recent transactions and registered users
    txns = db.query(Transaction).order_by(desc(Transaction.timestamp)).limit(limit).all()
    users = db.query(User).all()

    graph_data = GraphIntelligenceEngine.analyze_graph_topology(txns, users)
    return graph_data

@router.get("/mule-analysis/{user_id}")
def get_user_mule_analysis(user_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns specific graph risk metrics, in/out ratio, and syndicate connections for an account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")

    txns = db.query(Transaction).filter(
        (Transaction.user_id == user_id) | (Transaction.beneficiary_user_id == user_id)
    ).all()
    users = db.query(User).all()

    graph_data = GraphIntelligenceEngine.analyze_graph_topology(txns, users)
    matching_node = next((n for n in graph_data["nodes"] if n["id"] == user_id), None)

    return {
        "user_id": user_id,
        "name": user.name,
        "balance": user.balance,
        "city": user.city,
        "graph_node": matching_node,
        "associated_cycles": [c for c in graph_data["detected_cycles"] if user_id in c],
        "associated_device_clusters": [c for c in graph_data["shared_device_clusters"] if user_id in c["user_ids"]]
    }
