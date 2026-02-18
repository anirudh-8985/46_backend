import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();


/* ================= ADMIN CREATE USER ================= */

router.post("/create", auth, async (req, res) => {

  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { username, password, balance } = req.body;

    const exist = await User.findOne({ username });

    if (exist) {
      return res.status(400).json({ error: "User exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({

      username,
      password: hash,
      balance: balance || 1000,

    });


    res.json({
      success: true,
      user,
    });

  } catch (err) {

    res.status(500).json({
      error: "Create failed",
    });

  }
});


/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {

  try {

    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "Invalid login" });
    }

    const ok = await bcrypt.compare(
      password,
      user.password
    );

    if (!ok) {
      return res.status(400).json({ error: "Invalid login" });
    }


    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });


    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
        role: user.role,
      },
    });

  } catch (err) {

    res.status(500).json({
      error: "Login failed",
    });

  }
});


/* ================= LOGOUT ================= */

router.post("/logout", (req, res) => {

  res.clearCookie("token");

  res.json({
    success: true,
  });

});


/* ================= GET PROFILE ================= */

router.get("/me", auth, async (req, res) => {

  const user = await User.findById(req.user.id)
    .select("-password");

  res.json({
    user
  });

});

router.post("/update-profile", auth, async (req, res) => {

  try {

    const { username, oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Change username
    if (username) {
      user.username = username;
    }

    // Change password
    if (newPassword) {

      const match = await bcrypt.compare(
        oldPassword,
        user.password
      );

      if (!match) {
        return res.status(400).json({
          error: "Wrong old password"
        });
      }

      const hash = await bcrypt.hash(newPassword, 10);

      user.password = hash;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
        role: user.role
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Update failed"
    });
  }
});


router.post("/create-user", auth, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  const { username, password, balance } = req.body;

  const user = await User.create({
    username,
    password,
    balance,
    role: "user",
  });

  res.json({ success: true, user });
});



export default router;
