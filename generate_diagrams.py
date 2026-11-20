import os
from PIL import Image, ImageDraw, ImageFont

output_dir = r"d:\transcatGuard\diagrams"
os.makedirs(output_dir, exist_ok=True)

font_path = r"C:\Windows\Fonts\arial.ttf"
font_bold_path = r"C:\Windows\Fonts\arialbd.ttf"

def get_font(size, bold=False):
    p = font_bold_path if bold and os.path.exists(font_bold_path) else font_path
    if os.path.exists(p):
        return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# -------------------------------------------------------------
# 1. Figure 2.1: USE CASE MODEL
# -------------------------------------------------------------
def make_use_case_diagram():
    w, h = 1300, 700
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_sub = get_font(13, bold=False)
    f_box = get_font(13, bold=True)
    f_txt = get_font(11, bold=False)
    f_actor = get_font(14, bold=True)

    # Title Banner
    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 2.1: USE CASE MODEL FOR TRANSACT GUARD PLATFORM", fill="#FFFFFF", font=f_title, anchor="mm")

    # System Boundary Box
    draw.rounded_rectangle([280, 80, 1020, 660], radius=16, fill="#F8FAFC", outline="#3B82F6", width=2)
    draw.text((650, 105), "TRANSact Guard Autonomous Security & P2P Boundary", fill="#1E293B", font=f_box, anchor="mm")

    # Draw Actor on Left (Cardholder / End User)
    draw.ellipse([80, 180, 140, 240], fill="#E2E8F0", outline="#1E293B", width=2)
    draw.line([110, 240, 110, 320], fill="#1E293B", width=3) # torso
    draw.line([60, 270, 160, 270], fill="#1E293B", width=3)  # arms
    draw.line([110, 320, 70, 400], fill="#1E293B", width=3)  # left leg
    draw.line([110, 320, 150, 400], fill="#1E293B", width=3) # right leg
    draw.text((110, 420), "Platform End User\n(Cardholder / Sender)", fill="#0F172A", font=f_actor, anchor="mm", align="center")

    # Draw Actor on Right Top (Autonomous Engine)
    draw.rounded_rectangle([1060, 140, 1260, 240], radius=10, fill="#EEF2FF", outline="#6366F1", width=2)
    draw.text((1160, 180), "Autonomous\nRisk Engine", fill="#312E81", font=f_actor, anchor="mm", align="center")
    draw.text((1160, 220), "(System Agent)", fill="#4338CA", font=f_sub, anchor="mm")

    # Draw Actor on Right Bottom (SOC Fraud Analyst)
    draw.ellipse([1130, 380, 1190, 440], fill="#FEF3C7", outline="#D97706", width=2)
    draw.line([1160, 440, 1160, 520], fill="#D97706", width=3)
    draw.line([1110, 470, 1210, 470], fill="#D97706", width=3)
    draw.line([1160, 520, 1120, 600], fill="#D97706", width=3)
    draw.line([1160, 520, 1200, 600], fill="#D97706", width=3)
    draw.text((1160, 620), "SOC Fraud Analyst\n(Security Operator)", fill="#92400E", font=f_actor, anchor="mm", align="center")

    # Use Cases (Ellipses in center)
    use_cases = [
        (480, 150, "Initiate P2P Fund Transfer", "#DBEAFE", "#2563EB"),
        (820, 150, "Register Identity & Security Q/A", "#DBEAFE", "#2563EB"),
        (480, 240, "Solve Tier 2 Security Challenge", "#FEF3C7", "#D97706"),
        (820, 240, "Touch FIDO2 Hardware Passkey", "#FEE2E2", "#DC2626"),
        (650, 320, "Multi-Signal Model Inference & Fusion", "#EDE9FE", "#7C3AED"),
        (650, 400, "Enforce Adaptive Friction Tier (1-4)", "#E0E7FF", "#4F46E5"),
        (480, 490, "Inspect XAI Causal Factor Breakdown", "#DCFCE7", "#16A34A"),
        (820, 490, "Execute What-If Counterfactual Sim", "#DCFCE7", "#16A34A"),
        (650, 580, "15-Min Escrow Release & SOC Override", "#FFEDD5", "#EA580C")
    ]

    for cx, cy, label, bg, border in use_cases:
        rx, ry = 150, 32
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=bg, outline=border, width=2)
        draw.text((cx, cy), label, fill="#0F172A", font=f_txt, anchor="mm")

    # Lines from User
    for cx, cy in [(480, 150), (820, 150), (480, 240), (820, 240)]:
        draw.line([180, 300, cx - 150, cy], fill="#94A3B8", width=1)

    # Lines from Engine
    for cx, cy in [(650, 320), (650, 400)]:
        draw.line([1060, 190, cx + 150, cy], fill="#6366F1", width=1)

    # Lines from Analyst
    for cx, cy in [(480, 490), (820, 490), (650, 580)]:
        draw.line([1080, 500, cx + 150, cy], fill="#D97706", width=1)

    path = os.path.join(output_dir, "fig_2_1_use_case.png")
    img.save(path)
    return path

