import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import withdrawalRoutes from "./routes/withdraw.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import betRoutes from "./routes/bets.js";
import oddsRoutes from "./routes/matches.js";
import { settleBets } from "./services/settleBets.js";
import adminReports from "./routes/adminReports.js";
import questionRoutes from "./routes/questions.js";
import updaterRoutes from "./routes/updater.js"
import cookieParser from "cookie-parser";


dotenv.config();
connectDB();

// Run every 30 seconds
setInterval(settleBets, 30000);

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: [process.env.API_BASE_URL],
  credentials: true
}));


app.use(express.json());

app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/updater",updaterRoutes);



// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/questions", questionRoutes);

// Protect bet routes
app.use("/api/bets", betRoutes);
app.use("/api/admin/reports", adminReports);

// Odds
app.use("/api/matches", oddsRoutes);
app.use("/api/withdrawals", withdrawalRoutes);


// ================= START =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
