export type Match = {
  id: string;
  date: string;
  year: number;
  type: "Club" | "International";
  team: string;
  opponent: string;
  competition: string;
  stage: string;
  score: string;
  url: string;
};

const f = "https://footballia.net";

export const seedMatches: Match[] = [
  { id: "m-2004-10-16", date: "2004-10-16", year: 2004, type: "Club", team: "Barcelona", opponent: "Espanyol", competition: "La Liga", stage: "Matchday 7", score: "0–1", url: `${f}/matches/espanyol-fc-barcelona-liga-1-division-2004-2005` },
  { id: "m-2005-05-01", date: "2005-05-01", year: 2005, type: "Club", team: "Barcelona", opponent: "Albacete", competition: "La Liga", stage: "Matchday 34", score: "2–0", url: `${f}/matches/fc-barcelona-albacete-liga-1-division-2004-2005` },
  { id: "m-2005-08-24", date: "2005-08-24", year: 2005, type: "Club", team: "Barcelona", opponent: "Juventus", competition: "Joan Gamper Trophy", stage: "Final", score: "2–2", url: f },
  { id: "m-2006-03-07", date: "2006-03-07", year: 2006, type: "Club", team: "Barcelona", opponent: "Chelsea", competition: "UEFA Champions League", stage: "Round of 16", score: "1–1", url: f },
  { id: "m-2007-03-10", date: "2007-03-10", year: 2007, type: "Club", team: "Barcelona", opponent: "Real Madrid", competition: "La Liga", stage: "Matchday 26", score: "3–3", url: `${f}/matches/fc-barcelona-real-madrid-liga-1-division-2006-2007` },
  { id: "m-2007-04-18", date: "2007-04-18", year: 2007, type: "Club", team: "Barcelona", opponent: "Getafe", competition: "Copa del Rey", stage: "Semi-final · 1st leg", score: "5–2", url: f },
  { id: "m-2008-05-07", date: "2008-05-07", year: 2008, type: "Club", team: "Barcelona", opponent: "Real Madrid", competition: "La Liga", stage: "Matchday 36", score: "4–1", url: `${f}/matches/real-madrid-fc-barcelona-liga-1-division-2007-2008` },
  { id: "m-2009-05-02", date: "2009-05-02", year: 2009, type: "Club", team: "Barcelona", opponent: "Real Madrid", competition: "La Liga", stage: "Matchday 34", score: "2–6", url: `${f}/matches/real-madrid-fc-barcelona-liga-1-division-2008-2009` },
  { id: "m-2009-05-27", date: "2009-05-27", year: 2009, type: "Club", team: "Barcelona", opponent: "Manchester United", competition: "UEFA Champions League", stage: "Final", score: "2–0", url: f },
  { id: "m-2010-04-06", date: "2010-04-06", year: 2010, type: "Club", team: "Barcelona", opponent: "Arsenal", competition: "UEFA Champions League", stage: "Quarter-final · 2nd leg", score: "4–1", url: f },
  { id: "m-2011-05-28", date: "2011-05-28", year: 2011, type: "Club", team: "Barcelona", opponent: "Manchester United", competition: "UEFA Champions League", stage: "Final", score: "3–1", url: f },
  { id: "m-2012-03-07", date: "2012-03-07", year: 2012, type: "Club", team: "Barcelona", opponent: "Bayer Leverkusen", competition: "UEFA Champions League", stage: "Round of 16 · 2nd leg", score: "7–1", url: f },
  { id: "m-2014-06-15", date: "2014-06-15", year: 2014, type: "International", team: "Argentina", opponent: "Bosnia and Herzegovina", competition: "FIFA World Cup", stage: "Group F", score: "2–1", url: f },
  { id: "m-2015-06-06", date: "2015-06-06", year: 2015, type: "Club", team: "Barcelona", opponent: "Juventus", competition: "UEFA Champions League", stage: "Final", score: "3–1", url: f },
  { id: "m-2017-03-08", date: "2017-03-08", year: 2017, type: "Club", team: "Barcelona", opponent: "Paris Saint-Germain", competition: "UEFA Champions League", stage: "Round of 16 · 2nd leg", score: "6–1", url: f },
  { id: "m-2017-04-23", date: "2017-04-23", year: 2017, type: "Club", team: "Barcelona", opponent: "Real Madrid", competition: "La Liga", stage: "Matchday 33", score: "3–2", url: `${f}/matches/real-madrid-fc-barcelona-liga-1-division-2016-2017` },
  { id: "m-2018-10-28", date: "2018-10-28", year: 2018, type: "Club", team: "Barcelona", opponent: "Real Madrid", competition: "La Liga", stage: "Matchday 10", score: "5–1", url: `${f}/matches/fc-barcelona-real-madrid-liga-1-division-2018-2019` },
  { id: "m-2019-05-01", date: "2019-05-01", year: 2019, type: "Club", team: "Barcelona", opponent: "Liverpool", competition: "UEFA Champions League", stage: "Semi-final · 1st leg", score: "3–0", url: f },
  { id: "m-2021-07-10", date: "2021-07-10", year: 2021, type: "International", team: "Argentina", opponent: "Brazil", competition: "Copa América", stage: "Final", score: "1–0", url: f },
  { id: "m-2021-08-10", date: "2021-08-10", year: 2021, type: "Club", team: "Paris Saint-Germain", opponent: "New chapter", competition: "Ligue 1", stage: "A new beginning", score: "—", url: f },
  { id: "m-2022-12-18", date: "2022-12-18", year: 2022, type: "International", team: "Argentina", opponent: "France", competition: "FIFA World Cup", stage: "Final", score: "3–3 (4–2 pens)", url: f },
  { id: "m-2023-08-19", date: "2023-08-19", year: 2023, type: "Club", team: "Inter Miami", opponent: "Nashville SC", competition: "Leagues Cup", stage: "Final", score: "1–1 (10–9 pens)", url: f },
  { id: "m-2024-07-14", date: "2024-07-14", year: 2024, type: "International", team: "Argentina", opponent: "Colombia", competition: "Copa América", stage: "Final", score: "1–0", url: f },
  { id: "m-2025-06-29", date: "2025-06-29", year: 2025, type: "Club", team: "Inter Miami", opponent: "Palmeiras", competition: "FIFA Club World Cup", stage: "Round of 16", score: "0–0", url: f },
];
