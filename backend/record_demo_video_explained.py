import time
import os
import io
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio
from playwright.sync_api import sync_playwright

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE_URL = "http://localhost:5174"
OUTPUT_MP4 = r"d:\transcatGuard\TRANSact_Guard_Demo_Video.mp4"

CYAN = (56, 189, 248)
GOLD = (250, 204, 21)
ROSE = (244, 63, 94)
EMERALD = (52, 211, 153)
WHITE = (248, 250, 252)
MUTED = (203, 213, 225)
BOX_BG = (10, 15, 29, 245)
BORDER_COLOR = (56, 189, 248, 220)

try:
    FONT_HEAD = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 23)
    FONT_SUBHEAD = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 19)
    FONT_TEXT = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 17)
    FONT_MONO = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 16)
    FONT_BIG = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 36)
except Exception:
    FONT_HEAD = ImageFont.load_default()
    FONT_SUBHEAD = ImageFont.load_default()
    FONT_TEXT = ImageFont.load_default()
    FONT_MONO = ImageFont.load_default()
    FONT_BIG = ImageFont.load_default()

def draw_mouse_pointer(draw, x, y, clicking=False, click_radius=16):
    """Draws a bright cursor with outline and click ripple."""
    if clicking:
        # Expanding glowing ring
        draw.ellipse((x - click_radius, y - click_radius, x + click_radius, y + click_radius),
                     outline=GOLD, width=3)
    
    # Standard cursor arrow polygon
    pts = [
        (x, y),
        (x, y + 26),
        (x + 7, y + 20),
        (x + 14, y + 30),
        (x + 19, y + 27),
        (x + 12, y + 17),
        (x + 20, y + 17)
    ]
    fill_col = GOLD if clicking else (255, 255, 255)
    draw.polygon(pts, fill=fill_col, outline=(0, 0, 0))

def stamp_explainer(pil_img, step_num, step_title, non_coder_explanation, takeaway, cursor_pos=(960, 540), is_clicking=False, click_r=16):
    """Stamps a crystal-clear, non-coder friendly explainer box and mouse pointer."""
    overlay = pil_img.convert("RGBA")
    draw = ImageDraw.Draw(overlay)
    width, height = overlay.size

    # --- TOP BRAND / STATUS BAR ---
    draw.rounded_rectangle((40, 20, 840, 72), radius=14, fill=(10, 15, 29, 235), outline=(56, 189, 248, 160), width=1)
    draw.text((60, 32), "TRANSact GUARD v3.0", fill=CYAN, font=FONT_HEAD)
    draw.text((330, 36), "•  LIVE SYSTEM DEMONSTRATION & DEFENSE", fill=WHITE, font=FONT_TEXT)
    draw.rounded_rectangle((735, 30, 825, 62), radius=6, fill=(16, 185, 129, 45), outline=EMERALD, width=1)
    draw.text((745, 36), "ACTIVE", fill=EMERALD, font=FONT_MONO)

    # --- PROMINENT EXPLAINER CARD (BOTTOM) ---
    card_h = 135
    card_box = (40, height - card_h - 20, width - 40, height - 20)
    draw.rounded_rectangle(card_box, radius=18, fill=BOX_BG, outline=BORDER_COLOR, width=2)

    # Step tag
    draw.rounded_rectangle((65, height - card_h - 6, 210, height - card_h + 30), radius=8, fill=(56, 189, 248, 50), outline=CYAN, width=1)
    draw.text((80, height - card_h + 3), f"STEP {step_num}", fill=CYAN, font=FONT_MONO)

    # Title
    draw.text((230, height - card_h + 2), step_title, fill=WHITE, font=FONT_HEAD)

    # Non-coder simple language explanation
    draw.text((65, height - card_h + 44), f"👉 WHAT WE ARE DOING:  {non_coder_explanation}", fill=WHITE, font=FONT_TEXT)

    # Practical takeaway
    draw.text((65, height - card_h + 80), f"💡 WHAT TO NOTICE:    {takeaway}", fill=GOLD, font=FONT_TEXT)

    # --- DRAW MOUSE CURSOR ---
    cx, cy = cursor_pos
    draw_mouse_pointer(draw, cx, cy, clicking=is_clicking, click_radius=click_r)

    return overlay.convert("RGB")

