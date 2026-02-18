import express from "express";
import Bet from "../models/Bet.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import Transaction from "../models/Transactions.js";

const router = express.Router();


/* ================= PLACE BET ================= */

router.post("/place", auth, async (req, res) => {

  try {

    const {
      matchId,
      betType,
      teamSelected,
      questionIndex,
      odds,
      amount,
    } = req.body;


    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }


    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }


    const possibleWin = amount * odds;


    /* CREATE BET */

    const bet = await Bet.create({

      userId: user._id,

      matchId,
      betType,

      teamSelected,
      questionIndex,

      odds,
      amount,

      possibleWin,

    });


    /* DEDUCT BALANCE */

    user.balance -= amount;
    await user.save();


    res.json({
      success: true,
      bet,
      balance: user.balance,
    });

  } catch (err) {

    console.error("Bet Error:", err);

    res.status(500).json({
      error: "Failed to place bet",
    });
  }
});



/* ================= GET MY BETS ================= */

router.get("/my", auth, async (req, res) => {

  try {

    const bets = await Bet.find({
      userId: req.user.id,
      status: "PENDING"
    }).sort({ createdAt: -1 });


    res.json({
      success: true,
      bets,
    });

  } catch (err) {

    res.status(500).json({
      error: "Failed to fetch bets",
    });

  }
});


router.get("/history", auth, async (req, res) => {

  try {

    const bets = await Bet.find({
      userId: req.user.id,
      status: { $ne: "PENDING" }
    });

    const transactions = await Transaction.find({
      userId: req.user.id
    });

    res.json({
      success: true,
      bets,
      transactions
    });

  } catch (err) {

    res.status(500).json({
      error: "Failed to fetch history"
    });

  }
});

export default router;

