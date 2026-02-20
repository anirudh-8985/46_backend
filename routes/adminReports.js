import express from "express";
import Bet from "../models/Bet.js";
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ================= DAILY SUMMARY ================= */

router.get("/daily-summary", auth, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {

    const today = new Date();
    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    /* ===== BETS ===== */

    const betsToday = await Bet.find({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const totalBetsAmount =
      betsToday.reduce((sum, b) => sum + b.amount, 0);


    /* ===== WITHDRAWALS ===== */

    const withdrawalsToday = await Withdrawal.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: "APPROVED"
    });

    const totalWithdraw =
      withdrawalsToday.reduce((sum, w) => sum + w.amount, 0);


    /* ===== DEPOSITS ===== */
    // IMPORTANT: You must track deposits properly.
    // For now assuming you log deposits in Withdrawal model or Admin Add Money.

    const depositsToday = await Withdrawal.find({
      createdAt: { $gte: today, $lt: tomorrow },
      type: "DEPOSIT"   // if you're storing this
    });

    const totalDepositAmount =
      depositsToday.reduce((sum, d) => sum + d.amount, 0);


    res.json({
      totalBetsAmount,
      totalWithdraw,
      totalDepositAmount
    });

  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});


/* ================= PLATFORM PROFIT ================= */

router.get("/profit-report", auth, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {

    const bets = await Bet.find({
      status: { $in: ["WON", "LOST"] }
    });

    let profit = 0;

    bets.forEach(bet => {

      if (bet.status === "LOST") {
        profit += bet.amount;
      }

      if (bet.status === "WON") {
        profit -= bet.possibleWin;
      }

    });

    res.json({
      totalProfit: profit
    });

  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
