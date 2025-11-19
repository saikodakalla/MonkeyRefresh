import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Leaderboard from "./Leaderboard";

interface StatsResponse {
  userId: string;
  username: string;
  refreshCount: number;
  logs: string[]; // ISO date strings
}

type Tab = "stats" | "leaderboard";

const API_BASE = "http://localhost:5050";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId") || "test123";

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("stats");

  useEffect(() => {
    setLoading(true);
    axios
      .get<StatsResponse>(`${API_BASE}/stats/${userId}`)
      .then((res) => {
        console.log("API response:", res.data);
        setStats(res.data);
      })
      .catch((err) => {
        console.error("API fetch error:", err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "white",
          background: "#050505",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Monkeytype Auto-Refresh Analytics
        </h1>
        <p>Loading stats…</p>
      </div>
    );
  }

  if (!stats && tab === "stats") {
    return (
      <div
        style={{
          padding: 40,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "white",
          background: "#050505",
          minHeight: "100vh",
        }}
      >
        <Header
          userId={userId}
          tab={tab}
          setTab={setTab}
          username={undefined}
        />
        <h2 style={{ fontSize: 32, marginTop: 40 }}>
          No stats found for user:
          <br />
          {userId}
        </h2>
      </div>
    );
  }

  const chartData =
    stats?.logs?.map((ts, index) => ({
      refreshNumber: index + 1,
      time: new Date(ts).toLocaleTimeString(),
    })) ?? [];

  return (
    <div
      style={{
        padding: 40,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "white",
        background: "#050505",
        minHeight: "100vh",
      }}
    >
      <Header
        userId={userId}
        tab={tab}
        setTab={setTab}
        username={stats?.username}
      />

      {tab === "leaderboard" && (
        <div style={{ marginTop: 32 }}>
          <Leaderboard />
        </div>
      )}

      {tab === "stats" && stats && (
        <>
          <div
            style={{
              padding: "20px 24px",
              background: "#111827",
              borderRadius: 16,
              marginTop: 32,
              marginBottom: 32,
              display: "inline-block",
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.7 }}>Total Refreshes</div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>
              {stats.refreshCount}
            </div>
          </div>

          <h2 style={{ marginBottom: 12 }}>Refresh Timeline</h2>

          <div style={{ width: "100%", height: 360, background: "#020617" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="refreshNumber"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h2 style={{ marginTop: 40, marginBottom: 12 }}>Refresh Log</h2>

          <table
            style={{
              width: "100%",
              marginTop: 10,
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #1f2937",
                    textAlign: "left",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #1f2937",
                    textAlign: "left",
                  }}
                >
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.logs.map((ts, i) => (
                <tr key={i}>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #111827",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #111827",
                    }}
                  >
                    {new Date(ts).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

interface HeaderProps {
  userId: string;
  username?: string;
  tab: Tab;
  setTab: (t: Tab) => void;
}

function Header({ userId, username, tab, setTab }: HeaderProps) {
  return (
    <>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>
        Monkeytype Auto-Refresh Analytics
      </h1>
      <div style={{ opacity: 0.7, marginBottom: 20 }}>
        User ID: <code>{userId}</code>
        {username && (
          <>
            {" "}
            · Name: <strong>{username}</strong>
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setTab("stats")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            background: tab === "stats" ? "#2563eb" : "#111827",
            color: "white",
          }}
        >
          My Stats
        </button>
        <button
          onClick={() => setTab("leaderboard")}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            background: tab === "leaderboard" ? "#2563eb" : "#111827",
            color: "white",
          }}
        >
          Leaderboard
        </button>
      </div>
    </>
  );
}
