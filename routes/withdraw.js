import express from "express";
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const router = express.Router();


/* ================= USER REQUEST ================= */

router.post("/request", auth, async (req, res) => {

  const { amount, upiId } = req.body;

  if (!amount || !upiId) {
    return res.status(400).json({ error: "Missing data" });
  }

  const withdrawal = await Withdrawal.create({
    userId: req.user.id,
    amount,
    upiId
  });

  res.json({ success: true, withdrawal });
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

  const w = await Withdrawal.findById(req.params.id);

  if (!w || w.status !== "PENDING") {
    return res.status(400).json({ error: "Invalid request" });
  }

  w.status = "APPROVED";
  await w.save();

  res.json({ success: true });
});


/* ================= ADMIN: REJECT ================= */

router.post("/reject/:id", auth, admin, async (req, res) => {

  const w = await Withdrawal.findById(req.params.id);

  if (!w || w.status !== "PENDING") {
    return res.status(400).json({ error: "Invalid request" });
  }

  w.status = "REJECTED";
  await w.save();

  res.json({ success: true });
});


export default router;
