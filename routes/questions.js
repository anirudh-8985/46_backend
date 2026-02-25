import express from "express";
import auth from "../middleware/auth.js";
import loaderOnly from "../middleware/loader.js";
import Question from "../models/Question.js";

const router = express.Router();



/* ================= GET ALL MATCH IDS ================= */

router.get("/matches", auth, loaderOnly, async (req, res) => {

  const matches = await Question.distinct("matchId");

  res.json(matches);
});



/* ================= ADD MATCH ================= */

router.post("/match", auth, loaderOnly, async (req, res) => {

  const { matchId } = req.body;

  if (!matchId) {
    return res.status(400).json({
      error: "Match ID required"
    });
  }

  // Check if already exists
  const exists = await Question.findOne({ matchId });

  if (exists) {
    return res.status(400).json({
      error: "Match already exists"
    });
  }

  // Create placeholder question
  await Question.create({
    matchId,
    question: "Placeholder",
    team1: "",
    team2: "",
    odds1: 0,
    odds2: 0,
    to_be_kept: false
  });

  res.json({ success: true });
});



/* ================= GET QUESTIONS BY MATCH ================= */





/* ================= ADD QUESTION ================= */

router.post("/add", auth, loaderOnly, async (req, res) => {

  const q = await Question.create(req.body);

  res.json(q);
});



/* ================= UPDATE QUESTION ================= */

router.put("/:id", auth, loaderOnly, async (req, res) => {

  const updated = await Question.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});



/* ================= DELETE SINGLE QUESTION ================= */

router.delete("/:id", auth, loaderOnly, async (req, res) => {

  await Question.findByIdAndDelete(req.params.id);

  res.json({ success: true });
});



/* ================= DELETE FULL MATCH ================= */

router.delete("/match/:matchId", auth, loaderOnly, async (req, res) => {

  await Question.deleteMany({
    matchId: req.params.matchId
  });

  res.json({ success: true });
});


router.get("/:matchId", auth, loaderOnly, async (req, res) => {

  const questions = await Question.find({
    matchId: req.params.matchId
  });

  res.json(questions);
});

export default router;