# -------------------------------------------------------------
# 2. Figure 2.2: DFD LEVEL 0 (CONTEXT DIAGRAM)
# -------------------------------------------------------------
def make_dfd_lvl0():
    w, h = 1200, 600
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_sub = get_font(13, bold=False)
    f_box = get_font(13, bold=True)
    f_txt = get_font(11, bold=False)

    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 2.2: CONTEXT LEVEL 0 DATA FLOW DIAGRAM (DFD)", fill="#FFFFFF", font=f_title, anchor="mm")

    # External Entity: Client App / P2P Gateway (Left)
    draw.rectangle([80, 220, 300, 380], fill="#F1F5F9", outline="#0F172A", width=2)
    draw.text((190, 270), "EXTERNAL ENTITY", fill="#64748B", font=f_sub, anchor="mm")
    draw.text((190, 310), "Payment Client App\n/ P2P Gateway", fill="#0F172A", font=f_box, anchor="mm", align="center")

    # Central Process 0.0
    draw.ellipse([450, 180, 750, 420], fill="#EFF6FF", outline="#2563EB", width=3)
    draw.text((600, 260), "PROCESS 0.0", fill="#2563EB", font=f_sub, anchor="mm")
    draw.text((600, 300), "TRANSACT GUARD\nAUTONOMOUS RISK &\nDEFENSE ENGINE", fill="#1E293B", font=f_box, anchor="mm", align="center")

    # External Entity: SOC Command Dashboard (Right)
    draw.rectangle([900, 220, 1120, 380], fill="#F1F5F9", outline="#0F172A", width=2)
    draw.text((1010, 270), "EXTERNAL ENTITY", fill="#64748B", font=f_sub, anchor="mm")
    draw.text((1010, 310), "Cyber SOC Command\nCenter Dashboard", fill="#0F172A", font=f_box, anchor="mm", align="center")

    # Data Store D1 (Bottom)
    draw.line([450, 520, 750, 520], fill="#0F172A", width=2)
    draw.line([450, 570, 750, 570], fill="#0F172A", width=2)
    draw.rectangle([450, 520, 490, 570], fill="#E2E8F0")
    draw.text((470, 545), "D1", fill="#0F172A", font=f_box, anchor="mm")
    draw.text((620, 545), "SQLite WAL Transaction & Profile Ledger", fill="#0F172A", font=f_box, anchor="mm")

    # Arrows & Data Flows
    # Client -> Process (top arrow)
    draw.line([300, 260, 460, 260], fill="#2563EB", width=2)
    draw.polygon([(460, 260), (450, 255), (450, 265)], fill="#2563EB")
    draw.text((375, 245), "Payment Payload & Telemetry", fill="#1E3A8A", font=f_txt, anchor="mm")

    # Process -> Client (bottom arrow)
    draw.line([460, 340, 300, 340], fill="#059669", width=2)
    draw.polygon([(300, 340), (310, 335), (310, 345)], fill="#059669")
    draw.text((375, 360), "Step-Up Challenge / Approval Token", fill="#065F46", font=f_txt, anchor="mm")

    # Process -> SOC (top arrow)
    draw.line([740, 260, 900, 260], fill="#DC2626", width=2)
    draw.polygon([(900, 260), (890, 255), (890, 265)], fill="#DC2626")
    draw.text((820, 245), "Live WebSocket Threat Stream", fill="#991B1B", font=f_txt, anchor="mm")

    # SOC -> Process (bottom arrow)
    draw.line([900, 340, 740, 340], fill="#D97706", width=2)
    draw.polygon([(740, 340), (750, 335), (750, 345)], fill="#D97706")
    draw.text((820, 360), "Escrow Release & Analyst Override", fill="#92400E", font=f_txt, anchor="mm")

    # Process <-> DB
    draw.line([600, 420, 600, 520], fill="#475569", width=2)
    draw.polygon([(600, 520), (595, 510), (605, 510)], fill="#475569")
    draw.polygon([(600, 420), (595, 430), (605, 430)], fill="#475569")
    draw.text((690, 470), "Read/Write User Baselines,\nTransactions & Secret Q/A", fill="#334155", font=f_txt, anchor="mm", align="center")

    path = os.path.join(output_dir, "fig_2_2_dfd_lvl0.png")
    img.save(path)
    return path

