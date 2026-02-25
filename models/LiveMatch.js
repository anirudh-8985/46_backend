import mongoose from "mongoose";

const liveMatchSchema = new mongoose.Schema({

  matchId: {
    type: String,
    unique: true,
    required: true
  },

  home: String,
  away: String,

  live: {
    type: Boolean,
    default: false
  },

  homeRuns: Number,
  homeWickets: Number,
  homeOvers: String,

  awayRuns: Number,
  awayWickets: Number,
  awayOvers: String,

  winner: String,

}, { timestamps: true });


export default mongoose.model("LiveMatch", liveMatchSchema);