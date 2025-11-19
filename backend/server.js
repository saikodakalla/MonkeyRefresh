import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5050;

// ---------- MIDDLEWARE ----------
app.use(
  cors({
    origin: true, // allow localhost:5173 and the extension
  })
);
app.use(express.json());

// ---------- MONGODB ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ---------- SCHEMA / MODEL ----------
const StatsSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, index: true },
    username: { type: String, unique: true },
    refreshCount: { type: Number, default: 0 },
    logs: { type: [Date], default: [] },
  },
  { timestamps: true }
);

const Stats = mongoose.model("Stats", StatsSchema);

function generateUsername(userId) {
  const suffix = (userId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  return `Player-${suffix || Math.random().toString(36).slice(2, 8)}`;
}

// ---------- ROUTES ----------

// Ensure a user exists and return their username
app.post("/ensure-user", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    let doc = await Stats.findOne({ userId });

    if (!doc) {
      doc = new Stats({
        userId,
        username: generateUsername(userId),
        refreshCount: 0,
        logs: [],
      });
      await doc.save();
    }

    return res.json({
      userId: doc.userId,
      username: doc.username,
      refreshCount: doc.refreshCount,
    });
  } catch (err) {
    console.error("ensure-user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Log a refresh event from the extension
app.post("/log-refresh", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    let doc = await Stats.findOne({ userId });

    if (!doc) {
      doc = new Stats({
        userId,
        username: generateUsername(userId),
        refreshCount: 0,
        logs: [],
      });
    }

    doc.refreshCount += 1;
    doc.logs.push(new Date());

    await doc.save();

    return res.json({
      success: true,
      refreshCount: doc.refreshCount,
    });
  } catch (err) {
    console.error("log-refresh error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Per-user stats for dashboard
app.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await Stats.findOne({ userId });

    if (!doc) {
      return res.json({
        userId,
        username: generateUsername(userId),
        refreshCount: 0,
        logs: [],
      });
    }

    return res.json({
      userId: doc.userId,
      username: doc.username,
      refreshCount: doc.refreshCount,
      logs: doc.logs,
    });
  } catch (err) {
    console.error("stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Leaderboard
app.get("/leaderboard", async (_req, res) => {
  try {
    const docs = await Stats.find({})
      .sort({ refreshCount: -1, updatedAt: -1 })
      .limit(50);

    const data = docs.map((d) => ({
      username: d.username,
      refreshCount: d.refreshCount,
    }));

    return res.json(data);
  } catch (err) {
    console.error("leaderboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
