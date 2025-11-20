import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import moment from "moment-timezone";
console.log(">>> USING SERVER FILE:", import.meta.url);

const app = express();
const PORT = process.env.PORT || 5050;

// ---------- MIDDLEWARE ----------
app.use(
  cors({
    origin: true, // allow extension + local / deployed frontends
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
    username: { type: String },
    refreshCount: { type: Number, default: 0 }, // total all-time
    logs: { type: [Date], default: [] }, // every refresh timestamp
  },
  { timestamps: true }
);

const Stats = mongoose.model("Stats", StatsSchema);

// Utility: generate a readable username from userId
function generateUsername(userId) {
  const suffix = (userId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  return `Player-${suffix || Math.random().toString(36).slice(2, 8)}`;
}

// Utility: returns "MM/DD/YYYY" string for a given timestamp in EST
function estDateString(dateLike) {
  return new Date(dateLike).toLocaleDateString("en-US", {
    timeZone: "America/Toronto", // EST/EDT
  });
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

// Per-user stats (if you still need it)
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

// Leaderboard (if you still want it anywhere)
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

// ⭐ Global refresh total for today (EST) using refreshCount
app.get("/global-refresh-total", async (_req, res) => {
  try {
    console.log("🔥 /global-refresh-total HIT");

    const tz = "America/Toronto";

    // Define today in EST
    const todayStartEST = moment().tz(tz).startOf("day");
    const todayEndEST = moment().tz(tz).endOf("day");

    console.log(
      "📅 Today EST:",
      todayStartEST.format(),
      "→",
      todayEndEST.format()
    );

    // Convert to UTC for Mongo query
    const startUTC = todayStartEST.clone().utc().toDate();
    const endUTC = todayEndEST.clone().utc().toDate();

    // Get ONLY logs from today using $filter + aggregation
    const result = await Stats.aggregate([
      {
        $project: {
          logs: {
            $filter: {
              input: "$logs",
              as: "log",
              cond: {
                $and: [
                  { $gte: ["$$log", startUTC] },
                  { $lte: ["$$log", endUTC] },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalLogsToday: { $sum: { $size: "$logs" } },
        },
      },
    ]);

    const total = result[0]?.totalLogsToday || 0;

    console.log("🔥 TOTAL refreshes today:", total);
    res.json({ total });
  } catch (err) {
    console.error("❌ Error in /global-refresh-total:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

console.log("🔥 ROUTES LOADED:");
console.log(" - POST /ensure-user");
console.log(" - POST /log-refresh");
console.log(" - GET  /stats/:userId");
console.log(" - GET  /leaderboard");
console.log(" - GET  /global-refresh-total");
