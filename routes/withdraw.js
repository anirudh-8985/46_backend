import express from "express";
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const router = express.Router();


/* ================= USER REQUEST ================= */

router.post("/request", auth, async (req, res) => {

  try {

    const { amount, upiId } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    /* ✅ DEDUCT IMMEDIATELY */
    user.balance -= amount;
    await user.save();

    /* CREATE WITHDRAW REQUEST */
    const withdrawal = await Withdrawal.create({
      userId: user._id,
      amount,
      upiId,
      status: "PENDING",
    });

    res.json({
      success: true,
      withdrawal,
      balance: user.balance,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Withdrawal failed",
    });

  }
});


/* ================= ADMIN: GET ALL ================= */

router.get("/all", auth, admin, async (req, res) => {

  const list = await Withdrawal
    .find()
    .populate("userId", "username balance")
    .sort({ createdAt: -1 });

  res.json(list);
});


/* ================= ADMIN: APPROVE ================= */
router.post("/approve/:id", auth, admin, async (req, res) => {

  try {

    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ error: "Not found" });
    }

    if (withdrawal.status !== "PENDING") {
      return res.status(400).json({ error: "Already processed" });
    }

    withdrawal.status = "APPROVED";
    await withdrawal.save();

    res.json({
      success: true,
      message: "Withdrawal approved",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Approve failed",
    });

  }
});


/* ================= ADMIN: REJECT ================= */

router.post("/reject/:id", auth, admin, async (req, res) => {

  try {

    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ error: "Not found" });
    }

    if (withdrawal.status !== "PENDING") {
      return res.status(400).json({ error: "Already processed" });
    }

    const user = await User.findById(withdrawal.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /* ✅ REFUND */
    user.balance += withdrawal.amount;
    await user.save();

    withdrawal.status = "REJECTED";
    await withdrawal.save();

    res.json({
      success: true,
      message: "Rejected & refunded",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Reject failed",
    });

  }
});



export default router;
