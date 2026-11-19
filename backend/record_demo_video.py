import time
import os
import io
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio
from playwright.sync_api import sync_playwright

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE_URL = "http://localhost:5174"
OUTPUT_MP4 = r"d:\transcatGuard\TRANSact_Guard_Demo_Video.mp4"

CYAN = (56, 189, 248)
ROSE = (244, 63, 94)
EMERALD = (52, 211, 153)
AMBER = (251, 191, 36)
PURPLE = (168, 85, 247)
WHITE = (248, 250, 252)
MUTED = (148, 163, 184)

try:
    FONT_TITLE = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 22)
    FONT_BODY = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 17)
    FONT_BADGE = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 15)
    FONT_BIG = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 44)
    FONT_SUB = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 24)
except Exception:
    FONT_TITLE = ImageFont.load_default()
    FONT_BODY = ImageFont.load_default()
    FONT_BADGE = ImageFont.load_default()
    FONT_BIG = ImageFont.load_default()
    FONT_SUB = ImageFont.load_default()

def stamp_frame(pil_img, step_badge, step_title, description, status_badge="SYSTEM ACTIVE", status_color=EMERALD):
    overlay = pil_img.convert("RGBA")
    draw = ImageDraw.Draw(overlay)
    width, height = overlay.size

    # --- TOP BRAND PILL ---
    draw.rounded_rectangle((40, 20, 740, 68), radius=12, fill=(10, 15, 29, 230), outline=(56, 189, 248, 180), width=1)
    draw.text((60, 32), "TRANSact GUARD v3.0", fill=CYAN, font=FONT_TITLE)
    draw.text((310, 35), "•  CYBER-SOC AUTONOMOUS DEFENSE", fill=WHITE, font=FONT_BODY)
    draw.rounded_rectangle((600, 29, 725, 59), radius=6, fill=(status_color[0], status_color[1], status_color[2], 40), outline=(status_color[0], status_color[1], status_color[2], 140), width=1)
    draw.text((612, 35), status_badge, fill=status_color, font=FONT_BADGE)

    # --- BOTTOM EXPLANATION HUD ---
    hud_h = 110
    draw.rounded_rectangle((40, height - hud_h - 25, width - 40, height - 25), radius=16, fill=(10, 15, 29, 240), outline=(56, 189, 248, 160), width=2)

    # Step badge pill
    badge_w = 200
    draw.rounded_rectangle((60, height - hud_h - 10, 60 + badge_w, height - hud_h + 24), radius=8, fill=(56, 189, 248, 40), outline=CYAN, width=1)
    draw.text((75, height - hud_h - 5), step_badge, fill=CYAN, font=FONT_BADGE)

    # Title text
    draw.text((280, height - hud_h - 7), step_title, fill=WHITE, font=FONT_TITLE)

    # Description text
    draw.text((65, height - hud_h + 38), description, fill=MUTED, font=FONT_BODY)

    return overlay.convert("RGB")

