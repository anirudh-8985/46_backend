// import Bet from "../models/Bet.js";
// import User from "../models/User.js";
// import fetch from "node-fetch";


// export async function settleBets() {

//   try {

//     const res = await fetch("http://localhost:5000/api/matches");

//     const data = await res.json();

//     const matches = data.data;


//     /* Get all pending bets */

//     const pendingBets = await Bet.find({
//       status: "PENDING",
//     });


//     for (let bet of pendingBets) {

//       const match = matches.find(
//         m => m.id === bet.matchId
//       );

//       if (!match) continue;


//       let isWinner = false;


//       /* H2H */

//       if (bet.betType === "h2h") {

//         if (match.winner === bet.teamSelected) {
//           isWinner = true;
//         }

//       }


//       /* QUESTION */

//       if (bet.betType === "question") {

//         const q =
//           match.questions?.[bet.questionIndex];

//         if (q?.winner === bet.teamSelected) {
//           isWinner = true;
//         }

//       }


//       /* UPDATE */

//       if (isWinner) {

//         bet.status = "WON";

//         const user = await User.findById(bet.userId);

//         user.balance += bet.possibleWin;

//         await user.save();

//       } else if (match.winner) {

//         // Match finished but user lost
//         bet.status = "LOST";
//       }


//       await bet.save();

//     }

//     console.log("✅ Bets settled");

//   } catch (err) {

//     console.error("Settlement error:", err);
//   }
// }

import Bet from "../models/Bet.js";
import User from "../models/User.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
export async function settleBets() {

  try {

    // Fetch latest match data
    const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
    console.log("Calling:", `${BASE_URL}/api/matches`);

    const res = await fetch(`${BASE_URL}/api/matches`);


    if (!res.ok) {
      const text = await res.text();
      console.log("Non JSON response:", text);
      throw new Error("Invalid response from matches API");
    }

    const data = await res.json();

      

    const matches = data.data || [];

    // Get all pending bets
    const pendingBets = await Bet.find({
      status: "PENDING"
    });

    let settledCount = 0;

    for (let bet of pendingBets) {

      const match = matches.find(
        m => m.id === bet.matchId
      );

      if (!match) continue;


      let result = null; // WON | LOST | DRAW


      /* ================= H2H ================= */

      if (bet.betType === "h2h") {

        if (!match.winner) continue; // not finished

        if (match.winner === "DRAW") {
          result = "DRAW";
        }
        else if (match.winner === bet.teamSelected) {
          result = "WON";
        }
        else {
          result = "LOST";
        }

      }


      /* ================= QUESTION ================= */

      if (bet.betType === "question") {

        const q =
          match.questions?.[bet.questionIndex];

        if (!q?.winner) continue; // not finished

        if (q.winner === "DRAW") {
          result = "DRAW";
        }
        else if (q.winner === bet.teamSelected) {
          result = "WON";
        }
        else {
          result = "LOST";
        }

      }


      // Skip if still undecided
      if (!result) continue;


      const user = await User.findById(bet.userId);

      if (!user) continue;


      /* ================= APPLY RESULT ================= */

      if (result === "WON") {

        bet.status = "WON";
        bet.profit = bet.possibleWin;

        user.balance += bet.possibleWin;

      }

      else if (result === "DRAW") {

        bet.status = "DRAW";
        bet.profit = 0;

        // Refund
        user.balance += bet.amount;

      }

      else {

        bet.status = "LOST";
        bet.profit = 0;

      }


      await user.save();
      await bet.save();

      settledCount++;
    }

    console.log(`✅ Settled ${settledCount} bets`);

  } catch (err) {

    console.error("❌ Settlement error:", err);
  }
}
