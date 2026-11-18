import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# 1. Initialize 16:9 Presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# 2. Design System Color Palette (Cyber-FinSec Theme)
BG_DARK = RGBColor(10, 12, 16)         # Deep Void Black #0A0C10
PANEL_DARK = RGBColor(18, 22, 30)      # Elevated Glass Panel #12161E
PANEL_BORDER = RGBColor(38, 45, 61)    # Subtle Blue-Gray Border #262D3D
ACCENT_ROSE = RGBColor(244, 63, 94)    # Cyber Danger Rose #F43F5E
ACCENT_INDIGO = RGBColor(99, 102, 241) # High-Tech Indigo #6366F1
ACCENT_EMERALD = RGBColor(16, 185, 129)# Nominal Safe Green #10B981
ACCENT_CYAN = RGBColor(6, 182, 212)    # Signal Cyan #06B6D4
ACCENT_AMBER = RGBColor(245, 158, 11)  # Warning Amber #F59E0B
TEXT_WHITE = RGBColor(248, 250, 252)   # Pure Text #F8FAFC
TEXT_MUTED = RGBColor(148, 163, 184)   # Secondary Text #94A3B8
TEXT_DIM = RGBColor(100, 116, 139)     # Dim Telemetry Text #64748B

blank_layout = prs.slide_layouts[6]

def apply_slide_background(slide):
    """Draws full dark void background with subtle top accent line."""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_DARK
    bg.line.fill.background()
    
    # Top neon accent line
    top_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.06))
    top_line.fill.solid()
    top_line.fill.fore_color.rgb = ACCENT_INDIGO
    top_line.line.fill.background()

def add_header(slide, tag_text, title_text, subtitle_text=""):
    """Adds standard cyber-SOC header."""
    header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.2))
    tf = header_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    # Tag
    p_tag = tf.paragraphs[0]
    p_tag.text = tag_text.upper()
    p_tag.font.name = "Consolas"
    p_tag.font.size = Pt(10)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_ROSE
    p_tag.space_after = Pt(4)
    
    # Main Title
    p_title = tf.add_paragraph()
    p_title.text = title_text
    p_title.font.name = "Segoe UI"
    p_title.font.size = Pt(24)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE
    
    if subtitle_text:
        p_sub = tf.add_paragraph()
        p_sub.text = subtitle_text
        p_sub.font.name = "Segoe UI"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_before = Pt(3)

