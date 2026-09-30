"use client";

import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085";

export default function ResetPage() {
  const [item, setItem] = useState("item_4021");
  const [total, setTotal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resetStock(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API}/api/v1/inventory/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item, total_stock: Number(total) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      setMessage(`Stok ${data.item_id} berhasil direset menjadi ${data.total_stock} unit.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="nav">
        <a className="nav-brand" href="/">Indico</a>
        <a className="nav-link" href="/">Kembali ke dashboard</a>
      </nav>

      <main className="shell reset-shell">
        <div className="hero reset-hero">
          <p className="eyebrow">Pengaturan stok</p>
          <h1>Reset stok</h1>
          <p>Atur kembali stok item. Semua reservasi aktif untuk item tersebut akan dibatalkan.</p>
        </div>

        <form className="panel reset-panel" onSubmit={resetStock}>
          <label>
            Item ID
            <input value={item} onChange={(e) => setItem(e.target.value)} required />
          </label>
          <label>
            Jumlah stok baru
            <input
              type="number"
              min={1}
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              required
            />
          </label>
          <p className="reset-warning">Tindakan ini membatalkan seluruh reservasi aktif pada item tersebut.</p>
          <button type="submit" disabled={loading}>
            {loading ? "Mereset stok..." : "Reset stok"}
          </button>
        </form>

        {message && <p role="status" className="ok reset-message">{message}</p>}
        {error && <p role="alert" className="err reset-message">{error}</p>}
      </main>
    </>
  );
}
