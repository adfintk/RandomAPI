import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#070a12", card: "#0f1420", border: "#1c2333",
  accent: "#6366f1", purple: "#8b5cf6",
  green: "#22c55e", red: "#ef4444", amber: "#f59e0b",
  text: "#f1f5f9", muted: "#64748b",
};

const inp = (extra = {}) => ({
  width: "100%", background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "9px 12px", color: C.text,
  fontSize: 14, outline: "none", boxSizing: "border-box", ...extra
});

const LBL = {
  fontSize: 11, color: C.muted, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 6
};

// ─── Sample Data ──────────────────────────────────────────────────────────────
const DEMO_LOGS = [
  { id: 8, ts: "10:32:45", api: "API 1", customer: "9876543210", status: 200, success: 1, ms: 342, response_body: '{"status":"ok","msgId":"msg_abc123","to":"9876543210"}' },
  { id: 7, ts: "10:32:15", api: "API 2", customer: "9876543211", status: 200, success: 1, ms: 189, response_body: '{"status":"ok","msgId":"msg_abc122","to":"9876543211"}' },
  { id: 6, ts: "10:31:45", api: "API 1", customer: "9876543210", status: 429, success: 0, ms: 156, response_body: '{"error":"Rate limit exceeded","retryAfter":60}' },
  { id: 5, ts: "10:31:15", api: "API 3", customer: "9876543212", status: 200, success: 1, ms: 521, response_body: '{"status":"ok","msgId":"msg_abc121","to":"9876543212"}' },
  { id: 4, ts: "10:30:45", api: "API 2", customer: "9876543210", status: 200, success: 1, ms: 298, response_body: '{"status":"ok","msgId":"msg_abc120","to":"9876543210"}' },
];

const DEFAULT_APIS = [
  { id: 1, name: "API 1", enabled: true,  url: "", method: "POST", token: "", body: '{\n  "to": "{customer_number}",\n  "type": "text",\n  "content": "Hello!"\n}' },
  { id: 2, name: "API 2", enabled: false, url: "", method: "POST", token: "", body: '{\n  "to": "{customer_number}",\n  "type": "text",\n  "content": "Hello!"\n}' },
  { id: 3, name: "API 3", enabled: false, url: "", method: "POST", token: "", body: '{\n  "to": "{customer_number}",\n  "type": "text",\n  "content": "Hello!"\n}' },
];