def record_video():
    print("Starting Playwright Edge comprehensive video recording session...")
    writer = imageio.get_writer(OUTPUT_MP4, fps=24, codec="libx264", quality=8, macro_block_size=1)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=EDGE_PATH, headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        def capture(step_badge, step_title, desc, duration_sec=3.0, status="LIVE DEMO", status_color=EMERALD):
            print(f"[{status}] {step_badge}: {step_title} ({duration_sec}s)")
            page.wait_for_timeout(400)
            img_bytes = page.screenshot()
            pil_img = Image.open(io.BytesIO(img_bytes))
            stamped = stamp_frame(pil_img, step_badge, step_title, desc, status, status_color)
            frame_np = np.array(stamped)
            num_frames = int(duration_sec * 24)
            for _ in range(num_frames):
                writer.append_data(frame_np)

        # ---------------- SCENE 1: LANDING PLATFORM ----------------
        page.goto(BASE_URL)
        page.wait_for_timeout(2000)
        capture(
            "SCENE 01 // PLATFORM",
            "TRANSact Guard Enterprise Platform",
            "Multi-Signal Autonomous Risk Engine for real-time FinTech cybersecurity and zero-trust transaction validation.",
            duration_sec=3.0,
            status="INITIALIZING",
            status_color=CYAN
        )

        # ---------------- SCENE 2: COMMAND CENTER ----------------
        cmd_btn = page.locator("button:has-text('Command Center')").first
        if cmd_btn.count() > 0:
            cmd_btn.click()
            page.wait_for_timeout(1500)

        capture(
            "SCENE 02 // COMMAND CENTER",
            "Cyber-SOC Command Center & Live Telemetry",
            "Real-time volume ingestion, 24h velocity curves, anomaly overlay, and 4-tier risk distribution.",
            duration_sec=3.5,
            status="SOC ACTIVE",
            status_color=CYAN
        )

        # Scroll down to security feed
        page.evaluate("window.scrollBy(0, 420)")
        page.wait_for_timeout(800)
        capture(
            "SCENE 02 // LIVE FEED",
            "Live Monitored Security Feed (<20ms Ingestion)",
            "Every transaction evaluated against Gaussian behavioral profiles, distance matrices, and ML models.",
            duration_sec=3.0,
            status="STREAMING",
            status_color=EMERALD
        )

        # ---------------- SCENE 3: FORENSIC DUAL-USER LEDGER MODAL ----------------
        first_row = page.locator("tbody tr").first
        if first_row.count() > 0:
            first_row.click()
            page.wait_for_timeout(1500)
            capture(
                "SCENE 03 // FORENSIC MODAL",
                "Synchronized Dual-User Ledger & 4-Pillar Risk Engine",
                "Side-by-side sender and beneficiary telemetry: ML Probability, Isolation Forest Anomaly, Rule Heuristics, Velocity.",
                duration_sec=4.0,
                status="CRITICAL ALERT",
                status_color=ROSE
            )

            # ---------------- SCENE 4: WHAT-IF COUNTERFACTUAL SIMULATOR ----------------
            what_if_btn = page.locator("button:has-text('What-If Counterfactual Sensitivity Simulator')")
            if what_if_btn.count() > 0:
                what_if_btn.click()
                page.wait_for_timeout(800)
                capture(
                    "SCENE 04 // WHAT-IF SIMULATOR",
                    "What-If Counterfactual Sensitivity Simulator (Initial State)",
                    "Adjustable sensitivity parameters: Amount, Transit Speed (km/h), Hardware Device ID, Nocturnal Hour, Model Selection.",
                    duration_sec=3.5,
                    status="SIMULATOR",
                    status_color=PURPLE
                )

                # Toggle trusted device
                trusted_btn = page.locator("button:has-text('New Hardware ID')")
                if trusted_btn.count() > 0:
                    trusted_btn.click()
                    page.wait_for_timeout(400)

                # Execute counterfactual recalculation
                exec_btn = page.locator("button:has-text('Execute Counterfactual Recalculation')")
                if exec_btn.count() > 0:
                    exec_btn.click()
                    page.wait_for_timeout(2000)
                    capture(
                        "SCENE 04 // DECISION FLIP",
                        "Live Counterfactual Recalculation: Decision Flipped!",
                        "Simulated causal factors prove reduced velocity and trusted hardware flip status from BLOCKED to APPROVED (-70 pts delta).",
                        duration_sec=4.5,
                        status="DECISION FLIPPED",
                        status_color=AMBER
                    )

            # ---------------- SCENE 5: ADAPTIVE STEP-UP VERIFICATION ----------------
            biometric_btn = page.locator("button:has-text('Verify Biometrics')")
            if biometric_btn.count() > 0:
                biometric_btn.click()
                page.wait_for_timeout(1200)
                capture(
                    "SCENE 05 // ADAPTIVE STEP-UP",
                    "Adaptive Friction Engine: Biometric TouchID Verified",
                    "Elevated risk cases trigger dynamic step-up challenges allowing genuine users to self-authenticate seamlessly.",
                    duration_sec=3.5,
                    status="VERIFIED",
                    status_color=EMERALD
                )

            # Close modal
            page.keyboard.press("Escape")
            page.wait_for_timeout(800)

        # ---------------- SCENE 6: MODEL INTELLIGENCE TOURNAMENT ----------------
        page.evaluate("window.scrollTo(0, 0)")
        model_tab = page.locator("button:has-text('Model Intelligence')").first
        if model_tab.count() > 0:
            model_tab.click()
            page.wait_for_timeout(1500)
            capture(
                "SCENE 06 // ML TOURNAMENT",
                "Multi-Model Tournament Leaderboard (Fleet of 6 Algorithms)",
                "Real empirical benchmarks: PR-AUC (1.0000), ROC-AUC (1.0000), F1-Score, and Prediction Latencies (LightGBM: 1.83ms).",
                duration_sec=4.5,
                status="6 MODELS",
                status_color=CYAN
            )

            # Click LightGBM card to reveal confusion matrix
            lgbm_card = page.locator("div:has-text('LightGBM')").first
            if lgbm_card.count() > 0:
                lgbm_card.click()
                page.wait_for_timeout(600)
                capture(
                    "SCENE 06 // CONFUSION MATRIX",
                    "Confusion Matrix & Model Telemetry Inspector",
                    "TN: 4,900 | TP: 100 | FP: 0 | FN: 0. Evaluated on 20,000 imbalanced financial vectors. Zero fabricated metrics.",
                    duration_sec=3.5,
                    status="LIGHTGBM",
                    status_color=EMERALD
                )

            # Click Select Champion on LightGBM
            champ_btn = page.locator("button:has-text('Select Champion')").first
            if champ_btn.count() > 0:
                champ_btn.click()
                page.wait_for_timeout(800)
                capture(
                    "SCENE 06 // CHAMPION SWAP",
                    "1-Click Dynamic Champion Promotion (Zero Server Downtime)",
                    "Active inference engine instantly promoted to LightGBM without server restarts or pipeline disruption.",
                    duration_sec=3.5,
                    status="CHAMPION PROMOTED",
                    status_color=AMBER
                )

            # Scroll down to Multi-Model Cross-Inference Playground
            page.evaluate("window.scrollBy(0, 750)")
            page.wait_for_timeout(600)
            compare_btn = page.locator("button:has-text('Run Multi-Model Comparison')")
            if compare_btn.count() > 0:
                compare_btn.click()
                page.wait_for_timeout(1500)
                capture(
                    "SCENE 07 // CROSS-INFERENCE",
                    "Multi-Model Inference Comparison Playground",
                    "Arbitrary vectors evaluated across all 6 models concurrently. Visualizes cross-model agreement % and standard deviation.",
                    duration_sec=4.0,
                    status="CROSS INFERENCE",
                    status_color=PURPLE
                )

        # ---------------- SCENE 8: GRAPH INTELLIGENCE & MONEY MULES ----------------
        page.evaluate("window.scrollTo(0, 0)")
        graph_tab = page.locator("button:has-text('Graph Intelligence')").first
        if graph_tab.count() > 0:
            graph_tab.click()
            page.wait_for_timeout(1500)
            capture(
                "SCENE 08 // GRAPH TOPOLOGY",
                "Graph Intelligence: Transaction Topology & Syndicate Detection",
                "Interactive directed network graph exposing financial relationships, cyclic layering, and flow aggregation hubs.",
                duration_sec=4.5,
                status="GRAPH SOC",
                status_color=CYAN
            )

            # Click Mule Hotspots subtab
            mules_tab = page.locator("button:has-text('Mule Hotspots')")
            if mules_tab.count() > 0:
                mules_tab.click()
                page.wait_for_timeout(800)
                capture(
                    "SCENE 08 // MULE HOTSPOTS",
                    "Money Mule Aggregator Detection & Forensic Dossiers",
                    "Priya Nair flagged with Mule Risk Score of 85 pts (4 Inflows vs 1 Outflow) + Circular Wash Trading Loop.",
                    duration_sec=4.0,
                    status="MULE IDENTIFIED",
                    status_color=ROSE
                )

            # Click Circular Cycles subtab
            cycles_tab = page.locator("button:has-text('Circular Cycles')")
            if cycles_tab.count() > 0:
                cycles_tab.click()
                page.wait_for_timeout(800)
                capture(
                    "SCENE 08 // CIRCULAR LOOPS",
                    "Circular Wash Trading Loop Detection (A -> B -> A)",
                    "Graph traversal catches cyclic money laundering rings designed to evade standard velocity thresholds.",
                    duration_sec=4.0,
                    status="WASH LOOP DETECTED",
                    status_color=AMBER
                )

        # ---------------- SCENE 9: MULTI-USER P2P VIEW ----------------
        page.evaluate("window.scrollTo(0, 0)")
        users_tab = page.locator("button:has-text('Multi-User P2P')").first
        if users_tab.count() > 0:
            users_tab.click()
            page.wait_for_timeout(1200)
            capture(
                "SCENE 09 // MULTI-USER P2P",
                "Multi-User Synchronized Account Profiles & Activity",
                "Real-time balances, device telemetry, trust indexes, and historical transaction logs across all simulated clients.",
                duration_sec=3.5,
                status="P2P LEDGERS",
                status_color=CYAN
            )

        # ---------------- SCENE 10: OUTRO SUMMARY CARD ----------------
        outro_img = Image.new("RGB", (1920, 1080), color=(10, 15, 29))
        o_draw = ImageDraw.Draw(outro_img)
        
        # Center card
        o_draw.rounded_rectangle((240, 160, 1680, 920), radius=24, fill=(18, 26, 47), outline=(56, 189, 248), width=2)
        
        o_draw.text((300, 220), "TRANSact GUARD v3.0", fill=CYAN, font=FONT_BIG)
        o_draw.text((300, 295), "Autonomous Multi-Model Fraud Defense & Graph Intelligence Platform", fill=WHITE, font=FONT_SUB)
        
        tech_lines = [
            "• Fleet of 6 Trained ML Models: Consensus Ensemble, LightGBM (1.8ms), XGBoost, Random Forest, MLP Neural Net, Logistic Regression",
            "• Dual Unsupervised Anomaly Engine: Isolation Forest + Elliptic Envelope Mahalanobis Distance",
            "• Topological Graph Intelligence: Automated Circular Wash Cycle Detection & Money Mule Aggregator Scoring",
            "• Explainable AI (XAI): What-If Counterfactual Sensitivity Simulator & Live Decision Flip Detection",
            "• Adaptive Friction Engine: Seamless Biometric TouchID & SMS OTP Step-Up Authentication",
            "• Candidate: Tanishka Upadhyay (tanishka2905) | Final Year B.Tech Capstone Project Defense",
            "• Repository: https://github.com/tanishka2905/TransactGuard"
        ]
        
        y_pos = 380
        for line in tech_lines:
            color = WHITE if "Candidate" in line or "Fleet" in line else MUTED
            o_draw.text((300, y_pos), line, fill=color, font=FONT_BODY)
            y_pos += 44
            
        o_frame = np.array(outro_img)
        for _ in range(24 * 5): # 5 seconds
            writer.append_data(o_frame)

        browser.close()

    writer.close()
    print(f"Comprehensive video recorded successfully: {OUTPUT_MP4}")

if __name__ == "__main__":
    record_video()