def record_explained_video():
    print("Recording Non-Coder Friendly System Demonstration Video...")
    writer = imageio.get_writer(OUTPUT_MP4, fps=24, codec="libx264", quality=8, macro_block_size=1)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=EDGE_PATH, headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        def animate_action(step_num, title, explanation, takeaway, start_cursor, end_cursor, click=False, stay_sec=3.0):
            print(f"Recording Step {step_num}: {title} ({stay_sec}s)")
            page.wait_for_timeout(300)
            img_bytes = page.screenshot()
            pil_img = Image.open(io.BytesIO(img_bytes))

            # Move cursor smoothly from start to end (over 12 frames = 0.5 sec)
            move_frames = 12
            for i in range(move_frames):
                alpha = i / float(move_frames)
                cur_x = int(start_cursor[0] + (end_cursor[0] - start_cursor[0]) * alpha)
                cur_y = int(start_cursor[1] + (end_cursor[1] - start_cursor[1]) * alpha)
                stamped = stamp_explainer(pil_img, step_num, title, explanation, takeaway, (cur_x, cur_y), is_clicking=False)
                writer.append_data(np.array(stamped))

            # Click ripple animation if click is True (over 8 frames)
            if click:
                for r in [10, 16, 22, 26, 30, 24, 16, 8]:
                    stamped = stamp_explainer(pil_img, step_num, title, explanation, takeaway, end_cursor, is_clicking=True, click_r=r)
                    writer.append_data(np.array(stamped))

            # Hold view for stay_sec
            stamped = stamp_explainer(pil_img, step_num, title, explanation, takeaway, end_cursor, is_clicking=False)
            hold_frames = int(stay_sec * 24)
            frame_arr = np.array(stamped)
            for _ in range(hold_frames):
                writer.append_data(frame_arr)

        # ---------------- 1. LANDING PLATFORM ----------------
        page.goto(BASE_URL)
        page.wait_for_timeout(2000)
        animate_action(
            "01",
            "Platform Home: The Anti-Fraud Command Center",
            "This is TRANSact Guard. It continuously monitors live digital banking transfers to catch hackers and scammers.",
            "Look at the navigation tabs across the top. We will test every major security feature one by one.",
            start_cursor=(960, 500),
            end_cursor=(330, 42),
            click=False,
            stay_sec=3.0
        )

        # ---------------- 2. CLICK COMMAND CENTER ----------------
        cmd_btn = page.get_by_role("button", name="Command Center", exact=True)
        btn_box = cmd_btn.bounding_box() or {"x": 330, "y": 42, "width": 100, "height": 30}
        target_pt = (int(btn_box["x"] + btn_box["width"]/2), int(btn_box["y"] + btn_box["height"]/2))
        
        animate_action(
            "02",
            "Opening the Live Cyber-SOC Command Center",
            "We are clicking on 'Command Center' to view the real-time banking traffic dashboard.",
            "Watch our yellow cursor click the tab. The full live monitoring operations screen will load.",
            start_cursor=(330, 42),
            end_cursor=target_pt,
            click=True,
            stay_sec=1.5
        )
        cmd_btn.click()
        page.wait_for_timeout(1500)

        # ---------------- 3. COMMAND CENTER OVERVIEW ----------------
        animate_action(
            "03",
            "Live Analytics: Velocity Curves & Risk Donut",
            "The top charts show total transaction volume vs flagged anomalies, and risk breakdown (Low, Medium, Critical).",
            "Notice the active AI banner: Consensus Ensemble is currently guarding transactions with zero downtime.",
            start_cursor=target_pt,
            end_cursor=(600, 300),
            click=False,
            stay_sec=3.5
        )

        # ---------------- 4. SCROLL TO LIVE TABLE & INVESTIGATE RED ROW ----------------
        page.evaluate("window.scrollBy(0, 420)")
        page.wait_for_timeout(800)
        
        first_row = page.locator("tbody tr").first
        row_box = first_row.bounding_box() or {"x": 500, "y": 620, "width": 800, "height": 40}
        row_pt = (int(row_box["x"] + 400), int(row_box["y"] + 20))

        animate_action(
            "04",
            "Spotting a Suspicious Red Transaction in the Feed",
            "Look at the red row in the table below! The AI flagged this transfer as a CRITICAL threat.",
            "We are moving our mouse to click on this red transaction to open the forensic investigation report.",
            start_cursor=(600, 300),
            end_cursor=row_pt,
            click=True,
            stay_sec=2.0
        )
        first_row.click()
        page.wait_for_timeout(1500)

        # ---------------- 5. FORENSIC MODAL & IMPOSSIBLE TRAVEL SPEED ----------------
        animate_action(
            "05",
            "Investigating the Evidence: Synchronized Dual Ledgers",
            "The forensic window opened! It compares the Sender (Rahul Sharma) and the Receiver (Priya Nair) side-by-side.",
            "Look at the Risk Reason: 'Impossible travel detected: Implied transit speed of 7,915 km/h between consecutive transfers'!",
            start_cursor=row_pt,
            end_cursor=(600, 450),
            click=False,
            stay_sec=4.0
        )

        # ---------------- 6. OPEN WHAT-IF COUNTERFACTUAL SIMULATOR ----------------
        whatif_btn = page.locator("button:has-text('Open What-If Simulator')")
        if whatif_btn.count() > 0:
            btn_box = whatif_btn.bounding_box() or {"x": 1200, "y": 320, "width": 120, "height": 30}
            w_pt = (int(btn_box["x"] + btn_box["width"]/2), int(btn_box["y"] + btn_box["height"]/2))

            animate_action(
                "06",
                "Testing Hypotheses with the What-If Simulator",
                "Now we test our Explainable AI: 'What if Rahul was actually home and didn't travel at supersonic speed?'",
                "We are clicking 'Open What-If Simulator' to access interactive sensitivity controls.",
                start_cursor=(600, 450),
                end_cursor=w_pt,
                click=True,
                stay_sec=1.5
            )
            whatif_btn.click()
            page.wait_for_timeout(1000)

            # ---------------- 7. TOGGLE TRUSTED DEVICE & EXECUTE RECALCULATION ----------------
            exec_btn = page.locator("button:has-text('Execute Counterfactual Recalculation')")
            exec_box = exec_btn.bounding_box() or {"x": 500, "y": 550, "width": 200, "height": 35}
            exec_pt = (int(exec_box["x"] + exec_box["width"]/2), int(exec_box["y"] + exec_box["height"]/2))

            animate_action(
                "07",
                "Executing Real-Time What-If Recalculation",
                "We simulate a safe scenario: trusted device, zero velocity speed. Watch us click 'Execute Recalculation'.",
                "The AI will re-evaluate the transaction in milliseconds and check if the verdict changes.",
                start_cursor=w_pt,
                end_cursor=exec_pt,
                click=True,
                stay_sec=2.0
            )
            exec_btn.click()
            page.wait_for_timeout(2000)

            # ---------------- 8. DECISION FLIPPED TO APPROVED ----------------
            animate_action(
                "08",
                "Result: Decision Flipped from BLOCKED to APPROVED!",
                "Look at the new badge: 'DECISION FLIPPED'! The risk score plummeted by -70 points.",
                "This proves to customers and regulatory auditors exactly why a transaction was frozen and how to clear it.",
                start_cursor=exec_pt,
                end_cursor=(1000, 520),
                click=False,
                stay_sec=4.0
            )

        # ---------------- 9. ADAPTIVE FRICTION: VERIFY BIOMETRICS ----------------
        bio_btn = page.locator("button:has-text('Verify Biometrics')")
        if bio_btn.count() > 0:
            bio_box = bio_btn.bounding_box() or {"x": 220, "y": 800, "width": 140, "height": 30}
            bio_pt = (int(bio_box["x"] + bio_box["width"]/2), int(bio_box["y"] + bio_box["height"]/2))

            animate_action(
                "09",
                "Adaptive Friction: Seamless Biometric Verification",
                "Instead of frustrating real users with an outright block, the system offers Biometric TouchID or SMS OTP.",
                "Watch us click 'Verify Biometrics'. The user is authenticated and the transaction safely clears!",
                start_cursor=(1000, 520),
                end_cursor=bio_pt,
                click=True,
                stay_sec=3.5
            )
            bio_btn.click()
            page.wait_for_timeout(1500)

        # Close modal
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)

        # ---------------- 10. MODEL INTELLIGENCE TOURNAMENT ----------------
        page.evaluate("window.scrollTo(0, 0)")
        model_tab = page.get_by_role("button", name="Model Intelligence", exact=True)
        if model_tab.count() == 0:
            model_tab = page.locator("button:has-text('Model Intelligence')").first
        m_box = model_tab.bounding_box() or {"x": 900, "y": 42, "width": 120, "height": 30}
        m_pt = (int(m_box["x"] + m_box["width"]/2), int(m_box["y"] + m_box["height"]/2))

        animate_action(
            "10",
            "Model Intelligence: The 6-Algorithm AI Fleet",
            "Now we explore the machine learning core! We trained 6 distinct AI models on 20,000 real transaction samples.",
            "We are clicking on 'Model Intelligence' to view the live performance tournament leaderboard.",
            start_cursor=(220, 800),
            end_cursor=m_pt,
            click=True,
            stay_sec=1.5
        )
        model_tab.click()
        page.wait_for_timeout(1500)

        # ---------------- 11. INSPECT LIGHTGBM & PROMOTE CHAMPION ----------------
        page.wait_for_timeout(1000)
        make_champ_btn = page.locator("button:has-text('Make Champion')").first
        if make_champ_btn.count() > 0:
            l_box = make_champ_btn.bounding_box() or {"x": 450, "y": 320, "width": 120, "height": 30}
            l_pt = (int(l_box["x"] + l_box["width"]/2), int(l_box["y"] + l_box["height"]/2))
        else:
            l_pt = (450, 320)

        animate_action(
            "11",
            "LightGBM: 1.8ms Latency & 1-Click Champion Swap",
            "Look at LightGBM: It scores transactions in only 1.8 milliseconds (ideal for high-speed UPI/card payments).",
            "Watch us click 'Make Champion' to instantly promote LightGBM to run live production inference!",
            start_cursor=m_pt,
            end_cursor=l_pt,
            click=True,
            stay_sec=3.5
        )
        if make_champ_btn.count() > 0:
            make_champ_btn.click()
            page.wait_for_timeout(1500)

        # ---------------- 12. GRAPH INTELLIGENCE & MONEY MULES ----------------
        graph_tab = page.get_by_role("button", name="Graph Intelligence", exact=True)
        if graph_tab.count() == 0:
            graph_tab = page.locator("button:has-text('Graph Intelligence')").first
        g_box = graph_tab.bounding_box() or {"x": 470, "y": 42, "width": 120, "height": 30}
        g_pt = (int(g_box["x"] + g_box["width"]/2), int(g_box["y"] + g_box["height"]/2))

        animate_action(
            "12",
            "Graph Intelligence: Catching Money Laundering Rings",
            "Standard AI evaluates transactions alone. Our Graph Engine connects the dots between all users and devices.",
            "We are clicking 'Graph Intelligence' to view the interactive financial network topology.",
            start_cursor=l_pt,
            end_cursor=g_pt,
            click=True,
            stay_sec=1.5
        )
        graph_tab.click()
        page.wait_for_timeout(1500)

        # ---------------- 13. MULE HOTSPOTS & CIRCULAR LOOPS ----------------
        mules_tab = page.locator("button:has-text('Mule Hotspots')")
        mu_pt = g_pt
        if mules_tab.count() > 0:
            mu_box = mules_tab.bounding_box() or {"x": 800, "y": 140, "width": 100, "height": 30}
            mu_pt = (int(mu_box["x"] + mu_box["width"]/2), int(mu_box["y"] + mu_box["height"]/2))

            animate_action(
                "13",
                "Unmasking Money Mule Aggregators & Forensic Dossiers",
                "Look at Priya Nair: Flagged with a Mule Risk Score of 85! (4 inflows vs 1 outflow + circular wash trading loop).",
                "Mule aggregators collect deposits from compromised accounts and rapidly cash out. Our system tags them immediately.",
                start_cursor=g_pt,
                end_cursor=mu_pt,
                click=True,
                stay_sec=4.0
            )
            mules_tab.click()
            page.wait_for_timeout(1500)

        # ---------------- 14. CIRCULAR WASH CYCLES ----------------
        cycles_tab = page.locator("button:has-text('Circular Cycles')")
        if cycles_tab.count() > 0:
            cy_box = cycles_tab.bounding_box() or {"x": 950, "y": 140, "width": 100, "height": 30}
            cy_pt = (int(cy_box["x"] + cy_box["width"]/2), int(cy_box["y"] + cy_box["height"]/2))

            animate_action(
                "14",
                "Exposing Circular Wash Trading Loops (A -> B -> A)",
                "Criminals launder funds in loops to simulate volume and reset counters. Here the graph algorithm caught Priya <-> Rahul.",
                "Topological cycle search algorithms detect both 2-node and 3-node loops across millions of edges.",
                start_cursor=mu_pt,
                end_cursor=cy_pt,
                click=True,
                stay_sec=4.0
            )
            cycles_tab.click()
            page.wait_for_timeout(1500)

        # ---------------- 15. OUTRO SUMMARY ----------------
        outro_img = Image.new("RGB", (1920, 1080), color=(10, 15, 29))
        o_draw = ImageDraw.Draw(outro_img)
        
        # Center card
        o_draw.rounded_rectangle((220, 140, 1700, 940), radius=24, fill=(18, 26, 47), outline=(56, 189, 248), width=2)
        
        o_draw.text((280, 190), "TRANSact GUARD v3.0", fill=CYAN, font=FONT_BIG)
        o_draw.text((280, 260), "Autonomous Multi-Model Fraud Defense & Graph Intelligence Platform", fill=WHITE, font=FONT_HEAD)
        
        recap = [
            "✔ 6 Machine Learning Models (LightGBM, XGBoost, Random Forest, MLP, Ensemble) with real 1.8ms latency",
            "✔ Dual Unsupervised Anomaly Engine (Isolation Forest + Elliptic Envelope) catching zero-day threats",
            "✔ Explainable AI What-If Simulator: Real-time parameter testing with verified DECISION FLIP alerts",
            "✔ Adaptive Friction: Smart Biometric TouchID & OTP Step-Up challenges preventing false rejections",
            "✔ Topological Graph Intelligence: Catching circular wash cycles and money mule aggregators",
            "✔ Academic Project Defense by Tanishka Upadhyay (tanishka2905) | B.Tech Capstone Project",
            "✔ Open-Source GitHub Repository: https://github.com/tanishka2905/TransactGuard"
        ]
        
        y_pos = 340
        for line in recap:
            col = GOLD if "Candidate" in line or "6 Machine" in line else WHITE
            o_draw.text((280, y_pos), line, fill=col, font=FONT_TEXT)
            y_pos += 48
            
        o_frame = np.array(outro_img)
        for _ in range(24 * 6): # 6 seconds
            writer.append_data(o_frame)

        browser.close()

    writer.close()
    print(f"High-Quality Explained Video successfully generated at: {OUTPUT_MP4}")

if __name__ == "__main__":
    record_explained_video()
