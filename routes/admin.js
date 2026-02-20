import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const router = express.Router();


/* ================= ADD USER ================= */

router.post("/add-user", auth, admin, async (req, res) => {
  try {

    const { username, password, balance } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const exists = await User.findOne({ username });

    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed,
      balance: balance || 0,
      role: "user"
    });

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



router.post("/add-money", auth, admin, async (req, res) => {

  try {

    const { username, amount } = req.body;

    if (!username || !amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid data",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    /* ADD MONEY */
    user.balance += Number(amount);

    await user.save();

    res.json({
      success: true,
      message: "Money added successfully",
      balance: user.balance,
      user: {
        id: user._id,
        username: user.username,
      },
    });

  } catch (err) {

    console.error("Add Money Error:", err);

    res.status(500).json({
      error: "Server error",
    });

  }
});
/* ================= GET USER ================= */

router.get("/user/:username", auth, admin, async (req, res) => {

  try {

    const user = await User.findOne({
      username: req.params.username,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      balance: user.balance,
    });

  } catch (err) {

    res.status(500).json({
      error: "Server error",
    });

  }
});

export default router;
