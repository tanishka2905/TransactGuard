import asyncio
import json
from contextlib import asynccontextmanager
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.api import transactions, alerts, users, dashboard, simulator, webhook
from app.api.transactions import set_ws_broadcast_callback

# Active WebSocket connections pool
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead_sockets = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_sockets.append(connection)
        for s in dead_sockets:
            self.disconnect(s)

manager = ConnectionManager()

# Hook into transactions router for real-time live events
set_ws_broadcast_callback(manager.broadcast)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Check and run seed if users table empty
    from app.seed import run_seed
    db = SessionLocal()
    try:
        run_seed(db)
    except Exception as e:
        print(f"[Lifespan] Seed error: {e}")
    finally:
        db.close()
        
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time AI-Powered Transaction Fraud Detection & Behavioral Risk Intelligence Platform",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(transactions.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)
app.include_router(webhook.router, prefix=settings.API_V1_STR)

@app.websocket("/ws/transactions")
async def websocket_transactions_stream(websocket: WebSocket):
    """
    Bi-directional streaming WebSocket endpoint.
    Broadcasts real-time transaction ingestion events, fraud alerts, and heartbeat telemetry.
    """
    await manager.connect(websocket)
    try:
        # Send initial confirmation
        await websocket.send_text(json.dumps({
            "event": "CONNECTED",
            "message": "Connected to Transact Guard Real-Time Telemetry Stream",
            "version": settings.VERSION
        }))
        while True:
            # Keep socket alive and accept ping/pong or client commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "PONG"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "production-ready"
    }

@app.get("/ready")
def readiness_check():
    return {"ready": True}
