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
// import authRoutes from "./routes/auth.js";



import auth from "./middleware/auth.js";   // ✅ IMPORT AUTH

import cookieParser from "cookie-parser";


dotenv.config();
connectDB();

// Run every 30 seconds
setInterval(settleBets, 30000);

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "https://four6-frontend.onrender.com"],
  credentials: true
}));
// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true
// }));

app.use(express.json());

app.use(cookieParser());
app.use("/api/auth", authRoutes);



// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Protect bet routes
app.use("/api/bets", betRoutes);

// Odds
app.use("/api/matches", oddsRoutes);
app.use("/api/withdrawals", withdrawalRoutes);


// ================= START =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
