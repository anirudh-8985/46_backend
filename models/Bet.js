import mongoose from "mongoose";

const betSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  matchId: String,

  betType: String,

  teamSelected: {
    type: String,
    required: true
  },

  questionIndex: Number,

  odds: Number,
  amount: Number,

  possibleWin: Number,

  status: {
    type: String,
    enum: ["PENDING", "WON", "LOST", "DRAW"],
    default: "PENDING"
  },

  profit: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.model("Bet", betSchema);
