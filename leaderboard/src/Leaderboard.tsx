import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5050";

interface LeaderboardEntry {
  username: string;
  refreshCount: number;
}

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get<LeaderboardEntry[]>(`${API_BASE}/leaderboard`)
      .then((res) => {
        setRows(res.data);
      })
      .catch((err) => {
        console.error("leaderboard error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading leaderboard…</p>;
  }

  if (!rows.length) {
    return <p>No players yet. Start refreshing tests to appear here!</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Refresh Leaderboard</h2>
      <table
        style={{
          width: "100%",
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
              Player
            </th>
            <th
              style={{
                padding: 10,
                borderBottom: "1px solid #1f2937",
                textAlign: "left",
              }}
            >
              Refreshes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => (
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
                {u.username}
              </td>
              <td
                style={{
                  padding: 10,
                  borderBottom: "1px solid #111827",
                }}
              >
                {u.refreshCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
