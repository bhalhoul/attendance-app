"""Agent status derived ONLY from logs/agent_runs.jsonl (written by hooks).

python tools/agent_status.py          -> table of agents and their real status
python tools/agent_status.py --json   -> same, JSON (for the future dashboard)

Status: idle (never run) | assigned | running | finished
"""
import json
import os
import sys

AGENTS = ["crm-manager", "sales-marketing", "design-director", "finance", "qa-reviewer"]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(ROOT, "logs", "agent_runs.jsonl")


def load():
    if not os.path.exists(LOG):
        return []
    with open(LOG, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def status():
    runs = load()
    out = {a: {"status": "idle", "runs": 0, "last_task": None, "last_ts": None} for a in AGENTS}
    for r in runs:
        a = r.get("agent")
        if a not in out:
            continue
        s = out[a]
        s["status"], s["last_ts"] = r["status"], r["ts"]
        if r["status"] == "assigned":
            s["last_task"] = r.get("task")
        if r["status"] == "finished":
            s["runs"] += 1
    return out


if __name__ == "__main__":
    st = status()
    if "--json" in sys.argv:
        print(json.dumps(st, ensure_ascii=False, indent=2))
    else:
        print(f"{'agent':<17}{'status':<10}{'runs':<6}{'last':<27}task")
        for a, s in st.items():
            print(f"{a:<17}{s['status']:<10}{s['runs']:<6}{s['last_ts'] or '-':<27}{s['last_task'] or '-'}")
