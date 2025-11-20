import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await axios.get(`${API_URL}/global-refresh-total`);
        setCount(res.data.total ?? 0);
      } catch (err) {
        console.error("Failed to load global count:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCount();
  }, []);

  return (
    <div className="page">
      <h1 className="title">🌍 Global Refresh Counter</h1>

      <div className="card">
        <div className="big-number">
          {loading ? "…" : count.toLocaleString()}
        </div>
        <div className="subtitle">refreshes today (EST)</div>
      </div>
    </div>
  );
}
