import express from "express";

import LiveMatch from "../models/LiveMatch.js";
import auth from "../middleware/auth.js";
import updaterOnly from "../middleware/updater.js";

const router = express.Router();


// ================= ADD MATCH =================
// DELETE MATCH
router.delete("/delete/:id", auth, updaterOnly, async (req, res) => {
  try {

    const deleted = await LiveMatch.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json({
      success: true,
      message: "Match deleted"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Delete failed"
    });
  }
});

router.post("/add", auth, updaterOnly, async (req, res) => {

  try {

    const { matchId, home, away } = req.body;

    if (!matchId || !home || !away) {
      return res.status(400).json({
        error: "matchId, home, away required"
      });
    }

    const exists = await LiveMatch.findOne({ matchId });

    if (exists) {
      return res.status(400).json({
        error: "Match already exists"
      });
    }

    const match = await LiveMatch.create({
      matchId,
      home,
      away
    });

    res.json(match);

  } catch (err) {

    console.error("Add match error:", err);

    res.status(500).json({
      error: "Server error"
    });
  }
});


// ================= GET ALL =================
router.get("/all", auth, updaterOnly, async (req, res) => {

  const matches = await LiveMatch.find()
    .sort({ createdAt: -1 });

  res.json(matches);
});


// ================= UPDATE =================
router.put("/update/:id", auth, updaterOnly, async (req, res) => {

  try {

    const updated = await LiveMatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (err) {

    console.error("Update error:", err);

    res.status(500).json({
      error: "Update failed"
    });
  }
});

export default router;