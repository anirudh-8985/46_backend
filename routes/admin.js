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

export default router;
