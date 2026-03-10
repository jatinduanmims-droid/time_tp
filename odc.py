import re
import json
import os

LOG_FILE = "fx_log.log"
SYMBOL_FILE = "FXsymbol.list"
STATE_FILE = "fx_state.json"

START_MARKER = "ODCDataLoader initialized"
END_MARKER = "finished loading"

# Regex patterns
symbol_pattern = re.compile(r'"([A-Z0-9\-]+)"')
fx_line_pattern = re.compile(r"value from MT:.*?,\s*([A-Z0-9\-]+):\s*\[(.*?)\]", re.IGNORECASE)
count_pattern = re.compile(r"finished loading (\d+) FX rate")


# -----------------------------
# Load symbols from FXsymbol.list
# -----------------------------
def load_symbols():

    symbols = set()

    with open(SYMBOL_FILE, "r") as f:
        for line in f:
            match = symbol_pattern.search(line)
            if match:
                symbols.add(match.group(1))

    return symbols


# -----------------------------
# Parse FX log
# -----------------------------
def parse_log():

    start_reading = False
    parsed_status = {}
    fx_count = None

    with open(LOG_FILE, "r") as f:

        for line in f:

            if START_MARKER in line:
                start_reading = True
                continue

            if not start_reading:
                continue

            # Detect FX values
            match = fx_line_pattern.search(line)

            if match:
                symbol = match.group(1)
                values = match.group(2)

                if "#InvalidRecord" in values:
                    parsed_status[symbol] = "INVALID"
                else:
                    parsed_status[symbol] = "VALID"

            # Detect finished loading count
            count_match = count_pattern.search(line)

            if count_match:
                fx_count = int(count_match.group(1))
                break

    return parsed_status, fx_count


# -----------------------------
# Load previous state
# -----------------------------
def load_previous_state():

    if not os.path.exists(STATE_FILE):
        return {}

    with open(STATE_FILE, "r") as f:
        return json.load(f)


# -----------------------------
# Save current state
# -----------------------------
def save_state(state):

    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# -----------------------------
# Detect state transitions
# -----------------------------
def detect_transitions(previous, current):

    invalid_alerts = []
    missing_alerts = []

    for symbol in current:

        prev_status = previous.get(symbol)
        curr_status = current[symbol]

        if prev_status == "VALID" and curr_status == "INVALID":
            invalid_alerts.append(symbol)

        if prev_status == "VALID" and curr_status == "MISSING":
            missing_alerts.append(symbol)

    return invalid_alerts, missing_alerts


# -----------------------------
# Main Logic
# -----------------------------
def main():

    expected_symbols = load_symbols()

    parsed_status, fx_count = parse_log()

    # Initialize all symbols as MISSING
    current_state = {symbol: "MISSING" for symbol in expected_symbols}

    # Update with parsed results
    for symbol, status in parsed_status.items():
        current_state[symbol] = status

    previous_state = load_previous_state()

    invalid_alerts, missing_alerts = detect_transitions(previous_state, current_state)

    print("\n==============================")
    print(" FX RATE MONITOR REPORT")
    print("==============================\n")

    # Sanity check
    if fx_count is not None:
        print(f"FX rates loaded according to log: {fx_count}")

        if fx_count < len(expected_symbols):
            print("WARNING: FX count lower than expected!")

    # Alerts
    if not invalid_alerts and not missing_alerts:
        print("No new FX issues detected.")

    if invalid_alerts:

        print("\nCurrencies became INVALID today:\n")

        for c in invalid_alerts:
            print("-", c)

    if missing_alerts:

        print("\nCurrencies became MISSING today:\n")

        for c in missing_alerts:
            print("-", c)

    # Prepare email message
    if invalid_alerts or missing_alerts:

        message = "FX RATE ALERT\n\n"

        if invalid_alerts:
            message += "Currencies became INVALID:\n"
            for c in invalid_alerts:
                message += f"{c}\n"

        if missing_alerts:
            message += "\nCurrencies became MISSING:\n"
            for c in missing_alerts:
                message += f"{c}\n"

        # -------------------------
        # EMAIL ALERT (COMMENTED)
        # -------------------------
        """
        from email.mime.text import MIMEText
        import smtplib

        msg = MIMEText(message)
        msg['Subject'] = 'FX Rate Monitoring Alert'
        msg['From'] = 'fx-monitor@company.com'
        msg['To'] = 'ops-team@company.com'

        smtp = smtplib.SMTP('smtp.company.com')
        smtp.send_message(msg)
        smtp.quit()
        """

    # Save state for next run
    save_state(current_state)


if __name__ == "__main__":
    main()