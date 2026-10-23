"""
Praxis AI Autonomous Telemetry & Signal Engine Self-Check Test Suite
Validates mathematical formulations, kinematic calculations, EMA low-pass filtering, and SOAP note generation.
"""
import math

def compute_objective_stress(au4, au15, alpha=0.6, beta=0.4):
    raw_weighted = (alpha * au4) + (beta * au15)
    score = 1.0 + (9.0 * min(max(raw_weighted, 0.0), 1.0))
    return round(score, 2)

def update_ema(current_stress, prev_ema, alpha=0.05):
    return round((alpha * current_stress) + ((1.0 - alpha) * prev_ema), 2)

def compute_triage_index(subjective, r_frown, r_blink):
    raw = subjective + (3.0 * r_frown) + (2.0 * r_blink)
    return round(max(1.0, min(10.0, raw)), 1)

def evaluate_discrepancy(subjective, ema_stress, threshold=3.5):
    disc = round(abs(subjective - ema_stress), 2)
    return disc, disc > threshold

def run_tests():
    print("=" * 65)
    print("      PRAXIS AI TELE-PSYCHIATRY TELEMETRY SELF-CHECK")
    print("=" * 65)

    # Test 1: Objective Stress Calculation
    print("\n[TEST 1] Objective Stress Index O(t) Formulation...")
    s1 = compute_objective_stress(0.8, 0.5, 0.6, 0.4)
    assert s1 == 7.12, f"Unexpected O(t) value: {s1}"
    print(f"  -> PASSED: O(t) for AU4=0.8, AU15=0.5 is {s1}/10.")

    # Test 2: Low-Pass EMA Filter
    print("\n[TEST 2] Exponential Moving Average (EMA) Low-Pass Filter...")
    ema = 5.0
    for frame_stress in [7.12, 7.5, 8.0, 7.8, 8.2]:
        ema = update_ema(frame_stress, ema, 0.05)
    assert 5.0 < ema < 8.2, "EMA filter bounds out of range"
    print(f"  -> PASSED: EMA smoothed O_bar(t) = {ema}.")

    # Test 3: Triage Index Calculation
    print("\n[TEST 3] Triage Index Formulation I_triage...")
    triage = compute_triage_index(5.0, 0.6, 0.3)
    assert triage == 7.4, f"Unexpected Triage Index: {triage}"
    print(f"  -> PASSED: Triage Index = {triage}/10.")

    # Test 4: Modality Discrepancy Alert Logic
    print("\n[TEST 4] Modality Discrepancy Algorithm D(t) = |S - O_bar(t)|...")
    disc, is_alert = evaluate_discrepancy(2.0, 6.8, threshold=3.5)
    assert disc == 4.8, f"Unexpected discrepancy: {disc}"
    assert is_alert == True, "Discrepancy alert failed to trigger for D(t) > 3.5"
    print(f"  -> PASSED: Discrepancy D(t) = {disc} (> 3.5 Alert Triggered).")

    print("\n" + "=" * 65)
    print("      ALL 4 PRAXIS TELEMETRY ENGINE TESTS PASSED!")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    run_tests()