// ─── ApiCard Sub-Component ────────────────────────────────────────────────────
function ApiCard({ api, onChange }) {
  const [open, setOpen] = useState(api.id === 1);
  return (
    <div style={{ background: C.card, border: `2px solid ${api.enabled ? C.accent + "55" : C.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: api.enabled ? `linear-gradient(135deg,${C.accent},${C.purple})` : C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: api.enabled ? "white" : C.muted, flexShrink: 0 }}>
            {api.id}
          </div>
          <input value={api.name} onChange={e => onChange({ ...api, name: e.target.value })}
            style={{ background: "transparent", border: "none", color: C.text, fontWeight: 700, fontSize: 15, outline: "none", flex: 1 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => onChange({ ...api, enabled: !api.enabled })}
            style={{ width: 42, height: 23, borderRadius: 12, background: api.enabled ? C.green : "#374151", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: api.enabled ? 21 : 3, width: 17, height: 17, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
          </div>
          <button onClick={() => setOpen(!open)}
            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, padding: 0 }}>
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
            <div>
              <label style={LBL}>Endpoint URL</label>
              <input value={api.url} onChange={e => onChange({ ...api, url: e.target.value })}
                placeholder="https://api.example.com/send" style={inp()} />
            </div>
            <div>
              <label style={LBL}>Method</label>
              <select value={api.method} onChange={e => onChange({ ...api, method: e.target.value })} style={inp()}>
                {["GET","POST","PUT","PATCH"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={LBL}>Auth Token</label>
            <input value={api.token} onChange={e => onChange({ ...api, token: e.target.value })}
              type="password" placeholder="Bearer eyJhbGci..." style={inp()} />
          </div>
          <div>
            <div style={{ ...LBL, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Request Body (JSON)</span>
              <span style={{ color: "#a78bfa", textTransform: "none", fontSize: 11, fontWeight: 600 }}>
                use {"{customer_number}"} as placeholder
              </span>
            </div>
            <textarea value={api.body} onChange={e => onChange({ ...api, body: e.target.value })} rows={5}
              style={{ ...inp(), fontFamily: "monospace", fontSize: 12, resize: "vertical" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function APIScheduler() {
  const [backendUrl, setBackendUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [running, setRunning] = useState(false);
  const [demo, setDemo] = useState(true);
  const [tab, setTab] = useState("apis");
  const [timer, setTimer] = useState(0);
  const [toast, setToast] = useState(null);
  const [showUrlBar, setShowUrlBar] = useState(true);

  const [apis, setApis] = useState(DEFAULT_APIS);
  const [customers, setCustomers] = useState(["9876543210", "9876543211", "9876543212"]);
  const [newCustomer, setNewCustomer] = useState("");
  const [schedule, setSchedule] = useState({ interval: 30, apiMode: "all", customerMode: "random", specificApi: 1 });

  const [logs, setLogs] = useState(DEMO_LOGS);
  const [stats, setStats] = useState({ total: 5, success: 4, failed: 1, avg: 301 });
  const [expandedLog, setExpandedLog] = useState(null);

  const timerRef = useRef(null);
  const timerVal = useRef(30);
  const pollRef = useRef(null);

  const notify = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calcStats = (data) => {
    const s = data.filter(r => r.success === 1).length;
    const ms = data.filter(r => r.ms > 0);
    const avg = ms.length ? Math.round(ms.reduce((a, b) => a + b.ms, 0) / ms.length) : 0;
    setStats({ total: data.length, success: s, failed: data.length - s, avg });
  };

  const fetchLogs = useCallback(async () => {
    if (!backendUrl || demo) return;
    try {
      const r = await fetch(`${backendUrl}/logs?limit=50`);
      if (r.ok) { const d = await r.json(); setLogs(d); calcStats(d); }
    } catch {}
  }, [backendUrl, demo]);

  useEffect(() => {
    if (running && connected) { pollRef.current = setInterval(fetchLogs, 5000); }
    else clearInterval(pollRef.current);
    return () => clearInterval(pollRef.current);
  }, [running, connected, fetchLogs]);

  useEffect(() => {
    if (running) {
      timerVal.current = +schedule.interval || 30;
      setTimer(timerVal.current);
      timerRef.current = setInterval(() => {
        timerVal.current = timerVal.current <= 1 ? +schedule.interval || 30 : timerVal.current - 1;
        setTimer(timerVal.current);
      }, 1000);
    } else { clearInterval(timerRef.current); setTimer(0); }
    return () => clearInterval(timerRef.current);
  }, [running, schedule.interval]);

  const connect = async () => {
    if (!backendUrl.trim()) { notify("Enter backend URL", "err"); return; }
    setConnecting(true);
    try {
      const r = await fetch(`${backendUrl.trim()}/status`);
      if (r.ok) {
        const d = await r.json();
        setConnected(true); setDemo(false); setRunning(d.running || false);
        if (d.config) {
          if (d.config.apis?.length) setApis(d.config.apis);
          if (d.config.customers) setCustomers(d.config.customers);
          if (d.config.schedule) setSchedule(d.config.schedule);
        }
        fetchLogs();
        notify("✅ Connected!");
        setShowUrlBar(false);
      } else notify("Backend returned an error", "err");
    } catch { notify("❌ Cannot connect — is backend running?", "err"); }
    setConnecting(false);
  };

  const saveAll = async () => {
    if (!connected) { notify("Connect backend first", "err"); return; }
    try {
      const r = await fetch(`${backendUrl}/configure`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apis, customers, schedule })
      });
      if (r.ok) notify("💾 Config saved!"); else notify("Save failed", "err");
    } catch (e) { notify("Error: " + e.message, "err"); }
  };

  const startStop = async () => {
    if (!connected) { notify("Connect backend first", "err"); return; }
    try {
      const r = await fetch(`${backendUrl}${running ? "/stop" : "/start"}`, { method: "POST" });
      if (r.ok) {
        if (!running) { setRunning(true); setTab("logs"); notify("▶ Started!"); setTimeout(fetchLogs, 1500); }
        else { setRunning(false); notify("⏹ Stopped."); }
      }
    } catch { notify("Failed", "err"); }
  };

  const testNow = async () => {
    if (!connected) { notify("Connect backend first", "err"); return; }
    try {
      await fetch(`${backendUrl}/test`, { method: "POST" });
      notify("🧪 Test call sent!");
      setTimeout(fetchLogs, 1500);
    } catch { notify("Test failed", "err"); }
  };

  const downloadCSV = () => {
    const data = demo ? DEMO_LOGS : logs;
    const keys = ["id","ts","api","customer","status","success","ms"];
    const csv = [keys.join(","), ...data.map(r => keys.map(k => `"${String(r[k]??"")}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `api-logs-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    notify("⬇ CSV downloaded!");
  };

  const ivl = +schedule.interval || 30;
  const pct = running ? ((ivl - timer) / ivl) * 100 : 0;
  const dispLogs = demo ? DEMO_LOGS : logs;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "Inter,-apple-system,sans-serif", paddingBottom: 72 }}>

      {/* Toast Pill */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          background: toast.type === "err" ? C.red : "#16a34a",
          color: "white", padding: "10px 22px", borderRadius: 50, fontSize: 13, fontWeight: 700,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}

      {/* Sticky Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${C.accent},${C.purple})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>API Scheduler</div>
            <div style={{ fontSize: 10, color: C.muted }}>3-API • Randomizer • Logger</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {demo && <span style={{ background: "#f59e0b15", color: C.amber, border: `1px solid #f59e0b25`, borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>DEMO</span>}
          {running && <span style={{ background: "#22c55e15", color: C.green, border: `1px solid #22c55e25`, borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>● LIVE</span>}
          <button onClick={() => setShowUrlBar(v => !v)}
            style={{ background: C.border, border: "none", color: C.text, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 14 }}>
            {connected ? "⚙️" : "🔗"}
          </button>
        </div>
      </div>

      {/* Collapsible URL Bar */}
      {showUrlBar && (
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", gap: 8 }}>
          <input value={backendUrl} onChange={e => setBackendUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && connect()}
            placeholder="https://your-app.onrender.com  (leave empty = demo)"
            style={{ ...inp(), fontSize: 13, padding: "8px 12px", flex: 1 }} />
          <button onClick={connect} disabled={connecting}
            style={{ background: `linear-gradient(135deg,${C.accent},${C.purple})`, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0, opacity: connecting ? 0.7 : 1 }}>
            {connecting ? "..." : connected ? "✓ Live" : "Connect"}
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto" }}>
        {[
          { l: "Total", v: demo ? 5 : stats.total, col: C.accent },
          { l: "OK",    v: demo ? 4 : stats.success, col: C.green },
          { l: "Fail",  v: demo ? 1 : stats.failed, col: C.red },
          { l: "Avg",   v: `${demo ? 301 : stats.avg}ms`, col: C.amber },
          ...(running ? [{ l: "Next", v: `${timer}s`, col: C.green }] : []),
        ].map(s => (
          <div key={s.l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", flexShrink: 0, textAlign: "center", minWidth: 62 }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.col }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "4px 16px 10px" }}>

        {/* ═══ APIs TAB ═══ */}
        {tab === "apis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: C.muted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", lineHeight: 1.7 }}>
              💡 Paste your 3 Postman API curls here. In the body, use{" "}
              <code style={{ background: C.border, padding: "1px 5px", borderRadius: 4, color: "#a78bfa", fontSize: 11 }}>{"{customer_number}"}</code>
              {" "}— it gets replaced with the selected customer on every call.
            </div>
            {apis.map((api, i) => (
              <ApiCard key={api.id} api={api} onChange={updated => {
                const next = [...apis]; next[i] = updated; setApis(next);
              }} />
            ))}
            <button onClick={saveAll} disabled={!connected}
              style={{ background: connected ? `linear-gradient(135deg,${C.accent},${C.purple})` : C.border, color: connected ? "white" : C.muted, border: "none", borderRadius: 10, padding: "12px 0", cursor: connected ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
              💾 Save API Config
            </button>
            {!connected && <div style={{ textAlign: "center", fontSize: 12, color: C.amber }}>⚠️ Connect backend via 🔗 in header to save</div>}
          </div>
        )}

        {/* ═══ CUSTOMERS TAB ═══ */}
        {tab === "customers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <label style={LBL}>Add Customer Number / Phone</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newCustomer} onChange={e => setNewCustomer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newCustomer.trim()) {
                      if (!customers.includes(newCustomer.trim())) setCustomers([...customers, newCustomer.trim()]);
                      setNewCustomer("");
                    }
                  }}
                  placeholder="918765432100" style={{ ...inp(), flex: 1 }} />
                <button onClick={() => {
                    const v = newCustomer.trim();
                    if (v && !customers.includes(v)) setCustomers([...customers, v]);
                    setNewCustomer("");
                  }}
                  style={{ background: C.accent, color: "white", border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>
                  + Add
                </button>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Press Enter or + Add to add. Duplicates are skipped.</div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 14 }}>
                📱 {customers.length} Customer{customers.length !== 1 ? "s" : ""}
              </div>
              {customers.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>Add customer numbers above</div>
              ) : customers.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < customers.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Slot #{i + 1}</div>
                  </div>
                  <button onClick={() => setCustomers(customers.filter((_, idx) => idx !== i))}
                    style={{ background: "#ef444420", color: C.red, border: `1px solid #ef444430`, borderRadius: 7, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <label style={LBL}>Customer Selection Mode</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { val: "random",     icon: "🎲", title: "Random",     desc: "Pick randomly each call" },
                  { val: "sequential", icon: "🔄", title: "Sequential", desc: "Rotate in order 1→2→3→1" },
                ].map(m => (
                  <div key={m.val} onClick={() => setSchedule(p => ({ ...p, customerMode: m.val }))}
                    style={{ border: `2px solid ${schedule.customerMode === m.val ? C.accent : C.border}`, background: schedule.customerMode === m.val ? `${C.accent}12` : "transparent", borderRadius: 10, padding: 12, cursor: "pointer" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginTop: 2 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveAll} disabled={!connected}
              style={{ background: connected ? `linear-gradient(135deg,${C.accent},${C.purple})` : C.border, color: connected ? "white" : C.muted, border: "none", borderRadius: 10, padding: "12px 0", cursor: connected ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15 }}>
              💾 Save Customer Config
            </button>
          </div>
        )}

        {/* ═══ SCHEDULE TAB ═══ */}
        {tab === "schedule" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            <div style={{ background: C.card, border: `2px solid ${running ? "#22c55e40" : C.border}`, borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
              {running ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: "0.12em", marginBottom: 10 }}>● SCHEDULER RUNNING</div>
                  <div style={{ fontSize: 72, fontWeight: 900, color: C.accent, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timer}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>seconds until next call</div>
                  <div style={{ background: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: `linear-gradient(90deg,${C.accent},${C.purple})`, width: `${pct}%`, transition: "width 1s linear", borderRadius: 4 }} />
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
                    {schedule.apiMode === "all" ? "All enabled APIs" : schedule.apiMode === "random" ? "Random API" : (apis.find(a => a.id === +schedule.specificApi)?.name || "API")}
                    {" • "}
                    {schedule.customerMode === "random" ? "Random customer" : "Sequential customers"}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>⏸</div>
                  <div style={{ fontSize: 15, color: C.muted }}>Scheduler is stopped</div>
                  {!connected && <div style={{ fontSize: 12, color: C.amber, marginTop: 8 }}>Connect backend to start</div>}
                </>
              )}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <label style={LBL}>Call Every (seconds)</label>
              <input type="number" value={schedule.interval} min={5} max={3600}
                onChange={e => setSchedule(p => ({ ...p, interval: e.target.value }))} style={inp()} />
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                = every {schedule.interval >= 60 ? `${Math.floor(schedule.interval / 60)} min ${schedule.interval % 60 > 0 ? `${schedule.interval % 60}s` : ""}` : `${schedule.interval} seconds`}
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <label style={LBL}>Which API to Call Each Time</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { val: "all",      icon: "📤", title: "All Enabled APIs", desc: "Fire all enabled APIs every interval" },
                  { val: "random",   icon: "🎲", title: "Random API",       desc: "Pick one random API each time" },
                  { val: "specific", icon: "🎯", title: "Specific API",     desc: "Always call one particular API" },
                ].map(m => (
                  <div key={m.val} onClick={() => setSchedule(p => ({ ...p, apiMode: m.val }))}
                    style={{ border: `2px solid ${schedule.apiMode === m.val ? C.accent : C.border}`, background: schedule.apiMode === m.val ? `${C.accent}12` : "transparent", borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 22 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.title}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{m.desc}</div>
                      </div>
                    </div>
                    {schedule.apiMode === m.val && <span style={{ color: C.accent, fontWeight: 800, fontSize: 16 }}>✓</span>}
                  </div>
                ))}
                {schedule.apiMode === "specific" && (
                  <select value={schedule.specificApi} onChange={e => setSchedule(p => ({ ...p, specificApi: +e.target.value }))}
                    style={{ ...inp(), marginTop: 2 }}>
                    {apis.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <button onClick={startStop} disabled={!connected}
                style={{ background: !connected ? C.border : running ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#16a34a,#22c55e)", color: connected ? "white" : C.muted, border: "none", borderRadius: 12, padding: "15px 0", cursor: connected ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 18 }}>
                {running ? "⏹  Stop" : "▶  Start"}
              </button>
              <button onClick={testNow} disabled={!connected}
                style={{ background: "#f59e0b18", color: C.amber, border: `1px solid #f59e0b30`, borderRadius: 12, padding: "15px 18px", cursor: connected ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14, opacity: connected ? 1 : 0.5 }}>
                🧪 Test
              </button>
            </div>
            {!connected && <div style={{ textAlign: "center", fontSize: 12, color: C.amber }}>⚠️ Connect backend to enable controls</div>}
          </div>
        )}

        {/* ═══ LOGS TAB ═══ */}
        {tab === "logs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>📋 {demo ? "Demo Logs" : `${logs.length} Responses`}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {!demo && <button onClick={fetchLogs} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>↻</button>}
                <button onClick={downloadCSV} style={{ background: "#22c55e18", color: C.green, border: `1px solid #22c55e30`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>⬇ CSV</button>
                {!demo && (
                  <button onClick={async () => {
                    await fetch(`${backendUrl}/clear`, { method: "DELETE" });
                    setLogs([]); setStats({ total:0,success:0,failed:0,avg:0 }); notify("Cleared.");
                  }} style={{ background: "#ef444418", color: C.red, border: `1px solid #ef444430`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    🗑
                  </button>
                )}
              </div>
            </div>

            {dispLogs.length === 0 ? (
              <div style={{ padding: 50, textAlign: "center", color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                No responses yet — start the scheduler
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dispLogs.map(r => (
                  <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <div onClick={() => setExpandedLog(expandedLog === r.id ? null : r.id)}
                      style={{ padding: "11px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.success === 1 ? C.green : C.red, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.api} → {r.customer}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{r.ts}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {r.ms > 0 && <span style={{ fontSize: 10, color: C.muted }}>{r.ms}ms</span>}
                        <span style={{ background: r.success === 1 ? "#22c55e18" : "#ef444418", color: r.success === 1 ? C.green : C.red, border: `1px solid ${r.success === 1 ? "#22c55e30" : "#ef444430"}`, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          {r.status || "ERR"}
                        </span>
                        <span style={{ fontSize: 10, color: C.muted }}>{expandedLog === r.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {expandedLog === r.id && (
                      <div style={{ padding: "10px 14px", background: "#050710", borderTop: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 6 }}>RESPONSE BODY</div>
                        <pre style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "auto", maxHeight: 180, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {(() => { try { return JSON.stringify(JSON.parse(r.response_body), null, 2); } catch { return r.response_body || "(empty)"; } })()}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 }}>
        {[
          { key: "apis",      icon: "🔌", label: "APIs" },
          { key: "customers", icon: "👥", label: "Customers" },
          { key: "schedule",  icon: running ? "🟢" : "⏱", label: "Schedule" },
          { key: "logs",      icon: "📋", label: `Logs${!demo && logs.length ? ` (${logs.length})` : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, background: "none", border: "none", padding: "9px 0 7px", cursor: "pointer", color: tab === t.key ? C.accent : C.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.key ? 700 : 500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