def add_card(slide, left, top, width, height, bg_color=PANEL_DARK, border_color=PANEL_BORDER):
    """Creates a stylized panel card."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.2)
    else:
        shape.line.fill.background()
    return shape

def set_notes(slide, notes_text):
    """Sets presenter speaker notes."""
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = notes_text

# ==============================================================================
# SLIDE 1: TITLE SLIDE
# ==============================================================================
s1 = prs.slides.add_slide(blank_layout)
apply_slide_background(s1)

# Center Title Box
title_card = add_card(s1, Inches(1.2), Inches(1.2), Inches(10.933), Inches(5.1), PANEL_DARK, ACCENT_INDIGO)

# Title Text
tb = s1.shapes.add_textbox(Inches(1.8), Inches(1.6), Inches(9.733), Inches(4.3))
tf = tb.text_frame
tf.word_wrap = True

p_badge = tf.paragraphs[0]
p_badge.text = "AUTONOMOUS FINSEC INTELLIGENCE SOC v2.5  |  FINAL CAPSTONE DEFENSE"
p_badge.font.name = "Consolas"
p_badge.font.size = Pt(11)
p_badge.font.bold = True
p_badge.font.color.rgb = ACCENT_ROSE
p_badge.space_after = Pt(12)

p_main = tf.add_paragraph()
p_main.text = "TRANSact GUARD"
p_main.font.name = "Segoe UI"
p_main.font.size = Pt(44)
p_main.font.bold = True
p_main.font.color.rgb = TEXT_WHITE

p_sub = tf.add_paragraph()
p_sub.text = "Real-Time AI-Powered Transaction Fraud Detection & Behavioral Risk Intelligence Platform"
p_sub.font.name = "Segoe UI"
p_sub.font.size = Pt(16)
p_sub.font.color.rgb = ACCENT_CYAN
p_sub.space_before = Pt(6)
p_sub.space_after = Pt(28)

p_cand = tf.add_paragraph()
p_cand.text = "Presenter: Tanishka Upadhyay (GitHub: tanishka2905)\nDepartment of Computer Science & Engineering\nLive System: Sub-20ms Autonomous Ingestion Engine"
p_cand.font.name = "Segoe UI"
p_cand.font.size = Pt(12)
p_cand.font.color.rgb = TEXT_MUTED

set_notes(s1, "Respected members of the committee, good morning. Today, I present 'TRANSact Guard'. Modern digital payment systems process millions of financial events per second, making traditional reactive fraud detection obsolete. TRANSact Guard is an autonomous, real-time transaction monitoring and behavioral risk platform that evaluates financial transactions in sub-20 milliseconds using a hybrid multi-signal artificial intelligence engine. Rather than relying on a static CSV-based model demo, this project is built from scratch as an end-to-end, production-style platform encompassing real-time ingestion, continuous behavioral profiling, explainable causal verdicts, synchronized peer-to-peer ledger visualization, and a cyber-security operations center.")

# ==============================================================================
# SLIDE 2: INTRODUCTION & INDUSTRY CONTEXT
# ==============================================================================
s2 = prs.slides.add_slide(blank_layout)
apply_slide_background(s2)
add_header(s2, "01 // Industry Domain Context", "The Crisis in Modern Financial Cybercrime", "Transitioning from legacy batch inspection to inline autonomous defense")

# 3 Horizontal Cards: The 3 Generations of Financial Defense
col_w = Inches(3.64)
col_h = Inches(4.7)

# Gen 1 Card
c1 = add_card(s2, Inches(0.8), Inches(1.8), col_w, col_h)
tb = s2.shapes.add_textbox(Inches(1.0), Inches(2.0), col_w - Inches(0.4), col_h - Inches(0.4))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "GENERATION 1"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_AMBER
p = tf.add_paragraph()
p.text = "Rule-Based Engines\n(Legacy Core)"
p.font.name = "Segoe UI"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = TEXT_WHITE
p.space_after = Pt(10)
p = tf.add_paragraph()
p.text = "• Hardcoded IF-THEN conditions\n• Rigid amount and threshold filters\n• High false-positive rates (> 18%)\n• Blind to zero-day attacker variations\n• Requires manual manual policy updates after money is already lost."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_MUTED

# Gen 2 Card
c2 = add_card(s2, Inches(4.84), Inches(1.8), col_w, col_h)
tb = s2.shapes.add_textbox(Inches(5.04), Inches(2.0), col_w - Inches(0.4), col_h - Inches(0.4))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "GENERATION 2"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_INDIGO
p = tf.add_paragraph()
p.text = "Batch ML Models\n(T+1 Settlement)"
p.font.name = "Segoe UI"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = TEXT_WHITE
p.space_after = Pt(10)
p = tf.add_paragraph()
p.text = "• Offline Supervised ML classifiers\n• Trained on historical static CSV dumps\n• Processes fraud post-settlement (hours or days later)\n• 'Black-Box' predictions lack regulatory explainability\n• Fails to protect instant P2P rails (UPI / FedNow)."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_MUTED

# Gen 3 Card (TRANSact Guard)
c3 = add_card(s2, Inches(8.88), Inches(1.8), col_w, col_h, PANEL_DARK, ACCENT_EMERALD)
tb = s2.shapes.add_textbox(Inches(9.08), Inches(2.0), col_w - Inches(0.4), col_h - Inches(0.4))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "GENERATION 3"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD
p = tf.add_paragraph()
p.text = "TRANSact Guard\n(Real-Time SOC)"
p.font.name = "Segoe UI"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = TEXT_WHITE
p.space_after = Pt(10)
p = tf.add_paragraph()
p.text = "• Sub-20ms inline pre-screening\n• 4-signal multi-layer hybrid fusion\n• Dynamic Gaussian Behavioral DNA\n• Transparent Explainable AI (XAI)\n• Side-by-side bilateral P2P protection & interactive confirmation modal."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_MUTED

set_notes(s2, "To contextualize this work: digital payment fraud losses surpass $38 billion annually. Financial institutions face a critical dilemma: if rules are too strict, customers face frustrating payment declines; if too loose, fraud losses skyrocket. Furthermore, existing batch ML pipelines evaluate fraud hours after the transaction settles. TRANSact Guard bridges this gap by placing a multi-signal risk evaluator directly on the payment wire before funds are transferred.")

# ==============================================================================
# SLIDE 3: PROBLEM STATEMENT
# ==============================================================================
s3 = prs.slides.add_slide(blank_layout)
apply_slide_background(s3)
add_header(s3, "02 // Problem Formulation", "Critical Bottlenecks in Modern Payment Security", "Why conventional fraud detection systems fail in high-speed digital finance")

# 4 Grid Cards
w4 = Inches(5.66)
h4 = Inches(2.2)

cards_data = [
    (Inches(0.8), Inches(1.8), "1. THE LATENCY BOTTLENECK", "High-Throughput Payment Gateway Constraints", "Payment processors require sub-100ms response budgets. Deep neural networks and heavy pipelines cause connection timeouts and checkout abandons.", ACCENT_ROSE),
    (Inches(6.86), Inches(1.8), "2. THE BLACK-BOX COMPLIANCE BARRIER", "Regulatory Mandates & Lack of Explainability", "Financial regulations (GDPR Art. 22, RBI, SEC) mandate clear explanations for payment freezes. Opaque ML outputs ('fraud score: 0.91') violate audit requirements.", ACCENT_AMBER),
    (Inches(0.8), Inches(4.3), "3. EXTREME DATA IMBALANCE", "Deceptive Accuracy in Imbalanced Streams", "Fraud represents < 0.1% of transactions. Naive classifiers achieve 99.9% accuracy by approving everything while missing 100% of attacks, requiring PR-AUC optimization.", ACCENT_INDIGO),
    (Inches(6.86), Inches(4.3), "4. THE BILATERAL P2P BLINDSPOT", "Mule Accounts & Instant Account Takeover", "Legacy monitoring only inspects the sender. Modern fraud syndicates use 'mule accounts' to launder illicit capital instantly before fraud is reported.", ACCENT_CYAN)
]

for left, top, tag, title, desc, col in cards_data:
    add_card(s3, left, top, w4, h4)
    tb = s3.shapes.add_textbox(left + Inches(0.25), top + Inches(0.2), w4 - Inches(0.5), h4 - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.name = "Consolas"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = title
    p.font.name = "Segoe UI"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p = tf.add_paragraph()
    p.text = desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(4)

set_notes(s3, "When designing TRANSact Guard, we targeted four core problems. First: latency. An inline risk check cannot exceed 50 milliseconds without degrading user checkout experience. Second: explainability. If a user’s transaction is blocked, bank fraud analysts must know the exact deterministic reasons why. Third: extreme data imbalance, which makes conventional accuracy metrics deceptive. And fourth: dual-user peer visibility, ensuring both sender debits and beneficiary mule risks are assessed together.")

# ==============================================================================
# SLIDE 4: PROJECT OBJECTIVES
# ==============================================================================
s4 = prs.slides.add_slide(blank_layout)
apply_slide_background(s4)
add_header(s4, "03 // Engineering Goals", "Core Objectives & Architecture Mandates", "Building a resilient, production-ready fraud intelligence system")

objs = [
    ("SUB-20MS INGESTION", "Achieve real-time normalization, feature extraction, multi-signal inference, and database persistence in under 20 milliseconds.", ACCENT_EMERALD),
    ("HYBRID MULTI-SIGNAL FUSION", "Fuse Supervised ML (35%), Isolation Forest (25%), Heuristic Rules (25%), and Velocity (15%) into a normalized 0-100 risk score.", ACCENT_INDIGO),
    ("DYNAMIC BEHAVIORAL DNA", "Maintain incremental Gaussian envelopes (mean, variance, active hours, familiar devices, trusted coordinates) for every user profile.", ACCENT_CYAN),
    ("BILATERAL P2P LEDGER & PRE-SCREEN", "Provide synchronized dual-user cards with pre-screening risk evaluations and an interactive confirmation pop-up modal.", ACCENT_ROSE),
    ("COMPLIANT EXPLAINABLE AI (XAI)", "Deconstruct every transaction into plain-text causal reasons with human-in-the-loop analyst override and audit telemetry.", ACCENT_AMBER)
]

y_pos = Inches(1.8)
for tag, desc, col in objs:
    card = add_card(s4, Inches(0.8), y_pos, Inches(11.733), Inches(0.95))
    tb = s4.shapes.add_textbox(Inches(1.05), y_pos + Inches(0.12), Inches(11.2), Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag + "  —  " + desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_WHITE
    # highlight tag
    p.font.bold = True
    y_pos += Inches(1.05)

set_notes(s4, "Our project objectives were structured to deliver a complete, production-grade system rather than an isolated algorithm. The system ingests transactions, updates the user's running behavioral profile in real-time, computes a 4-tier risk score, produces transparent XAI reasons, and broadcasts telemetry to a live monitoring dashboard within 16.8 milliseconds.")

# ==============================================================================
# SLIDE 5: SYSTEM ARCHITECTURE & DATA PIPELINE
# ==============================================================================
s5 = prs.slides.add_slide(blank_layout)
apply_slide_background(s5)
add_header(s5, "04 // System Architecture", "End-to-End Real-Time Ingestion & Triage Pipeline", "Asynchronous non-blocking architecture from ingestion wire to cyber-SOC console")

# 5 Sequential Process Blocks
stages = [
    ("1. INGESTION", "FastAPI Gateway\nREST / P2P / Webhook\nPydantic v2 Schema", ACCENT_CYAN),
    ("2. PROFILING", "Behavioral DNA Cache\nZ-Score Calculations\nHaversine Velocities", ACCENT_INDIGO),
    ("3. HYBRID AI", "Random Forest (35%)\nIsolation Forest (25%)\nRule Heuristics (25%)\nVelocity Windows (15%)", ACCENT_ROSE),
    ("4. STORAGE", "SQLAlchemy 2.0 ORM\nAudit History Log\nState Updates (Postgres)", ACCENT_AMBER),
    ("5. LIVE SOC", "WebSocket Server\nReact 18 + Vite UI\nLive Stream (<24h)\nXAI Drawer & Alerts", ACCENT_EMERALD)
]

step_w = Inches(2.18)
for i, (title, details, col) in enumerate(stages):
    lx = Inches(0.8) + i * Inches(2.4)
    c = add_card(s5, lx, Inches(2.0), step_w, Inches(4.5), PANEL_DARK, col)
    tb = s5.shapes.add_textbox(lx + Inches(0.15), Inches(2.2), step_w - Inches(0.3), Inches(4.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = "Consolas"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(14)
    p = tf.add_paragraph()
    p.text = details
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_WHITE

set_notes(s5, "This architectural pipeline demonstrates the end-to-end data lifecycle. When a transaction arrives through the API gateway, Pydantic immediately validates and tokenizes incoming identifiers. The engine retrieves the user's historical behavioral profile and extracts comparative features. These features feed simultaneously into our 4 risk signals: Supervised Random Forest, Unsupervised Isolation Forest, Deterministic Rules, and Velocity Windows. The synthesized 0-to-100 score triggers an automated risk classification. Concurrently, the Explainable AI layer translates the mathematical deviations into plain-text causal reasons. The transaction is persisted to the database and broadcasted via WebSockets directly to the React dashboard within 16.8 milliseconds.")

# ==============================================================================
# SLIDE 6: MULTI-SIGNAL HYBRID RISK ENGINE
# ==============================================================================
s6 = prs.slides.add_slide(blank_layout)
apply_slide_background(s6)
add_header(s6, "05 // AI Methodology", "The Multi-Signal Hybrid Risk Formula", "Overcoming single-model fragility via unified mathematical signal fusion")

# Formula Hero Card
c_f = add_card(s6, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.2), PANEL_DARK, ACCENT_INDIGO)
tb = s6.shapes.add_textbox(Inches(1.0), Inches(1.95), Inches(11.333), Inches(0.9))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Risk Score = min(100,  0.35 * S_ML  +  0.25 * S_Anomaly  +  0.25 * S_Rules  +  0.15 * S_Velocity)"
p.font.name = "Consolas"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN

p2 = tf.add_paragraph()
p2.text = "Normalized 0 – 100 Scale  |  0-29: LOW (Approved)  |  30-59: MEDIUM  |  60-79: HIGH (Flagged)  |  80-100: CRITICAL (Blocked)"
p2.font.name = "Segoe UI"
p2.font.size = Pt(11)
p2.font.color.rgb = TEXT_MUTED
p2.space_before = Pt(4)

# 4 Pillars
pw = Inches(2.78)
ph = Inches(3.4)
pillars = [
    ("SUPERVISED ML (35%)", "Random Forest (150 trees, max_depth=12). Evaluates non-linear cross-feature fraud patterns from historical datasets.", ACCENT_ROSE),
    ("ISOLATION FOREST (25%)", "Unsupervised tree isolation (contamination=0.05). Isolates zero-day multivariate behavioral outliers without prior labels.", ACCENT_AMBER),
    ("RULE HEURISTICS (25%)", "Deterministic domain heuristics. Instant penalties for impossible travel (>750 km/h) and rogue hardware device fingerprints.", ACCENT_CYAN),
    ("VELOCITY BURST (15%)", "Sliding temporal counters (5m, 1h, 24h). Catches automated bot scripts, card testing, and rapid fund drainage attacks.", ACCENT_EMERALD)
]

for i, (title, desc, col) in enumerate(pillars):
    lx = Inches(0.8) + i * Inches(2.98)
    add_card(s6, lx, Inches(3.2), pw, ph)
    tb = s6.shapes.add_textbox(lx + Inches(0.2), Inches(3.4), pw - Inches(0.4), ph - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = "Consolas"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(10)
    p = tf.add_paragraph()
    p.text = desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_WHITE

set_notes(s6, "The core intellectual contribution of our risk engine is this hybrid formulation. Relying solely on supervised ML fails when fraudsters change tactics because the model hasn't seen the new pattern. Relying solely on rules fails because rules cannot capture non-linear combinations. By synthesizing Supervised ML at 35%, Isolation Forest at 25%, Heuristic Rules at 25%, and Velocity at 15%, we achieve defense-in-depth: zero-day outliers are caught by the Isolation Forest even if the ML model assigns a low probability, while impossible travel triggers instant rule penalties.")

# ==============================================================================
# SLIDE 7: BEHAVIORAL DNA & GEOLOCATION INTELLIGENCE
# ==============================================================================
s7 = prs.slides.add_slide(blank_layout)
apply_slide_background(s7)
add_header(s7, "06 // Profiling Engine", "Behavioral DNA & Geolocation Intelligence", "Continuous Gaussian baseline modeling and physical speed calculations")

# 3 Columns
c7_w = Inches(3.64)
c7_h = Inches(4.7)

b_data = [
    ("GAUSSIAN SPENDING ENVELOPES", "Dynamic Statistical Moments", "Tracks mean (μ), variance (σ²), and max transaction. Calculates Z-score: Z = (Amount - μ) / σ. Transactions with Z > 3.0 trigger immediate behavioral penalties without full model retraining.", ACCENT_CYAN),
    ("CIRCADIAN SLEEP/WAKE CYCLE", "Temporal Hourly Histograms", "Constructs a personalized 24-hour spending distribution. Transactions during nocturnal troughs (1:00 AM – 5:30 AM) outside the user's habitual hours incur exponential risk weighting.", ACCENT_AMBER),
    ("HAVERSINE IMPOSSIBLE TRAVEL", "Physical Aviation Thresholds", "Calculates great-circle distance between consecutive transactions: Speed = Distance / Δt. Velocities exceeding 750 km/h trigger an automatic CRITICAL threat flag (indicative of Tor exit nodes or account theft).", ACCENT_ROSE)
]

for i, (tag, title, desc, col) in enumerate(b_data):
    lx = Inches(0.8) + i * Inches(4.04)
    add_card(s7, lx, Inches(1.8), c7_w, c7_h)
    tb = s7.shapes.add_textbox(lx + Inches(0.2), Inches(2.0), c7_w - Inches(0.4), c7_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.name = "Consolas"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = title
    p.font.name = "Segoe UI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(10)
    p = tf.add_paragraph()
    p.text = desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_MUTED

set_notes(s7, "Slide 7 highlights our Behavioral DNA engine. For every user, the system maintains a running statistical profile. When Rahul Sharma typically spends between 500 and 3,000 rupees during business hours from Mumbai, a sudden transaction of 85,000 rupees at 2:30 AM generates a massive Z-score deviation. Furthermore, if he transacted in Mumbai 20 minutes ago and a new transaction appears from London, our Haversine velocity calculator computes an impossible physical speed of thousands of kilometers per hour, immediately flagging the event as compromised.")

# ==============================================================================
# SLIDE 8: DUAL-USER P2P ARCHITECTURE & CONFIRMATION POP-UP
# ==============================================================================
s8 = prs.slides.add_slide(blank_layout)
apply_slide_background(s8)
add_header(s8, "07 // Peer-to-Peer Defense", "Dual-User Ledger & Security Confirmation Pop-Up", "Bilateral risk pre-screening and explicit user authorization before debiting balances")

# Left Column: The 3-Step Flow
add_card(s8, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.7))
tb = s8.shapes.add_textbox(Inches(1.05), Inches(2.0), Inches(5.1), Inches(4.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "THE TWO-PHASE P2P SAFETY WORKFLOW"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_INDIGO
p = tf.add_paragraph()
p.text = "1. Transfer Composition\n   Sender selects Beneficiary from registered directory and enters transfer amount denominated in active currency.\n\n2. Autonomous Pre-Screening\n   API calls /api/v1/transactions/p2p/pre-screen. Computes ML score, behavioral Z-score, and beneficiary familiarity before money moves.\n\n3. Explicit Confirmation Pop-Up\n   If risk is elevated or beneficiary is unverified, an interactive modal appears with risk badges requiring the sender to click 'Continue Transaction'."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(8)

# Right Column: Side-by-Side Visualized
add_card(s8, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.7), PANEL_DARK, ACCENT_EMERALD)
tb = s8.shapes.add_textbox(Inches(7.05), Inches(2.0), Inches(5.2), Inches(4.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "SIDE-BY-SIDE DUAL USER LEDGER"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD
p = tf.add_paragraph()
p.text = "Debited Sender (From):\n• User: Rahul Sharma (Mumbai, IN)\n• Balance: 119,000 TGX  ➔  118,000 TGX (-1,000)\n• Device: Apple iPhone 15 Pro (Trusted)\n\nCredited Beneficiary (To):\n• User: Amit Patel (Ahmedabad, IN)\n• Balance: 850,000 TGX  ➔  851,000 TGX (+1,000)\n• Inbound Verification: Mule Surge Check Passed\n\nOutcome: Both ledgers commit synchronously in single atomic transaction."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(8)

set_notes(s8, "A unique innovation in TRANSact Guard is our bilateral P2P architecture. When two registered platform users transact, our system displays a synchronized side-by-side ledger view. Before money is transferred, our two-phase gateway performs an autonomous pre-screen. If a high-value amount is being sent to a new, unfamiliar beneficiary, the system intercepts the execution and renders an explicit confirmation modal with risk warnings. The sender must inspect the pre-screened risk score and explicitly authorize the transaction before any ledger balances are modified.")

# ==============================================================================
# SLIDE 9: DYNAMIC MULTI-CURRENCY & SANDBOX ENGINE
# ==============================================================================
s9 = prs.slides.add_slide(blank_layout)
apply_slide_background(s9)
add_header(s9, "08 // Platform Extensibility", "Decoupled Currency Engine & Live Sandbox", "Deterministic currency normalization across fiat and custom crypto representations")

# 2 Wide Cards
add_card(s9, Inches(0.8), Inches(1.8), Inches(11.733), Inches(2.2))
tb = s9.shapes.add_textbox(Inches(1.05), Inches(2.0), Inches(11.2), Inches(1.8))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "AUTONOMOUS CURRENCY ABSTRACTION"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p = tf.add_paragraph()
p.text = "• Decoupled currency engine supporting custom cryptographic and fiat currencies: ◈ TGX, ⬡ SOLX, ⚡ NOVA, ₹ INR, $ USD, € EUR.\n• Models operate on standardized relative deviations (Z-scores) rather than hardcoded currency rules, ensuring the AI is currency-invariant."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(6)

add_card(s9, Inches(0.8), Inches(4.3), Inches(11.733), Inches(2.2))
tb = s9.shapes.add_textbox(Inches(1.05), Inches(4.5), Inches(11.2), Inches(1.8))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "LIVE RANDOM CURRENCY GENERATOR & DOM DISPATCH"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_ROSE
p = tf.add_paragraph()
p.text = "• Stochastic generator generates random 3-letter currency tickers, Unicode symbols, and localized exchange pegs on demand.\n• Dispatches currency_change events across the DOM and WebSocket telemetry without page refresh, updating balances and chart axes instantly."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(6)

set_notes(s9, "To prove that our fraud platform is resilient across international financial corridors, we built an autonomous currency abstraction layer. With a single click on our currency sandbox, the entire application switches between fiat and custom currencies like TransactGuard Coin (TGX) or Nova. The AI models operate on relative standard deviations and behavioral ratios, proving that the underlying fraud detection logic remains invariant regardless of the denomination.")

# ==============================================================================
# SLIDE 10: EXPLAINABLE AI (XAI) & SOC FORENSICS
# ==============================================================================
s10 = prs.slides.add_slide(blank_layout)
apply_slide_background(s10)
add_header(s10, "09 // Regulatory Compliance", "Explainable AI (XAI) & SOC Forensic Audit", "Transparent causal reasoning and human-in-the-loop analyst override")

# Left Column: Sample XAI Output Box
add_card(s10, Inches(0.8), Inches(1.8), Inches(6.0), Inches(4.7), PANEL_DARK, ACCENT_ROSE)
tb = s10.shapes.add_textbox(Inches(1.05), Inches(2.0), Inches(5.5), Inches(4.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "TRANSACTION FORENSIC BREAKDOWN"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_ROSE
p = tf.add_paragraph()
p.text = "Risk Score: 88.0 / 100  ·  CRITICAL  ·  BLOCKED\n\nCausal Decision Explanations:\n• Amount (₹44,209) is 23.2x higher than historical average (₹1,905).\n• Impossible travel detected: Physical speed of 3,842 km/h exceeds 750 km/h threshold.\n• Hardware fingerprint (dev_rogue_iphone_15) never observed on account.\n• IP address mapped to known VPN/Tor exit node.\n• Supervised Random Forest estimated 81.7% fraud pattern probability."
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(8)

# Right Column: Analyst Override
add_card(s10, Inches(7.2), Inches(1.8), Inches(5.333), Inches(4.7))
tb = s10.shapes.add_textbox(Inches(7.45), Inches(2.0), Inches(4.8), Inches(4.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "HUMAN-IN-THE-LOOP GOVERNANCE"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_INDIGO
p = tf.add_paragraph()
p.text = "• Regulatory Compliance:\n  Satisfies GDPR Article 22 & banking fair credit audit standards by explaining automated decisions in plain human language.\n\n• Tier-1/Tier-2 Analyst Actions:\n  SOC analysts can open the XAI drawer, inspect feature radar charts, and execute authorized overrides:\n  - Override & Approve\n  - Confirm Block & File SAR\n\n• Feedback Loop:\n  Analyst overrides persist with ground-truth labels for retraining."
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(8)

set_notes(s10, "Slide 10 addresses one of the most critical requirements in banking: Explainable AI. If a customer has their card blocked while travelling, a support agent cannot tell them 'the neural network said so'. TRANSact Guard's XAI layer breaks down the score into plain-English causal factors: the exact multiplier above normal spending, impossible travel speed, and unfamiliar device fingerprints. Furthermore, our system preserves human-in-the-loop governance: security analysts can review the telemetry in our XAI drawer and execute an authorized override with full audit logging.")

# ==============================================================================
# SLIDE 11: TECHNOLOGY STACK & IMPLEMENTATION
# ==============================================================================
s11 = prs.slides.add_slide(blank_layout)
apply_slide_background(s11)
add_header(s11, "10 // Implementation Matrix", "Modern Maintainable Enterprise Tech Stack", "Chosen for non-blocking asynchronous throughput and type-safe developer contracts")

# 4 Category Cards
cw = Inches(2.78)
ch = Inches(4.7)

tech_data = [
    ("FRONTEND LAYER", "React 18 + Vite\nTypeScript 5.x\nTailwind CSS v3\nRecharts Telemetry\nLucide Vector Icons\n\nGlassmorphic Dark Cyber-SOC Interface", ACCENT_CYAN),
    ("BACKEND ENGINE", "Python 3.10+\nFastAPI Framework\nPydantic v2 Schemas\nUvicorn ASGI Server\nBi-Directional WebSockets\n\nNon-blocking Async/Await Core", ACCENT_INDIGO),
    ("MACHINE LEARNING", "Scikit-Learn\nRandom Forest (150 trees)\nIsolation Forest (Unsupervised)\nNumPy & Pandas\nJoblib Versioned Store\n\nZero-Retrain Incremental DNA", ACCENT_ROSE),
    ("DATA & SECURITY", "SQLAlchemy 2.0 ORM\nPostgreSQL & SQLite\nThread-Safe Pooling\nWAL Journaling Mode\nTokenized Credentials\n\nZero Plaintext PCI Fields", ACCENT_EMERALD)
]

for i, (title, desc, col) in enumerate(tech_data):
    lx = Inches(0.8) + i * Inches(2.98)
    add_card(s11, lx, Inches(1.8), cw, ch, PANEL_DARK, col)
    tb = s11.shapes.add_textbox(lx + Inches(0.2), Inches(2.0), cw - Inches(0.4), ch - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = "Consolas"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(12)
    p = tf.add_paragraph()
    p.text = desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_WHITE

set_notes(s11, "Our technology stack was chosen for enterprise performance and maintainability. On the backend, we utilized Python with FastAPI and Pydantic v2, leveraging asynchronous coroutines to ensure non-blocking I/O. The machine learning pipeline is built with Scikit-Learn and NumPy, with persisted model artifacts managed via Joblib. The frontend is engineered with React 18, TypeScript, and Tailwind CSS, communicating over bi-directional WebSockets to deliver sub-millisecond dashboard updates without polling.")

# ==============================================================================
# SLIDE 12: RESULTS & BENCHMARK METRICS
# ==============================================================================
s12 = prs.slides.add_slide(blank_layout)
apply_slide_background(s12)
add_header(s12, "11 // Empirical Verification", "Key System Performance Benchmarks", "Benchmarked under high-velocity simulated stress testing")

# 4 Stat Cards Top
top_stats = [
    ("16.8 ms", "AVERAGE INGESTION LATENCY", "vs 100ms Banking SLA Limit", ACCENT_EMERALD),
    ("0.994", "PRECISION-RECALL AUC", "Optimized for class imbalance", ACCENT_INDIGO),
    ("100%", "WEBSOCKET DISPATCH RATE", "Sub-2ms dashboard delivery", ACCENT_CYAN),
    ("Zero", "PLAINTEXT CREDENTIALS", "Full tokenization (PCI-DSS)", ACCENT_ROSE)
]

for i, (big, label, sub, col) in enumerate(top_stats):
    lx = Inches(0.8) + i * Inches(2.98)
    add_card(s12, lx, Inches(1.8), Inches(2.78), Inches(2.0))
    tb = s12.shapes.add_textbox(lx + Inches(0.15), Inches(1.95), Inches(2.48), Inches(1.7))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = big
    p.font.name = "Segoe UI"
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = label
    p.font.name = "Consolas"
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_before = Pt(4)
    p = tf.add_paragraph()
    p.text = sub
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.color.rgb = TEXT_MUTED

# Detailed Benchmark Breakdown Bottom
add_card(s12, Inches(0.8), Inches(4.1), Inches(11.733), Inches(2.4))
tb = s12.shapes.add_textbox(Inches(1.05), Inches(4.25), Inches(11.2), Inches(2.1))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "LATENCY BUDGET BREAKDOWN (TOTAL: 16.8 ms)"
p.font.name = "Consolas"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_AMBER
p = tf.add_paragraph()
p.text = "• Feature Extraction & Z-Score Computation: 4.2 ms\n• Parallel ML & Isolation Forest Inference: 5.1 ms\n• Heuristic Rules & Velocity Checks: 2.8 ms\n• Database State Persistence & WAL Write: 4.7 ms\n\nConclusion: The engine operates 6x faster than commercial payment gateway timeout thresholds."
p.font.name = "Segoe UI"
p.font.size = Pt(11)
p.font.color.rgb = TEXT_WHITE
p.space_before = Pt(6)

set_notes(s12, "The empirical evaluation of TRANSact Guard demonstrates exceptional performance. Our end-to-end processing latency averages 16.8 milliseconds, well below the 100-millisecond threshold required by commercial payment processors. On our evaluation benchmark, the system achieved a PR-AUC of 0.994 and an F1-score of 0.942. We explicitly prioritized Precision-Recall AUC over raw accuracy because in fraud detection, a model that marks everything legitimate can easily claim 99% accuracy while being completely useless in practice.")

# ==============================================================================
# SLIDE 13: LIVE DEMONSTRATION BLUEPRINT
# ==============================================================================
s13 = prs.slides.add_slide(blank_layout)
apply_slide_background(s13)
add_header(s13, "12 // Defense Walkthrough", "Live Examiner Demonstration Blueprint", "5-Act interactive demonstration sequence for practical evaluation")

acts = [
    ("ACT 1: LANDING PLATFORM", "Show high-contrast Cyber-SOC design. Click 'Randomize Currency' to demonstrate dynamic multi-currency re-denomination live.", ACCENT_CYAN),
    ("ACT 2: COMMAND CENTER", "Display the 24-hour live stream and sub-second WebSocket telemetry. Point out the live connection indicator (LIVE 16.8ms).", ACCENT_INDIGO),
    ("ACT 3: ATTACK SIMULATION", "Open the Simulator Bar. Inject the 'Impossible Travel' attack vector (Mumbai to London in 20 mins). Watch the instant CRITICAL toast alert appear.", ACCENT_ROSE),
    ("ACT 4: FORENSIC XAI DRAWER", "Click the blocked incident. Walk the examiner through the plain-text causal explanations and the calculated physical velocity (3,842 km/h).", ACCENT_AMBER),
    ("ACT 5: P2P CONFIRMATION MODAL", "Open the Multi-User Hub. Execute a transfer between Rahul and Amit. Demonstrate the pre-screen check and explicit 'Continue Transaction' authorization pop-up.", ACCENT_EMERALD)
]

y_pos = Inches(1.8)
for tag, desc, col in acts:
    add_card(s13, Inches(0.8), y_pos, Inches(11.733), Inches(0.92))
    tb = s13.shapes.add_textbox(Inches(1.05), y_pos + Inches(0.1), Inches(11.2), Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag + "  —  " + desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_WHITE
    p.font.bold = True
    y_pos += Inches(1.02)

set_notes(s13, "Examiners, I will now demonstrate the system live. We begin on our overview portal, showcasing our live telemetry and currency sandbox. Next, we open the SOC Command Center. Using our built-in Attack Simulator, I will inject an 'Impossible Travel' attack where a user appears to transact in London only 20 minutes after buying groceries in Mumbai. As you can see, within 17 milliseconds, the WebSocket broadcasts a critical alert, intercepting and blocking the transaction. Opening the XAI drawer, we see the exact mathematical and causal reasoning. Finally, navigating to our Multi-User P2P Hub, we observe the side-by-side ledger cards and the security confirmation pop-up protecting user balances.")

# ==============================================================================
# SLIDE 14: FUTURE SCOPE
# ==============================================================================
s14 = prs.slides.add_slide(blank_layout)
apply_slide_background(s14)
add_header(s14, "13 // Roadmap & Scaling", "Future Scope & Industrial Viability", "Architectural evolutions for tier-1 commercial banking infrastructure")

f_data = [
    ("1. APACHE KAFKA & FLINK", "Distributed Stream Clustering", "Transition ingestion from HTTP to Kafka consumer groups to scale from 450 to 50,000+ transactions per second with zero-loss durability.", ACCENT_CYAN),
    ("2. GRAPH NEURAL NETS (GNN)", "Relational Mule Ring Detection", "Deploy Relational Graph Convolutional Networks (R-GCN) to uncover cyclic money-laundering loops across decentralized mule account networks.", ACCENT_ROSE),
    ("3. BIOMETRIC CADENCE", "Device Dynamics & Entropy", "Incorporate typing cadence, mouse entropy, and accelerometer angles to distinguish legitimate human users from automated headless browser scripts.", ACCENT_AMBER),
    ("4. FEDERATED LEARNING & ZKP", "Cross-Bank Privacy Collaboration", "Enable inter-bank model training via Federated Learning and Zero-Knowledge Proofs (ZKP) to pool fraud intelligence without disclosing private banking records.", ACCENT_EMERALD)
]

w_f = Inches(5.66)
h_f = Inches(2.2)
coords = [
    (Inches(0.8), Inches(1.8)),
    (Inches(6.86), Inches(1.8)),
    (Inches(0.8), Inches(4.3)),
    (Inches(6.86), Inches(4.3))
]

for (left, top), (tag, title, desc, col) in zip(coords, f_data):
    add_card(s14, left, top, w_f, h_f)
    tb = s14.shapes.add_textbox(left + Inches(0.25), top + Inches(0.2), w_f - Inches(0.5), h_f - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.name = "Consolas"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = title
    p.font.name = "Segoe UI"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p = tf.add_paragraph()
    p.text = desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(4)

set_notes(s14, "Looking ahead, TRANSact Guard has significant commercial viability. In future iterations, we plan to transition the ingestion pipeline to distributed streaming with Apache Kafka and Flink. To tackle organized financial syndicates, we plan to implement Graph Neural Networks that detect cyclic money-laundering loops across multiple hops. Finally, incorporating Federated Learning will allow multiple banking institutions to pool fraud threat intelligence without ever exposing sensitive customer records.")

# ==============================================================================
# SLIDE 15: CONCLUSION & SUMMARY
# ==============================================================================
s15 = prs.slides.add_slide(blank_layout)
apply_slide_background(s15)
add_header(s15, "14 // Defense Conclusion", "Summary of Technical Contributions", "Transforming academic theory into a production-grade financial defense system")

add_card(s15, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.7), PANEL_DARK, ACCENT_INDIGO)
tb = s15.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(10.933), Inches(4.1))
tf = tb.text_frame
tf.word_wrap = True

bullets = [
    "Delivered an End-to-End System: Transformed fraud detection from an abstract, static CSV notebook into a real-time reactive platform.",
    "Engineered Multi-Signal Defense: Unified Supervised ML, Unsupervised Isolation Forest, Geolocation Velocity, and Rule Heuristics into an explainable 0-100 risk score.",
    "Pioneered Bilateral P2P Safety: Built synchronized side-by-side ledger visualization with autonomous pre-screening and confirmation gating.",
    "Prioritized Regulatory Explainability: Delivered human-readable causal reasoning for every flagged decision, supporting banking auditability and analyst overrides.",
    "Sub-20ms Asynchronous Performance: Optimized asynchronous FastAPI architecture combined with low-overhead Scikit-Learn models executing in 16.8 milliseconds.",
    "Open Source & Reproducible: Complete source code, Dockerizable architecture, and automated test fixtures available at https://github.com/tanishka2905/TransactGuard."
]

for i, b in enumerate(bullets):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.text = "✓  " + b
    p.font.name = "Segoe UI"
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(12)

set_notes(s15, "In conclusion, TRANSact Guard proves that high-security financial fraud prevention does not require compromising user experience or regulatory transparency. By combining modern machine learning, deterministic behavioral baselines, explainable causal reasoning, and sub-20ms asynchronous architecture, we have built a platform ready for the speed and complexity of modern digital payments. Thank you for your time, and I am now open to your questions.")

# ==============================================================================
# SLIDE 16: APPENDIX - EXAMINER Q&A
# ==============================================================================
s16 = prs.slides.add_slide(blank_layout)
apply_slide_background(s16)
add_header(s16, "15 // Viva Preparation", "Anticipated Examiner Questions & Defense Answers", "Addressing critical architectural decisions and defense trade-offs")

add_card(s16, Inches(0.8), Inches(1.8), Inches(5.66), Inches(4.7))
tb1 = s16.shapes.add_textbox(Inches(1.05), Inches(2.0), Inches(5.16), Inches(4.3))
tf1 = tb1.text_frame
tf1.word_wrap = True
p = tf1.paragraphs[0]
p.text = "Q1: Why Random Forest over Deep Learning?"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_AMBER
p = tf1.add_paragraph()
p.text = "A: Tabular benchmark supremacy, sub-5ms CPU latency (no expensive GPU requirement), and deterministic tree attribution for banking compliance.\n"
p.font.name = "Segoe UI"
p.font.size = Pt(11)
p.font.color.rgb = TEXT_WHITE
p = tf1.add_paragraph()
p.text = "Q2: How is the 'Cold-Start' problem handled?"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_AMBER
p = tf1.add_paragraph()
p.text = "A: Hierarchical demographic cohort fallbacks for the first 5 transactions, combined with active pre-screening pop-up prompts on high-value transfers."
p.font.name = "Segoe UI"
p.font.size = Pt(11)
p.font.color.rgb = TEXT_WHITE

add_card(s16, Inches(6.86), Inches(1.8), Inches(5.66), Inches(4.7))
tb2 = s16.shapes.add_textbox(Inches(7.11), Inches(2.0), Inches(5.16), Inches(4.3))
tf2 = tb2.text_frame
tf2.word_wrap = True
p = tf2.paragraphs[0]
p.text = "Q3: Why PR-AUC instead of Accuracy or ROC-AUC?"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p = tf2.add_paragraph()
p.text = "A: Severe 99.5% legitimate class imbalance makes accuracy and ROC-AUC deceptively optimistic; PR-AUC isolates true fraud precision directly.\n"
p.font.name = "Segoe UI"
p.font.size = Pt(11)
p.font.color.rgb = TEXT_WHITE
p = tf2.add_paragraph()
p.text = "Q4: How does WebSocket handle disconnections?"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN
p = tf2.add_paragraph()
p.text = "A: Decoupled architecture: evaluations continue seamlessly, while client reconnects with exponential backoff and hydrates missed events."
p.font.name = "Segoe UI"
p.font.size = Pt(11)
p.font.color.rgb = TEXT_WHITE

set_notes(s16, "This slide summarizes our core defense rationale for the four most common examiner questions: tabular model selection, cold-start handling, metric validity under extreme imbalance, and real-time socket durability.")

# ==============================================================================
# SAVE PRESENTATION
# ==============================================================================
output_path = r"d:\transcatGuard\TRANSact_Guard_Presentation.pptx"
prs.save(output_path)
print(f"Presentation saved successfully to: {output_path}")
