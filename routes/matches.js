import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/* ================= CONFIG ================= */

const API_KEY = process.env.ODDS_API_KEY; // Put in .env

const SPORT = "cricket_t20_world_cup";
const REGIONS = "us";
const MARKETS = "h2h,spreads,totals";
const ODDS_FORMAT = "decimal";
const DATE_FORMAT = "iso";

/* ================= SHEETS ================= */

const QUESTION_SHEET =
  "https://opensheet.elk.sh/1es9tAOJ67ZKWr1HrMmeOOhijNTST1qNdOMfXaNsp_mo/Sheet1";

const LIVE_SHEET =
  "https://opensheet.elk.sh/1Abhs7G8-2fK2M1CNm8WCNnDqdGK4u0U1kPv4K8AzbRE/Sheet1";


/* ================= HELPERS ================= */

// Normalize team name
function normalizeTeam(name = "") {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "")
    .slice(0, 3);
}
async function safeFetch(url, timeout = 10000) {
  const controller = new AbortController();

  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
// Create match ID
function makeMatchId(a, b) {
  console.debug(normalizeTeam(a) + "vs" + normalizeTeam(b))
  return (normalizeTeam(a) + "vs" + normalizeTeam(b)).toUpperCase();
}


// Normalize sheet ID
function normalizeId(id = "") {
  return id.trim().toUpperCase();
}


/* ================= ROUTE ================= */

router.get("/", async (req, res) => {
  try {

    /* ================= FETCH ODDS ================= */

    const oddsUrl =
      `https://api.the-odds-api.com/v4/sports/${SPORT}/odds` +
      `?api_key=${API_KEY}` +
      `&regions=${REGIONS}` +
      `&markets=${MARKETS}` +
      `&oddsFormat=${ODDS_FORMAT}` +
      `&dateFormat=${DATE_FORMAT}`;

    const oddsRes = await fetch(oddsUrl);

    if (!oddsRes.ok) {
      throw new Error(`Odds API failed: ${oddsRes.status}`);
    }

    const odds = await oddsRes.json();

    if (!Array.isArray(odds)) {
      throw new Error("Invalid odds response");
    }


    /* ================= FETCH SHEETS ================= */

    // const [qRes, lRes] = await Promise.all([
    //   fetch(QUESTION_SHEET),
    //   fetch(LIVE_SHEET),
    // ]);
    const qRes = await safeFetch(QUESTION_SHEET);
    // console.debug("ques",qRes)
    const lRes = await safeFetch(LIVE_SHEET);
    // console.debug("lqwhud",lRes)
    if (!qRes.ok || !lRes.ok) {
      throw new Error("Sheet API failed");
    }

    const questions = await qRes.json();
    const live = await lRes.json();


    /* ================= MAP QUESTIONS ================= */

    const questionMap = {};

    if (Array.isArray(questions)) {

      questions.forEach(q => {

        if (!q.ID) return;

        const id = normalizeId(q.ID);

        if (!questionMap[id]) {
          questionMap[id] = [];
        }

        questionMap[id].push({

          question: q.question || null,

          team1: q.team_name_1 || null,
          team2: q.team_name_2 || null,

          odds1: Number(q.odds1) || null,
          odds2: Number(q.odds2) || null,

          winner: q.question_won || null,

          active:
            String(q.to_be_kept || "")
              .toLowerCase() === "yes"
        });

      });
    }


    /* ================= MAP LIVE ================= */

    const liveMap = {};

    if (Array.isArray(live)) {

      live.forEach(l => {

        if (!l.ID) return;

        const id = normalizeId(l.ID);

        liveMap[id] = {

          live:
            String(l.live || "")
              .toLowerCase() === "yes",

          homeRuns: l.homeTeam_runs || null,
          homeWickets: l.homeTeam_wickets || null,
          homeOvers: l.homeTeam_overs || null,

          awayRuns: l.awayTeam_runs || null,
          awayWickets: l.awayTeam_wickets || null,
          awayOvers: l.awayTeam_overs || null,

          winner: l.team_won || null
        };

      });
    }


    /* ================= MERGE ================= */

    const final = odds.map(m => {

      const id = makeMatchId(m.home_team, m.away_team);

      const market = m.bookmakers?.[0]?.markets?.[0];
      const outcomes = market?.outcomes || [];

      return {

        id,

        /* Teams */
        home: m.home_team,
        away: m.away_team,


        /* Odds */
        odds1: outcomes[0]?.price || null,
        odds2: outcomes[1]?.price || null,


        /* Question Bets */
        questions: questionMap[id] || [],


        /* Live Status */
        live: liveMap[id]?.live || false,


        /* Score */
        score: {

          home: liveMap[id]?.homeRuns || null,
          away: liveMap[id]?.awayRuns || null,

          overs1: liveMap[id]?.homeOvers || null,
          overs2: liveMap[id]?.awayOvers || null,

          wickets1: liveMap[id]?.homeWickets || null,
          wickets2: liveMap[id]?.awayWickets || null,
        },


        /* Result */
        winner: liveMap[id]?.winner || null,


        /* Meta */
        startTime: m.commence_time,
        league: m.sport_title,
        updatedAt: new Date().toISOString()

      };

    });


    /* ================= RESPONSE ================= */

    res.json({
      success: true,
      count: final.length,
      data: final
    });


  } catch (err) {

    console.error("❌ MATCH API ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});

export default router;
