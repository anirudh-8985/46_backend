import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({

  matchId: {
    type: String,
    required: true,
    index: true
  },

  question: String,

  team1: String,
  team2: String,

  odds1: Number,
  odds2: Number,

  question_won: {
    type: String,
    default: null
  },

  to_be_kept: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model("Question", questionSchema);