import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = Path("Screenshot")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:5173"

def run():
    print("[Screenshot Generator] Launching browser engine...")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 950},
            device_scale_factor=1.25
        )
        page = context.new_page()

        # =============================================================
        # 1. Login and Registration Screen
        # =============================================================
        print("[1/8] Capturing 1_Login_and_Registration_Screen.png...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        time.sleep(1.5)
        page.screenshot(path=str(SCREENSHOT_DIR / "1_Login_and_Registration_Screen.png"), full_page=False)

        # =============================================================
        # 2. Citizen Dashboard Screen
        # =============================================================
        print("[2/8] Capturing 2_Citizen_Dashboard_Screen.png...")
        page.fill("input[type='email']", "citizen.anita@example.com")
        page.fill("input[type='password']", "CitizenPass123!")
        page.click("button[type='submit']")
        page.wait_for_url("**/citizen/dashboard", timeout=10000)
        time.sleep(2.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "2_Citizen_Dashboard_Screen.png"), full_page=False)

        # =============================================================
        # 3. Grievance Submission with Map Screen
        # =============================================================
        print("[3/8] Capturing 3_Grievance_Submission_with_Map_Screen.png...")
        page.goto(f"{BASE_URL}/citizen/complaints/new", wait_until="networkidle")
        time.sleep(1.5)

        title_input = page.wait_for_selector("input[placeholder*='Major drinking water'], input[type='text']")
        if title_input:
            title_input.fill("Severe drinking water pipeline rupture near Primary School")

        desc_input = page.query_selector("textarea[placeholder*='landmarks']")
        if desc_input:
            desc_input.fill("The 200mm PVC distribution pipeline has burst right in front of the Government Primary School gate. The street is flooded and children cannot safely enter. Urgent municipal repair required.")

        cat_select = page.query_selector("select")
        if cat_select:
            cat_select.select_option(index=1)

        loc_input = page.query_selector("input[placeholder*='Gandhi Road'], input[placeholder*='Ward']")
        if loc_input:
            loc_input.fill("Ward 14, Anna Nagar 2nd Main Road")

        # Scroll so map widget and coordinates are prominent
        map_elem = page.query_selector(".leaflet-container, #map")
        if map_elem:
            map_elem.scroll_into_view_if_needed()
            time.sleep(2.0)

        page.screenshot(path=str(SCREENSHOT_DIR / "3_Grievance_Submission_with_Map_Screen.png"), full_page=False)

        # =============================================================
        # 4. Public Tracking and Timeline Screen
        # =============================================================
        print("[4/8] Capturing 4_Public_Tracking_and_Timeline_Screen.png...")
        page.evaluate("() => localStorage.clear()")
        page.goto(f"{BASE_URL}/track", wait_until="networkidle")
        time.sleep(1.0)

        ref_input = page.wait_for_selector("input[placeholder*='CR-']")
        ref_input.fill("CR-20261025-D93X")

        phone_input = page.query_selector("input[placeholder*='3210']")
        if phone_input:
            phone_input.fill("3210")

        page.click("button[type='submit'], button:has-text('Track')")
        time.sleep(2.5)
        page.screenshot(path=str(SCREENSHOT_DIR / "4_Public_Tracking_and_Timeline_Screen.png"), full_page=False)

        # =============================================================
        # 5. Officer Queue Screen
        # =============================================================
        print("[5/8] Capturing 5_Officer_Queue_Screen.png...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        time.sleep(1.0)
        page.fill("input[type='email']", "water.officer@civicresolve.gov")
        page.fill("input[type='password']", "OfficerPass123!")
        page.click("button[type='submit']")
        page.wait_for_url("**/officer/**", timeout=10000)

        page.goto(f"{BASE_URL}/officer/complaints", wait_until="networkidle")
        time.sleep(2.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "5_Officer_Queue_Screen.png"), full_page=False)

        # =============================================================
        # 6. Priority Explanation and Override Screen
        # =============================================================
        print("[6/8] Capturing 6_Priority_Explanation_and_Override_Screen.png...")
        page.goto(f"{BASE_URL}/officer/complaints/1", wait_until="networkidle")
        time.sleep(2.0)

        override_btn = page.query_selector("button:has-text('Override')")
        if override_btn:
            override_btn.click()
            time.sleep(1.2)

        page.screenshot(path=str(SCREENSHOT_DIR / "6_Priority_Explanation_and_Override_Screen.png"), full_page=False)

        # =============================================================
        # 7. Administrator Rules and Simulation Screen
        # =============================================================
        print("[7/8] Capturing 7_Administrator_Rules_and_Simulation_Screen.png...")
        page.evaluate("() => localStorage.clear()")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        time.sleep(1.0)
        page.fill("input[type='email']", "admin@civicresolve.gov")
        page.fill("input[type='password']", "AdminPass123!")
        page.click("button[type='submit']")
        page.wait_for_url("**/admin/**", timeout=10000)

        page.goto(f"{BASE_URL}/admin/rules", wait_until="networkidle")
        time.sleep(2.0)

        eval_btn = page.query_selector("button:has-text('Run Evaluation')")
        if eval_btn:
            eval_btn.click()
            time.sleep(1.5)

        playground_card = page.query_selector("div:has-text('Interactive Rule Scoring Playground')")
        if playground_card:
            playground_card.scroll_into_view_if_needed()
            time.sleep(1.0)

        page.screenshot(path=str(SCREENSHOT_DIR / "7_Administrator_Rules_and_Simulation_Screen.png"), full_page=False)

        # =============================================================
        # 8. Analytics and CSV Export Screen
        # =============================================================
        print("[8/8] Capturing 8_Analytics_and_CSV_Export_Screen.png...")
        page.goto(f"{BASE_URL}/officer/analytics", wait_until="networkidle")
        time.sleep(3.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "8_Analytics_and_CSV_Export_Screen.png"), full_page=False)

        browser.close()
        print("\n[Screenshot Generator] All 8 screenshots captured successfully in Screenshot/ folder!")

if __name__ == "__main__":
    run()
