"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085";

type StockData = {
  item_id: string;
  total_stock: number;
  reserved_stock: number;
  available_stock: number;
};

type Reservation = {
  status: string;
  reservation_id: string;
  item_id: string;
  quantity: number;
  expires_at: string;
};

type ApiError = { error?: { code: string; message: string } };

async function api(path: string, init?: RequestInit) {
  const r = await fetch(`${API}${path}`, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error?.message ?? `HTTP ${r.status}`);
  return data;
}

export default function Home() {
  const [item, setItem] = useState("item_4021");
  const [stock, setStock] = useState<StockData | null>(null);
  const [user, setUser] = useState("usr_" + Math.floor(Math.random() * 9999));
  const [qty, setQty] = useState(1);
  const [res, setRes] = useState<Reservation | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      setStock(await api(`/api/v1/inventory/stock?item_id=${item}`));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [item]);

  // live polling
  useEffect(() => {
    fetchStock();
    const t = setInterval(fetchStock, 3000);
    return () => clearInterval(t);
  }, [fetchStock]);

  // countdown
  useEffect(() => {
    if (!res) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(res.expires_at).getTime() - Date.now()) / 1000));
      setCountdown(left);
      if (left === 0) {
        clearInterval(t);
        setRes(null);
        setMsg("Reservasi kedaluwarsa — stok dikembalikan");
        fetchStock();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [res, fetchStock]);

  async function reserve() {
    setErr(null); setMsg(null);
    try {
      setRes(await api("/api/v1/inventory/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user, item_id: item, quantity: Number(qty) }),
      }));
      fetchStock();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function confirm() {
    if (!res) return;
    setErr(null); setMsg(null);
    try {
      const data = await api("/api/v1/inventory/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: res.reservation_id }),
      });
      setRes(null);
      setMsg(`Pesanan ${data.reservation_id} dikonfirmasi`);
      fetchStock();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setRes(null);
    }
  }

  const mm = countdown !== null ? String(Math.floor(countdown / 60)).padStart(2, "0") : "--";
  const ss = countdown !== null ? String(countdown % 60).padStart(2, "0") : "--";
  const availPct = stock && stock.total_stock > 0
    ? Math.round((stock.available_stock / stock.total_stock) * 100)
    : 0;

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">
          Indico
          <span className="nav-live"><span className="live-dot" />LIVE</span>
        </span>
        <span className="nav-sub">Live stok &amp; reservasi flash-sale</span>
      </nav>

      <main className="shell">
        <div className="hero">
          <h1>Flash-Sale Dashboard</h1>
          <p>Reservasi bertahan 5 menit. Konfirmasi sebelum waktu habis, atau stok kembali otomatis.</p>
        </div>

        <div className="grid">
          {/* left: live stats (dark feature panel) */}
          <section className="panel-dark">
            <div className="panel-head">
              <span className="panel-title">Stok tersedia</span>
              <button className="secondary" onClick={fetchStock}>Refresh</button>
            </div>

            <p className="big">
              {stock ? stock.available_stock : "—"}
              <small>unit</small>
            </p>

            <div className="bar">
              <div
                className={`bar-fill${availPct <= 20 ? " low" : ""}`}
                style={{ width: `${availPct}%` }}
              />
            </div>

            <div className="legend">
              <span><span className="dot" />Tersedia <b>{stock?.available_stock ?? "—"}</b></span>
              <span><span className="dot res" />Terreservasi <b>{stock?.reserved_stock ?? "—"}</b></span>
              <span><span className="dot tot" />Total <b>{stock?.total_stock ?? "—"}</b></span>
            </div>

            <label>
              item_id
              <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="item_id" />
            </label>
          </section>

          {/* right: actions */}
          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">Buat reservasi</span>
            </div>

            <label>
              user_id
              <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="user_id" />
            </label>
            <label>
              quantity
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </label>

            <button onClick={reserve} disabled={!stock || stock.available_stock === 0}>
              Reserve stok
            </button>
          </section>
        </div>

        {/* active reservation */}
        {res && (
          <section className="res-card">
            <div className="panel-head">
              <span className="panel-title">Reservasi aktif</span>
              <span className="panel-item">{res.quantity} × {res.item_id}</span>
            </div>
            <p className={`timer${countdown !== null && countdown <= 30 ? " warn" : ""}`}>
              {mm}:{ss}
            </p>
            <p className="res-meta">
              ID <b>{res.reservation_id}</b> — konfirmasi sebelum waktu habis.
            </p>
            <button onClick={confirm}>Confirm Purchase</button>
          </section>
        )}

        {msg && <p role="status" className="ok">{msg}</p>}
        {err && <p role="alert" className="err">{err}</p>}
      </main>
    </>
  );
}
