"""Match each native exception to exactly one live control and validate the reviewed cohort."""
import hashlib
import json
from collections import defaultdict
from pathlib import Path


def audit(review, files, registry, cohort_digest):
    rows = review["uses"]
    origins = [[r["path"], r["line"], r["control"]] for r in rows if r.get("line")]
    digest = hashlib.sha256(json.dumps([review["baseline"], sorted(origins)], separators=(",", ":")).encode()).hexdigest()
    errors = [] if digest == cohort_digest else ["The original source locations in the reviewed cohort changed."]
    symbols = {s for item in registry.values() for s in item["symbols"]}
    available = defaultdict(list)
    for path, entry in files.items():
        for call in entry["rawUses"]:
            available[path, call["control"], call["fingerprint"]].append(call["line"])
    results = []
    for row in rows:
        row = dict(row)
        key = row["path"], row["control"], row.get("fingerprint")
        if row.get("line") and row.get("component") in symbols and not row.get("reason") and not row.get("fingerprint"):
            row["status"] = "Migrated"
        elif (not row.get("component") and row.get("reason", "").strip() and available.get(key)):
            row["status"] = "Justified native"
            row["currentLine"] = available[key].pop(0)
        else:
            row["status"] = "Needs review"
            errors.append(f'{row["path"]}:{row["line"]} {row["control"]} has a stale exception or invalid migration.')
        results.append(row)
    for (path, control, _), lines in available.items():
        for line in lines:
            errors.append(f"{path}:{line} uses an unreviewed native {control}.")
            results.append({"path": path, "control": control, "currentLine": line,
                            "reason": "Choose a registered component or record why this native interaction is required.",
                            "status": "Needs review"})
    return {"baseline": review["baseline"], "rows": results, "errors": errors}


if __name__ == "__main__":
    import sys

    print(json.dumps(audit(**json.load(sys.stdin))))