# -------------------------------------------------------------
# 3. Figure 2.3: DFD LEVEL 1 (DECOMPOSED)
# -------------------------------------------------------------
def make_dfd_lvl1():
    w, h = 1300, 750
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_sub = get_font(12, bold=False)
    f_box = get_font(12, bold=True)
    f_txt = get_font(10, bold=False)

    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 2.3: LEVEL 1 DFD: MULTI-SIGNAL SCORING, FUSION & STEP-UP ESCALATION", fill="#FFFFFF", font=f_title, anchor="mm")

    # Raw Input
    draw.rectangle([50, 220, 180, 300], fill="#F1F5F9", outline="#0F172A", width=2)
    draw.text((115, 260), "Payment Event\nPayload (JSON)", fill="#0F172A", font=f_box, anchor="mm", align="center")

    # 1.0 Feature Telemetry
    draw.ellipse([250, 200, 430, 320], fill="#EFF6FF", outline="#2563EB", width=2)
    draw.text((340, 245), "1.0", fill="#2563EB", font=f_box, anchor="mm")
    draw.text((340, 275), "Telemetry Extraction\n& Geocoding", fill="#1E293B", font=f_box, anchor="mm", align="center")

    # 2.0 Multi-Signal Concurrent Engines
    draw.rectangle([500, 80, 720, 160], fill="#EEF2FF", outline="#6366F1", width=2)
    draw.text((610, 110), "2.1 Champion ML Inference\n(LightGBM 0.982 AUC)", fill="#312E81", font=f_box, anchor="mm", align="center")

    draw.rectangle([500, 180, 720, 260], fill="#FEF3C7", outline="#D97706", width=2)
    draw.text((610, 210), "2.2 Spatial Anomaly Engine\n(Isolation Forest / Mahalanobis)", fill="#92400E", font=f_box, anchor="mm", align="center")

    draw.rectangle([500, 280, 720, 360], fill="#F3E8FF", outline="#9333EA", width=2)
    draw.text((610, 310), "2.3 Deterministic Rule Engine\n(Night, Speed, Device Checks)", fill="#581C87", font=f_box, anchor="mm", align="center")

    draw.rectangle([500, 380, 720, 460], fill="#ECFDF5", outline="#059669", width=2)
    draw.text((610, 410), "2.4 Velocity Burst Counter\n(5m Burst & 1h Rolling Count)", fill="#065F46", font=f_box, anchor="mm", align="center")

    # 3.0 Ensemble Fusion & Overrides
    draw.ellipse([800, 210, 980, 330], fill="#FFF7ED", outline="#EA580C", width=2)
    draw.text((890, 255), "3.0", fill="#EA580C", font=f_box, anchor="mm")
    draw.text((890, 285), "Ensemble Risk Fusion\n& Non-Linear Overrides", fill="#9A3412", font=f_box, anchor="mm", align="center")

    # 4.0 Friction Matrix Escalation
    draw.ellipse([1060, 210, 1240, 330], fill="#FDF2F8", outline="#DB2777", width=2)
    draw.text((1150, 255), "4.0", fill="#DB2777", font=f_box, anchor="mm")
    draw.text((1150, 285), "Adaptive Friction\nEscalation Dispatcher", fill="#831843", font=f_box, anchor="mm", align="center")

    # Tiers Output Boxes (Bottom)
    tiers = [
        (250, 580, "Tier 1: Low Risk (<25)\nZero Friction Approved", "#DCFCE7", "#16A34A"),
        (550, 580, "Tier 2: Med Risk (25-60)\nSecurity Question Prompt", "#FEF3C7", "#D97706"),
        (850, 580, "Tier 3: High Risk (60-80)\nFIDO2 WebAuthn Passkey", "#FEE2E2", "#DC2626"),
        (1150, 580, "Tier 4: Crit Risk (>80)\n15-Min Escrow Vault Quarantine", "#F3E8FF", "#7C3AED")
    ]
    for cx, cy, label, bg, border in tiers:
        draw.rounded_rectangle([cx - 120, cy - 40, cx + 120, cy + 40], radius=8, fill=bg, outline=border, width=2)
        draw.text((cx, cy), label, fill="#0F172A", font=f_txt, anchor="mm", align="center")

    # Connect lines
    draw.line([180, 260, 250, 260], fill="#2563EB", width=2) # input -> 1.0
    for y in [120, 220, 320, 420]:
        draw.line([430, 260, 500, y], fill="#64748B", width=2)
        draw.line([720, y, 800, 270], fill="#64748B", width=2)

    draw.line([980, 270, 1060, 270], fill="#EA580C", width=2) # 3.0 -> 4.0

    # 4.0 to Tiers
    for cx, cy, _, _, _ in tiers:
        draw.line([1150, 330, cx, cy - 40], fill="#DB2777", width=1)

    path = os.path.join(output_dir, "fig_2_3_dfd_lvl1.png")
    img.save(path)
    return path

