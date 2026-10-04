"""
API Scheduler Backend v2
3 APIs • Customer Randomizer • SQLite Logger
Deploy free on Render.com → connect to the React dashboard
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import requests as http, sqlite3, json, os, random
from datetime import datetime
from pydantic import BaseModel
from typing import List, Dict, Any

# ─── Shared State ─────────────────────────────────────────────────────────────
state: Dict[str, Any] = {
    "apis": [
        {"id": 1, "name": "API 1", "enabled": True,  "url": "", "method": "POST", "token": "", "body": '{"to": "{customer_number}"}'},
        {"id": 2, "name": "API 2", "enabled": False, "url": "", "method": "POST", "token": "", "body": '{"to": "{customer_number}"}'},
        {"id": 3, "name": "API 3", "enabled": False, "url": "", "method": "POST", "token": "", "body": '{"to": "{customer_number}"}'},
    ],
    "customers": [],
    "schedule": {
        "interval": 30,
        "apiMode": "all",           # all | random | specific
        "customerMode": "random",   # random | sequential
        "specificApi": 1
    },
    "running": False,
    "_seq_idx": 0,                  # internal counter for sequential mode
}

CONFIG_FILE = "config.json"

def load_config():
    """Load saved config from disk on startup."""
    if os.path.exists(CONFIG_FILE):
        try:
            saved = json.load(open(CONFIG_FILE))
            for k in ("apis", "customers", "schedule"):
                if k in saved:
                    state[k] = saved[k]
            state["running"] = False
            state["_seq_idx"] = 0
            print(f"✅ Config loaded — {len(state['customers'])} customers, {sum(1 for a in state['apis'] if a.get('enabled'))} APIs enabled")
        except Exception as e:
            print(f"⚠️  Config load error: {e}")

def save_config():
    """Persist config to disk."""
    try:
        json.dump(
            {k: state[k] for k in ("apis", "customers", "schedule")},
            open(CONFIG_FILE, "w"), indent=2
        )
    except Exception as e:
        print(f"⚠️  Config save error: {e}")

# ─── Database ─────────────────────────────────────────────────────────────────
db = sqlite3.connect("logs.db", check_same_thread=False)
db.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        ts      TEXT,
        api     TEXT,
        customer TEXT,
        status  INTEGER,
        response_body TEXT,
        success INTEGER,
        ms      INTEGER
    )
""")
db.commit()

# ─── Scheduler Logic ──────────────────────────────────────────────────────────
def pick_customer() -> str:
    """Select a customer number based on the configured mode."""
    c = state["customers"]
    if not c:
        return "NO_CUSTOMER"
    if state["schedule"]["customerMode"] == "random":
        return random.choice(c)
    # sequential
    idx = state["_seq_idx"] % len(c)
    state["_seq_idx"] += 1
    return c[idx]

def pick_apis() -> list:
    """Select which API(s) to call this interval."""
    enabled = [a for a in state["apis"] if a.get("enabled")]
    if not enabled:
        return []
    mode = state["schedule"]["apiMode"]
    if mode == "all":
        return enabled
    if mode == "random":
        return [random.choice(enabled)]
    # specific
    sid = state["schedule"].get("specificApi", 1)
    found = [a for a in enabled if a["id"] == sid]
    return found or [enabled[0]]

