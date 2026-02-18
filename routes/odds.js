import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/* ================= CONFIG ================= */

const API_KEY = "19f9bc10704ba30b4383faed84fbc88";

const SPORT = "cricket_t20_world_cup";
const REGIONS = "us";
const MARKETS = "h2h,spreads,totals";
const ODDS_FORMAT = "decimal";
const DATE_FORMAT = "iso";

/* Questions + Scores */
const SHEET_URL =
  "https://opensheet.elk.sh/1es9tAOJ67ZKWr1HrMmeOOhijNTST1qNdOMfXaNsp_mo/Sheet1";

/* Live + Results */
const RESULT_SHEET_URL =
  "https://opensheet.elk.sh/1Abhs7G8-2fK2M1CNm8WCNnDqdGK4u0U1kPv4K8AzbRE/Sheet1"; // 🔴 CHANGE THIS

/* ================= CACHE ================= */

let cache = null;
let cacheTime = 0;

/* ================= HELPERS ================= */

function normalizeTeam(name = "") {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z]/g, "")
    .slice(0, 3);
}

function makeMatchId(team1, team2) {
  return (
    normalizeTeam(team1) +
    "vs" +
    normalizeTeam(team2)
  ).toUpperCase();
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

/* ================= ROUTE ================= */

router.get("/", async (req, res) => {

  const fast = req.query.fast === "true";
  const CACHE_TTL = fast ? 5000 : 60000;
  const now = Date.now();

  /* CACHE */
  if (cache && now - cacheTime < CACHE_TTL) {
    return res.json({
      success: true,
      cached: true,
      data: cache,
    });
  }

  try {

    /* ================= FETCH ODDS ================= */

    const oddsUrl =
      `https://api.the-odds-api.com/v4/sports/${SPORT}/odds` +
      `?api_key=${API_KEY}` +
      `&regions=${REGIONS}` +
      `&markets=${MARKETS}` +
      `&oddsFormat=${ODDS_FORMAT}` +
      `&dateFormat=${DATE_FORMAT}`;

    const oddsRes = await safeFetch(oddsUrl);

    if (!oddsRes.ok) throw new Error("Odds API failed");

    const oddsData = await oddsRes.json();


    /* ================= FETCH MAIN SHEET ================= */

    const sheetRes = await safeFetch(SHEET_URL);

    if (!sheetRes.ok) throw new Error("Main Sheet failed");

    const sheetData = await sheetRes.json();


    /* ================= FETCH RESULT SHEET ================= */

    const resultRes = await safeFetch(RESULT_SHEET_URL);

    if (!resultRes.ok) throw new Error("Result Sheet failed");

    const resultData = await resultRes.json();


    /* ================= MAP MAIN SHEET ================= */

    const sheetMap = {};

    sheetData.forEach(row => {

      if (!row.ID) return;

      const id = row.ID.trim().toUpperCase();

      if (!sheetMap[id]) sheetMap[id] = [];

      sheetMap[id].push(row);
    });


    /* ================= MAP RESULT SHEET ================= */

    const resultMap = {};

    resultData.forEach(row => {

      if (!row.ID) return;

      const id = row.ID.trim().toUpperCase();

      resultMap[id] = row;
    });


    /* ================= MERGE ================= */

    const finalData = oddsData.map(match => {

      const market = match.bookmakers?.[0]?.markets?.[0];

      const id = makeMatchId(
        match.home_team,
        match.away_team
      );

      const rows = sheetMap[id] || [];

      const resultRow = resultMap[id] || {};


      /* Questions */

      const questions = rows
        .filter(q => q.Question)
        .map(q => ({
          question: q.Question,
          odds_yes: Number(q.odds1) || null,
          odds_no: Number(q.odds2) || null,
          won: q.won || null,
          active: q.to_be_kept === "yes"
        }));


      /* Time-based live fallback */

      const start = new Date(match.commence_time);
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
      const nowTime = new Date();

      const timeLive =
        nowTime >= start && nowTime <= end;


      return {

        id,

        /* Teams */
        homeTeam: match.home_team,
        awayTeam: match.away_team,

        /* Odds */
        odds1: market?.outcomes?.[0]?.price || null,
        odds2: market?.outcomes?.[1]?.price || null,

        /* Question Bets */
        questions,

        /* Scores */
        homeTeam_runs: rows[0]?.homeTeam_runs || null,
        homeTeam_wickets: rows[0]?.homeTeam_wickets || null,
        homeTeam_overs: rows[0]?.homeTeam_overs || null,

        awayTeam_runs: rows[0]?.awayTeam_runs || null,
        awayTeam_wickets: rows[0]?.awayTeam_wickets || null,
        awayTeam_overs: rows[0]?.awayTeam_overs || null,

        /* Live + Result (FROM SECOND SHEET) */
        isLive:
          resultRow.live === "yes" ||
          rows[0]?.live_match === "yes" ||
          timeLive,

        matchWon:
          resultRow.match_won ||
          rows[0]?.team_won ||
          null,

        /* Meta */
        startTime: match.commence_time,
        league: match.sport_title,
        updatedAt: new Date().toISOString(),
      };
    });


    /* ================= SORT ================= */

    finalData.sort(
      (a, b) => (b.isLive === true) - (a.isLive === true)
    );


    /* ================= CACHE ================= */

    cache = finalData;
    cacheTime = now;


    /* ================= RESPONSE ================= */

    res.json({
      success: true,
      data: finalData,
      count: finalData.length,
    });

  } catch (err) {

    console.error("❌ Odds Error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