# -------------------------------------------------------------
# 4. Figure 2.4: DOMAIN CLASS DIAGRAM
# -------------------------------------------------------------
def make_class_diagram():
    w, h = 1250, 700
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_cname = get_font(13, bold=True)
    f_mem = get_font(10.5, bold=False)

    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 2.4: UNIFIED DOMAIN CLASS DIAGRAM OF RISK ENTITIES & PROFILES", fill="#FFFFFF", font=f_title, anchor="mm")

    def draw_class(x, y, cw, ch, name, attrs, methods):
        # Header
        draw.rectangle([x, y, x + cw, y + 32], fill="#1E293B", outline="#0F172A", width=2)
        draw.text((x + cw//2, y + 16), name, fill="#FFFFFF", font=f_cname, anchor="mm")
        
        # Attrs
        ah = len(attrs) * 16 + 12
        draw.rectangle([x, y + 32, x + cw, y + 32 + ah], fill="#F8FAFC", outline="#0F172A", width=2)
        for i, a in enumerate(attrs):
            draw.text((x + 10, y + 38 + i * 16), a, fill="#0F172A", font=f_mem)

        # Methods
        my = y + 32 + ah
        mh = len(methods) * 16 + 12
        draw.rectangle([x, my, x + cw, my + mh], fill="#FFFFFF", outline="#0F172A", width=2)
        for i, m in enumerate(methods):
            draw.text((x + 10, my + 6 + i * 16), m, fill="#1E3A8A", font=f_mem)
        return x + cw, my + mh

    # User
    draw_class(60, 100, 260, 220, "User", [
        "+ id: str [PK]",
        "+ name: str",
        "+ email: str",
        "+ city: str",
        "+ balance: float",
        "+ security_question: str",
        "+ security_answer: str",
        "+ created_at: datetime"
    ], [
        "+ update_balance(amt: float)",
        "+ set_security_qa(q, a)",
        "+ verify_answer(ans: str): bool"
    ])

    # UserBehaviorProfile
    draw_class(60, 420, 260, 220, "UserBehaviorProfile", [
        "+ id: str [PK]",
        "+ user_id: str [FK]",
        "+ avg_amount: float",
        "+ max_amount: float",
        "+ known_devices: List[str]",
        "+ last_latitude: float",
        "+ last_longitude: float",
        "+ last_timestamp: datetime"
    ], [
        "+ compute_displacement(lat, lon)",
        "+ update_velocity_envelope()",
        "+ record_device(device_id: str)"
    ])

    # Transaction
    draw_class(480, 100, 310, 260, "Transaction", [
        "+ id: str [PK]",
        "+ user_id: str [FK]",
        "+ amount: float",
        "+ channel: str",
        "+ merchant_category: str",
        "+ risk_score: float",
        "+ risk_level: str",
        "+ status: str",
        "+ friction_tier: str",
        "+ reasons: List[str]",
        "+ latitude: float, longitude: float",
        "+ timestamp: datetime"
    ], [
        "+ is_nocturnal(): bool",
        "+ calculate_amount_ratio(): float",
        "+ execute_settlement(db: Session)"
    ])

    # FraudAlert
    draw_class(930, 100, 270, 180, "FraudAlert", [
        "+ id: str [PK]",
        "+ transaction_id: str [FK]",
        "+ severity: str",
        "+ analyst_notes: str",
        "+ resolution_status: str",
        "+ resolved_at: datetime"
    ], [
        "+ dispatch_websocket_alert()",
        "+ override_clearance(notes: str)"
    ])

    # RiskCalculator (Controller)
    draw_class(500, 450, 280, 180, "RiskCalculator", [
        "- WEIGHT_ML: float = 0.35",
        "- WEIGHT_ANOMALY: float = 0.25",
        "- WEIGHT_RULES: float = 0.25",
        "- WEIGHT_VELOCITY: float = 0.15"
    ], [
        "+ calculate_unified_risk(...)",
        "+ evaluate_friction_tier(...)",
        "+ enforce_speed_override(...)"
    ])

    # Relationship connectors
    draw.line([190, 320, 190, 420], fill="#0F172A", width=2)
    draw.text((200, 370), "1 --- 1\n(maintains)", fill="#475569", font=f_mem)

    draw.line([320, 200, 480, 200], fill="#0F172A", width=2)
    draw.text((380, 180), "1 --- 0..*\n(initiates)", fill="#475569", font=f_mem)

    draw.line([790, 200, 930, 200], fill="#0F172A", width=2)
    draw.text((840, 180), "1 --- 0..1\n(triggers)", fill="#475569", font=f_mem)

    draw.line([640, 360, 640, 450], fill="#2563EB", width=2)
    draw.text((650, 400), "evaluates\n(dependency)", fill="#2563EB", font=f_mem)

    path = os.path.join(output_dir, "fig_2_4_class_diagram.png")
    img.save(path)
    return path

# -------------------------------------------------------------
# 5. Figure 2.5: ENTITY-RELATIONSHIP (ER) DIAGRAM
# -------------------------------------------------------------
def make_er_diagram():
    w, h = 1200, 650
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_tbl = get_font(13, bold=True)
    f_row = get_font(11, bold=False)
    f_badge = get_font(9, bold=True)

    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 2.5: ENTITY-RELATIONSHIP (ER) DIAGRAM OF CORE STORAGE ENGINE", fill="#FFFFFF", font=f_title, anchor="mm")

    def draw_entity(x, y, ew, title, rows):
        rh = 22
        th = 32
        total_h = th + len(rows) * rh + 6
        draw.rectangle([x, y, x + ew, y + th], fill="#1E293B", outline="#0F172A", width=2)
        draw.text((x + ew//2, y + th//2), title, fill="#FFFFFF", font=f_tbl, anchor="mm")
        
        draw.rectangle([x, y + th, x + ew, y + total_h], fill="#F8FAFC", outline="#0F172A", width=2)
        for i, (key_type, name, data_type) in enumerate(rows):
            cy = y + th + 6 + i * rh
            # Key badge
            if key_type == "PK":
                draw.rectangle([x + 6, cy, x + 30, cy + 16], fill="#DC2626")
                draw.text((x + 18, cy + 8), "PK", fill="#FFFFFF", font=f_badge, anchor="mm")
            elif key_type == "FK":
                draw.rectangle([x + 6, cy, x + 30, cy + 16], fill="#2563EB")
                draw.text((x + 18, cy + 8), "FK", fill="#FFFFFF", font=f_badge, anchor="mm")
            
            draw.text((x + 36, cy + 8), name, fill="#0F172A", font=f_row, anchor="lm")
            draw.text((x + ew - 8, cy + 8), data_type, fill="#64748B", font=f_row, anchor="rm")
        return total_h

    # USERS
    draw_entity(60, 100, 260, "USERS", [
        ("PK", "id", "VARCHAR(36)"),
        ("", "name", "VARCHAR(120)"),
        ("", "email", "VARCHAR(150)"),
        ("", "city", "VARCHAR(100)"),
        ("", "balance", "FLOAT"),
        ("", "security_question", "TEXT"),
        ("", "security_answer", "TEXT"),
        ("", "created_at", "DATETIME")
    ])

    # BEHAVIOR_PROFILES
    draw_entity(60, 360, 260, "BEHAVIOR_PROFILES", [
        ("PK", "id", "VARCHAR(36)"),
        ("FK", "user_id", "VARCHAR(36)"),
        ("", "avg_amount", "FLOAT"),
        ("", "max_amount", "FLOAT"),
        ("", "known_devices", "JSON"),
        ("", "last_latitude", "FLOAT"),
        ("", "last_longitude", "FLOAT"),
        ("", "last_timestamp", "DATETIME")
    ])

    # TRANSACTIONS
    draw_entity(460, 100, 300, "TRANSACTIONS", [
        ("PK", "id", "VARCHAR(36)"),
        ("FK", "user_id", "VARCHAR(36)"),
        ("", "amount", "FLOAT"),
        ("", "channel", "VARCHAR(50)"),
        ("", "merchant_category", "VARCHAR(50)"),
        ("", "risk_score", "FLOAT"),
        ("", "risk_level", "VARCHAR(20)"),
        ("", "status", "VARCHAR(30)"),
        ("", "friction_tier", "VARCHAR(40)"),
        ("", "reasons", "JSON"),
        ("", "latitude", "FLOAT"),
        ("", "longitude", "FLOAT"),
        ("", "timestamp", "DATETIME")
    ])

    # FRAUD_ALERTS
    draw_entity(890, 100, 260, "FRAUD_ALERTS", [
        ("PK", "id", "VARCHAR(36)"),
        ("FK", "transaction_id", "VARCHAR(36)"),
        ("", "severity", "VARCHAR(20)"),
        ("", "analyst_notes", "TEXT"),
        ("", "resolution_status", "VARCHAR(30)"),
        ("", "resolved_at", "DATETIME")
    ])

    # Lines with Crow's Foot
    # Users -> Behavior_profiles (1:1)
    draw.line([190, 290, 190, 360], fill="#0F172A", width=2)
    draw.text((205, 325), "1 : 1", fill="#1E293B", font=f_row)

    # Users -> Transactions (1:N)
    draw.line([320, 200, 460, 200], fill="#0F172A", width=2)
    # Crow's foot at 460
    draw.line([460, 200, 445, 190], fill="#0F172A", width=2)
    draw.line([460, 200, 445, 210], fill="#0F172A", width=2)
    draw.text((370, 180), "1 : N", fill="#1E293B", font=f_row)

    # Transactions -> Fraud_alerts (1:0..1)
    draw.line([760, 200, 890, 200], fill="#0F172A", width=2)
    draw.text((810, 180), "1 : 0..1", fill="#1E293B", font=f_row)

    path = os.path.join(output_dir, "fig_2_5_er_diagram.png")
    img.save(path)
    return path

# -------------------------------------------------------------
# 6. Figure 3.1: HIGH-LEVEL ARCHITECTURE BLUEPRINT
# -------------------------------------------------------------
def make_architecture_blueprint():
    w, h = 1300, 750
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_layer = get_font(14, bold=True)
    f_box = get_font(12, bold=True)
    f_txt = get_font(10, bold=False)

    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 3.1: HIGH-LEVEL ARCHITECTURE AND REAL-TIME DATA PIPELINE", fill="#FFFFFF", font=f_title, anchor="mm")

    # Layer 1: Client & Presentation
    draw.rounded_rectangle([40, 80, 1260, 200], radius=12, fill="#F8FAFC", outline="#3B82F6", width=2)
    draw.text((60, 100), "1. PRESENTATION & CLIENT CONSUMPTION LAYER (REACT 19 + VITE + TAILWINDCSS)", fill="#1E3A8A", font=f_layer)
    draw.rounded_rectangle([70, 125, 330, 185], radius=8, fill="#DBEAFE", outline="#2563EB", width=1)
    draw.text((200, 155), "Cyber SOC Dashboard\n(24h Stream & Live Feeds)", fill="#1E3A8A", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([370, 125, 630, 185], radius=8, fill="#DBEAFE", outline="#2563EB", width=1)
    draw.text((500, 155), "P2P Payment Gateway\n(Mobile Device Geolocation)", fill="#1E3A8A", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([670, 125, 930, 185], radius=8, fill="#DBEAFE", outline="#2563EB", width=1)
    draw.text((800, 155), "Interactive XAI Forensics\n(What-If Counterfactual Sliders)", fill="#1E3A8A", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([970, 125, 1230, 185], radius=8, fill="#DBEAFE", outline="#2563EB", width=1)
    draw.text((1100, 155), "Live Threat Simulator\n(Adversarial Attack Vectors)", fill="#1E3A8A", font=f_box, anchor="mm", align="center")

    # Layer 2: API Gateway & Ingestion
    draw.rounded_rectangle([40, 230, 1260, 350], radius=12, fill="#F8FAFC", outline="#10B981", width=2)
    draw.text((60, 250), "2. API GATEWAY & ASGI INGESTION TIER (FASTAPI + UVICORN + WEBSOCKETS)", fill="#065F46", font=f_layer)
    draw.rounded_rectangle([100, 275, 420, 335], radius=8, fill="#D1FAE5", outline="#059669", width=1)
    draw.text((260, 305), "REST Ingestion API (HTTP/2)\nSub-5ms JSON Deserialization", fill="#065F46", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([480, 275, 800, 335], radius=8, fill="#D1FAE5", outline="#059669", width=1)
    draw.text((640, 305), "Bidirectional WebSocket Broker\nSub-Millisecond Broadcast", fill="#065F46", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([860, 275, 1200, 335], radius=8, fill="#D1FAE5", outline="#059669", width=1)
    draw.text((1030, 305), "Feature Telemetry Pipeline\nHaversine Speed & Ratio Vector", fill="#065F46", font=f_box, anchor="mm", align="center")

    # Layer 3: Risk Intelligence & Scoring
    draw.rounded_rectangle([40, 380, 1260, 560], radius=12, fill="#F8FAFC", outline="#6366F1", width=2)
    draw.text((60, 400), "3. AUTONOMOUS RISK INTELLIGENCE & ADAPTIVE FRICTION ESCALATION ENGINE", fill="#312E81", font=f_layer)
    draw.rounded_rectangle([70, 430, 330, 540], radius=8, fill="#EEF2FF", outline="#4F46E5", width=1)
    draw.text((200, 460), "Champion ML Classifier", fill="#312E81", font=f_box, anchor="mm")
    draw.text((200, 500), "• LightGBM (0.982 AUC)\n• XGBoost & Random Forest\n• MLP Neural Network", fill="#4338CA", font=f_txt, anchor="mm", align="center")

    draw.rounded_rectangle([370, 430, 630, 540], radius=8, fill="#FEF3C7", outline="#D97706", width=1)
    draw.text((500, 460), "Spatial Anomaly Detector", fill="#92400E", font=f_box, anchor="mm")
    draw.text((500, 500), "• Isolation Forest (99.0%)\n• Mahalanobis Distance\n• Dynamic Geo-Envelope", fill="#B45309", font=f_txt, anchor="mm", align="center")

    draw.rounded_rectangle([670, 430, 930, 540], radius=8, fill="#F3E8FF", outline="#9333EA", width=1)
    draw.text((800, 460), "Rules & Velocity Engine", fill="#581C87", font=f_box, anchor="mm")
    draw.text((800, 500), "• Impossible Speed (>750km/h)\n• 5m Burst (>=4 txns)\n• Nocturnal Window Check", fill="#7E22CE", font=f_txt, anchor="mm", align="center")

    draw.rounded_rectangle([970, 430, 1230, 540], radius=8, fill="#FEE2E2", outline="#DC2626", width=1)
    draw.text((1100, 460), "Adaptive Friction Matrix", fill="#991B1B", font=f_box, anchor="mm")
    draw.text((1100, 500), "• Tier 1: 1-Click Approved\n• Tier 2: Secret Question\n• Tier 3: FIDO2 Passkey\n• Tier 4: 15-Min Escrow Vault", fill="#B91C1C", font=f_txt, anchor="mm", align="center")

    # Layer 4: Storage
    draw.rounded_rectangle([40, 590, 1260, 720], radius=12, fill="#F8FAFC", outline="#475569", width=2)
    draw.text((60, 610), "4. PERSISTENCE & DATA STORAGE TIER (SQLITE WAL + SQLALCHEMY ORM)", fill="#1E293B", font=f_layer)
    draw.rounded_rectangle([150, 635, 450, 705], radius=8, fill="#E2E8F0", outline="#334155", width=1)
    draw.text((300, 670), "User & Identity Store\nCredentials, Balance & Secret Q/A", fill="#0F172A", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([500, 635, 800, 705], radius=8, fill="#E2E8F0", outline="#334155", width=1)
    draw.text((650, 670), "Transaction & Audit Ledger\nAtomic Double-Entry Balances", fill="#0F172A", font=f_box, anchor="mm", align="center")

    draw.rounded_rectangle([850, 635, 1150, 705], radius=8, fill="#E2E8F0", outline="#334155", width=1)
    draw.text((1000, 670), "Behavior Profile DNA\nRolling Averages & Known Devices", fill="#0F172A", font=f_box, anchor="mm", align="center")

    path = os.path.join(output_dir, "fig_3_1_architecture.png")
    img.save(path)
    return path

# -------------------------------------------------------------
# 7. Figure 3.2: ADAPTIVE STEP-UP FRICTION MATRIX
# -------------------------------------------------------------
def make_friction_matrix_diagram():
    w, h = 1350, 700
    img = Image.new("RGB", (w, h), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    f_title = get_font(20, bold=True)
    f_tier = get_font(15, bold=True)
    f_sub = get_font(12, bold=True)
    f_txt = get_font(10.5, bold=False)

    draw.rectangle([0, 0, w, 50], fill="#1E293B")
    draw.text((w//2, 25), "FIGURE 3.2: FOUR-TIER ADAPTIVE STEP-UP FRICTION ESCALATION MATRIX", fill="#FFFFFF", font=f_title, anchor="mm")

    tiers_data = [
        (60, "TIER 1: LOW RISK", "< 25.0 POINTS", "Zero Friction (1-Click)", "#DCFCE7", "#16A34A", "#065F46", [
            "• Baseline Legitimate Activity",
            "• Standard spending envelope",
            "• Recognized trusted hardware",
            "• Localized geocoordinates",
            "ACTION:",
            "Instant 1-Click Settlement",
            "Zero extra user friction"
        ]),
        (370, "TIER 2: MEDIUM RISK", "25.0 – 60.0 POINTS", "Step-Up Challenge", "#FEF3C7", "#D97706", "#92400E", [
            "• Moderate Behavioral Anomaly",
            "• Spending 3x-5x average",
            "• High-velocity category",
            "• Minor location drift",
            "ACTION:",
            "Security Question Prompt",
            "Rechecked against registered secret answer (HTTP 403 on mismatch)"
        ]),
        (680, "TIER 3: HIGH RISK", "60.1 – 80.0 POINTS", "Hardware Passkey", "#FEE2E2", "#DC2626", "#991B1B", [
            "• Severe Threat Signature",
            "• Unrecognized device ID",
            "• Off-hours night transaction",
            "• Rapid 1-hour debit velocity",
            "ACTION:",
            "FIDO2 / WebAuthn Passkey",
            "Physical biometric / YubiKey touch verification"
        ]),
        (990, "TIER 4: CRITICAL RISK", "> 80.0 POINTS", "15-Min Escrow Vault", "#F3E8FF", "#7C3AED", "#581C87", [
            "• Extreme Fraud / Rapid Drain",
            "• Impossible travel (>750 km/h)",
            "• 5-min burst >= 4 debits",
            "• Severe ML fraud prediction",
            "ACTION:",
            "Automated 15-Min Escrow Vault",
            "Funds locked in cooling-off vault; manual SOC Analyst override"
        ])
    ]

    for x, title, pts, policy, bg, border, text_color, bullets in tiers_data:
        bw = 290
        # Card outline
        draw.rounded_rectangle([x, 100, x + bw, 640], radius=14, fill=bg, outline=border, width=2)
        # Header Box
        draw.rounded_rectangle([x, 100, x + bw, 180], radius=14, fill=border)
        draw.text((x + bw//2, 125), title, fill="#FFFFFF", font=f_tier, anchor="mm")
        draw.text((x + bw//2, 155), pts, fill="#FEF08A", font=f_sub, anchor="mm")

        # Policy pill
        draw.rounded_rectangle([x + 20, 200, x + bw - 20, 240], radius=20, fill="#FFFFFF", outline=border, width=1)
        draw.text((x + bw//2, 220), policy, fill=text_color, font=f_sub, anchor="mm")

        # Bullets
        by = 265
        for b in bullets:
            if b.startswith("ACTION:"):
                draw.text((x + 20, by), b, fill=text_color, font=f_sub)
                by += 22
            elif "Instant" in b or "Security Question" in b or "FIDO2" in b or "Automated 15-Min" in b:
                draw.text((x + 20, by), b, fill="#0F172A", font=get_font(11, bold=True))
                by += 22
            else:
                draw.text((x + 20, by), b, fill="#1E293B", font=f_txt)
                by += 22

    path = os.path.join(output_dir, "fig_3_2_friction_matrix.png")
    img.save(path)
    return path

if __name__ == "__main__":
    print("Generating diagrams...")
    make_use_case_diagram()
    make_dfd_lvl0()
    make_dfd_lvl1()
    make_class_diagram()
    make_er_diagram()
    make_architecture_blueprint()
    make_friction_matrix_diagram()
    print("All 7 architecture diagrams generated in:", output_dir)