def call_one(api: dict, customer: str):
    """Make a single HTTP call and log the result."""
    t0 = datetime.utcnow()
    try:
        # Replace placeholder in body
        raw = api.get("body", "{}").replace("{customer_number}", str(customer))
        body = json.loads(raw)

        # Build headers
        headers = {"Content-Type": "application/json"}
        token = (api.get("token") or "").strip()
        if token:
            headers["Authorization"] = token if token.startswith("Bearer ") else f"Bearer {token}"

        method = api.get("method", "POST").upper()
        url    = api.get("url", "")

        if method == "GET":
            resp = http.get(url, headers=headers, params=body, timeout=15)
        else:
            resp = http.request(method, url, json=body, headers=headers, timeout=15)

        ms      = int((datetime.utcnow() - t0).total_seconds() * 1000)
        success = 1 if resp.ok else 0

        db.execute(
            "INSERT INTO logs (ts,api,customer,status,response_body,success,ms) VALUES (?,?,?,?,?,?,?)",
            (datetime.utcnow().strftime("%H:%M:%S"), api["name"], customer,
             resp.status_code, resp.text[:5000], success, ms)
        )
        db.commit()
        print(f"  [{api['name']}] {method} → {resp.status_code} | cust={customer} | {ms}ms")

    except Exception as e:
        ms = int((datetime.utcnow() - t0).total_seconds() * 1000)
        db.execute(
            "INSERT INTO logs (ts,api,customer,status,response_body,success,ms) VALUES (?,?,?,?,?,?,?)",
            (datetime.utcnow().strftime("%H:%M:%S"), api["name"], customer, 0, str(e)[:2000], 0, ms)
        )
        db.commit()
        print(f"  [{api['name']}] ERROR: {e}")

def run_job():
    """Main job — picks customer + API(s) and fires the calls."""
    customer  = pick_customer()
    apis_used = pick_apis()
    print(f"\n[{datetime.utcnow().strftime('%H:%M:%S')}] Firing | customer={customer} | apis={[a['name'] for a in apis_used]}")
    for api in apis_used:
        call_one(api, customer)

# ─── App Setup ────────────────────────────────────────────────────────────────
load_config()

app = FastAPI(title="API Scheduler v2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler(timezone="UTC")
scheduler.start()

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class Config(BaseModel):
    apis:      List[Dict[str, Any]]
    customers: List[str]
    schedule:  Dict[str, Any]

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"app": "API Scheduler v2", "status": "ok"}

@app.get("/status")
def status():
    return {
        "running": state["running"],
        "config": {k: state[k] for k in ("apis", "customers", "schedule")}
    }

@app.post("/configure")
def configure(c: Config):
    """Save new config. If scheduler is running, restart with new interval."""
    state.update({"apis": c.apis, "customers": c.customers,
                  "schedule": c.schedule, "_seq_idx": 0})
    save_config()
    if state["running"]:
        try: scheduler.remove_job("job")
        except: pass
        scheduler.add_job(run_job, "interval",
                          seconds=int(c.schedule.get("interval", 30)),
                          id="job", replace_existing=True)
    return {"status": "configured"}

@app.post("/start")
def start():
    """Start the scheduler (fires an immediate call first)."""
    if not state["running"]:
        try: scheduler.remove_job("job")
        except: pass
        scheduler.add_job(run_job, "interval",
                          seconds=int(state["schedule"].get("interval", 30)),
                          id="job", replace_existing=True)
        state["running"] = True
        run_job()  # immediate first call
    return {"status": "started", "interval": state["schedule"].get("interval")}

@app.post("/stop")
def stop():
    """Stop the scheduler."""
    if state["running"]:
        try: scheduler.remove_job("job")
        except: pass
        state["running"] = False
    return {"status": "stopped"}

@app.post("/test")
def test():
    """Fire one call immediately without starting the scheduler."""
    run_job()
    return {"status": "called"}

@app.get("/logs")
def get_logs(limit: int = 50):
    """Return the most recent N log entries."""
    rows = db.execute(
        "SELECT id,ts,api,customer,status,response_body,success,ms "
        "FROM logs ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    return [
        {"id": r[0], "ts": r[1], "api": r[2], "customer": r[3],
         "status": r[4], "response_body": r[5], "success": r[6], "ms": r[7]}
        for r in rows
    ]

@app.delete("/clear")
def clear():
    """Wipe all logs."""
    db.execute("DELETE FROM logs")
    db.commit()
    return {"status": "cleared"}

# ─── Local Run ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Starting on http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
