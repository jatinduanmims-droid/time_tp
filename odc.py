import yaml
import re
#from email.mime.text import MIMEText
#import smtplib

LOG_FILE = "fx_log.log"
YAML_FILE = "currencies.yaml"

START_MARKER = "ODCDataLoader initialized"
END_MARKER = "finished loading 192 FX rate"

pattern = re.compile(r"value from MT:.*?,\s*([A-Z0-9\-]+):\s*\[(.*?)\]")


def load_yaml():
    with open(YAML_FILE, "r") as f:
        data = yaml.safe_load(f)

    return set(data["symbols"])


def parse_log():

    start = False
    found = {}
    invalid = set()

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

                found[symbol] = True

                if "#InvalidRecord" in values:
                    invalid.add(symbol)

    return found, invalid


def validate():

    expected = load_yaml()
    found, invalid = parse_log()

    found_set = set(found.keys())

    missing = expected - found_set
    invalid_detected = expected.intersection(invalid)

    print("\n==============================")
    print(" FX RATE VALIDATION REPORT")
    print("==============================\n")

    if not missing and not invalid_detected:
        print("All FX rates loaded successfully.")
        return

    if missing:
        print("Missing currencies:")
        for m in sorted(missing):
            print(" -", m)

    if invalid_detected:
        print("\nInvalid currencies (#InvalidRecord):")
        for i in sorted(invalid_detected):
            print(" -", i)

    message = "FX RATE VALIDATION FAILED\n\n"

    if missing:
        message += "Missing currencies:\n"
        for m in missing:
            message += f"{m}\n"

    if invalid_detected:
        message += "\nInvalid currencies:\n"
        for i in invalid_detected:
            message += f"{i}\n"

    # -------------------------
    # EMAIL ALERT (COMMENTED)
    # -------------------------

    """
    msg = MIMEText(message)
    msg['Subject'] = 'FX Rate Validation Alert'
    msg['From'] = 'fx-monitor@company.com'
    msg['To'] = 'ops-team@company.com'

    smtp = smtplib.SMTP('smtp.company.com')
    smtp.send_message(msg)
    smtp.quit()
    """

    print("\nALERT GENERATED")


if __name__ == "__main__":
    validate()