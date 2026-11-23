"""QRVE hooks: real agent run log + safety guard.

Usage (from .claude/settings.json):
  python qrve_hook.py log   -> SubagentStart / SubagentStop / PreToolUse(Agent): append to logs/agent_runs.jsonl
  python qrve_hook.py guard -> PreToolUse: block deletes, writes to 03_aprobado, and out-of-zone writes per agent

Stdlib only, works on Windows and Linux.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

# Where each agent may write (relative to project root, forward slashes).
WRITE_ZONES = {
    "crm-manager": [r"^clients/", r"^outputs/"],
    "sales-marketing": [r"^outputs/"],
    "design-director": [r"^clients/[^/]+/02_borradores/", r"^clients/[^/]+/04_final/", r"^outputs/"],
    "finance": [r"^outputs/", r"^clients/[^/]+/04_final/"],
    "qa-reviewer": [r"^outputs/qa/"],
}

DELETE_PATTERNS = [
    r"(^|[\s;&|(])rm(\s|$)", r"(^|[\s;&|(])rmdir(\s|$)", r"(^|[\s;&|(])del(\s|$)",
    r"(^|[\s;&|(])erase(\s|$)", r"(^|[\s;&|(])unlink(\s|$)", r"Remove-Item", r"\bri\s",
    r"git\s+clean", r"git\s+rm\b", r"shutil\.rmtree", r"os\.remove", r"os\.unlink",
    r"\.unlink\(", r"find\b.*-delete",
]
WRITE_OPS = [
    r">", r"\bcp\b", r"\bmv\b", r"sed\s+-i", r"\btee\b", r"\btouch\b", r"\bchmod\b",
    r"\btruncate\b", r"\bdd\b", r"Set-Content", r"Out-File", r"Add-Content",
    r"Copy-Item", r"Move-Item", r"New-Item", r"open\(.*['\"][wa]", r"write_text", r"write_bytes",
]
WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
SHELL_TOOLS = {"Bash", "PowerShell"}


def project_dir(data):
    return os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()


def now():
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def append(root, name, record):
    os.makedirs(os.path.join(root, "logs"), exist_ok=True)
    with open(os.path.join(root, "logs", name), "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def rel(root, path):
    p = os.path.abspath(os.path.join(root, path)) if not os.path.isabs(path) else os.path.abspath(path)
    r = os.path.relpath(p, os.path.abspath(root)).replace("\\", "/")
    return r


def deny(root, data, reason):
    append(root, "guard.jsonl", {
        "ts": now(), "agent": data.get("agent_type") or "ceo",
        "tool": data.get("tool_name"), "input": data.get("tool_input"), "reason": reason,
    })
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "QRVE guard: " + reason,
    }}, ensure_ascii=False))
    sys.exit(0)


def guard(data):
    root = project_dir(data)
    tool = data.get("tool_name", "")
    ti = data.get("tool_input") or {}
    agent = data.get("agent_type")

    if tool in WRITE_TOOLS:
        path = ti.get("file_path") or ti.get("notebook_path") or ""
        r = rel(root, path)
        if "03_aprobado" in r.split("/"):
            deny(root, data, f"الملفات المعتمدة محمية ولا تُعدَّل: {r}. أنشئ نسخة جديدة في 02_borradores.")
        if r.startswith(".."):
            deny(root, data, f"الكتابة خارج مجلد الشركة ممنوعة: {path}")
        if agent in WRITE_ZONES and not any(re.search(z, r) for z in WRITE_ZONES[agent]):
            deny(root, data, f"الوكيل {agent} لا يملك صلاحية الكتابة في: {r}")

    if tool in SHELL_TOOLS:
        cmd = ti.get("command", "")
        if any(re.search(p, cmd) for p in DELETE_PATTERNS):
            deny(root, data, "الحذف يحتاج موافقة المالك.")
        # ignore harmless redirections (stderr merge, discard to null) before checking write ops
        scan = re.sub(r"\d?>&\d|\d?>\s*(/dev/null|nul|\$null)", " ", cmd, flags=re.I)
        if "03_aprobado" in cmd and any(re.search(p, scan) for p in WRITE_OPS):
            deny(root, data, "لا يُسمح بتعديل الملفات المعتمدة عبر الطرفية.")
    sys.exit(0)


def log(data):
    root = project_dir(data)
    event = data.get("hook_event_name")
    rec = {"ts": now(), "event": event, "session_id": data.get("session_id")}
    if event == "PreToolUse":  # CEO assigns a task to an agent
        ti = data.get("tool_input") or {}
        rec.update({"status": "assigned", "agent": ti.get("subagent_type"),
                    "task": ti.get("description"), "prompt": (ti.get("prompt") or "")[:500]})
    elif event == "SubagentStart":
        rec.update({"status": "running", "agent": data.get("agent_type"), "agent_id": data.get("agent_id")})
    elif event == "SubagentStop":
        rec.update({"status": "finished", "agent": data.get("agent_type"), "agent_id": data.get("agent_id"),
                    "transcript": data.get("agent_transcript_path")})
    else:
        rec.update({"status": "unknown", "raw_keys": sorted(data.keys())})
    append(root, "agent_runs.jsonl", rec)
    sys.exit(0)


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    except Exception:
        payload = {}
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    {"guard": guard, "log": log}.get(mode, lambda d: sys.exit(0))(payload)
