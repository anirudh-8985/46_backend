const express = require("express");
const router = express.Router();

const Bet = require("../models/Bet");
const User = require("../models/User");


// Place Bet
router.post("/place", async (req, res) => {

  try {

    const { matchId, team, odds, amount } = req.body;

    const userId = req.user.id; // from auth middleware


    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }


    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }


    // Deduct balance
    user.balance -= amount;
    await user.save();


    // Save bet
    const bet = new Bet({
      user: userId,
      matchId,
      team,
      odds,
      amount
    });

    await bet.save();


    res.json({
      success: true,
      bet,
      balance: user.balance
    });

  } catch (err) {

    console.error("Bet error:", err);

    res.status(500).json({ error: "Failed to place bet" });
  }

});


// My Bets
router.get("/my", async (req, res) => {

  try {

    const bets = await Bet
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(bets);

  } catch (err) {

    res.status(500).json({ error: "Failed to fetch bets" });
  }

});

module.exports = router;
