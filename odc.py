import re
import json
import os

LOG_FILE = "fx_log.log"
SYMBOL_FILE = "FXsymbol.list"
STATE_FILE = "fx_state.json"

START_MARKER = "ODCDataLoader initialized"
END_MARKER = "finished loading 192 FX rate"

pattern = re.compile(r"value from MT:.*?,\s*([A-Z0-9\-]+):\s*\[(.*?)\]")


def load_symbols():

    symbols = []

    with open(SYMBOL_FILE, "r") as f:
        for line in f:

            match = re.search(r'"([A-Z0-9\-]+)"', line)

            if match:
                symbols.append(match.group(1))

    return set(symbols)


def parse_log():

    start = False
    status = {}

    with open(LOG_FILE, "r") as f:

        for line in f:

            if START_MARKER in line:
                start = True
                continue

            if END_MARKER in line:
                break

            if not start:
                continue

            match = pattern.search(line)

            if match:

                symbol = match.group(1)
                values = match.group(2)

                if "#InvalidRecord" in values:
                    status[symbol] = "INVALID"
                else:
                    status[symbol] = "VALID"

    return status


def load_previous():

    if not os.path.exists(STATE_FILE):
        return {}

    with open(STATE_FILE) as f:
        return json.load(f)


def save_state(state):

    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def detect_alerts(previous, current):

    alerts = []

    for symbol, curr_status in current.items():

        prev_status = previous.get(symbol)

        if prev_status == "VALID" and curr_status == "INVALID":
            alerts.append(symbol)

    return alerts


def main():

    expected = load_symbols()
    current = parse_log()
    previous = load_previous()

    alerts = detect_alerts(previous, current)

    print("\nFX MONITOR REPORT\n")

    if alerts:

        print("Currencies became INVALID today:\n")

        for a in alerts:
            print("-", a)

        message = "FX ALERT: Currency became invalid\n\n"

        for a in alerts:
            message += f"{a}\n"

        # Email logic (commented)
        """
        from email.mime.text import MIMEText
        import smtplib

        msg = MIMEText(message)
        msg['Subject'] = 'FX Rate Alert'
        msg['From'] = 'fx-monitor@company.com'
        msg['To'] = 'ops-team@company.com'

        smtp = smtplib.SMTP('smtp.company.com')
        smtp.send_message(msg)
        smtp.quit()
        """

    else:
        print("No new invalid currencies.")

    save_state(current)


if __name__ == "__main__":
    main()