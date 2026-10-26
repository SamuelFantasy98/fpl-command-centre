
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://fantasy.premierleague.com/api";
const TEAM_ID = 4727294;

async function getFpl(path) {
  const response = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "FPLCommandCentre/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`FPL API returned ${response.status}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const [bootstrap, team, history] = await Promise.all([
      getFpl("/bootstrap-static/"),
      getFpl(`/entry/${TEAM_ID}/`),
      getFpl(`/entry/${TEAM_ID}/history/`)
    ]);

    const currentGameweek = bootstrap.events.find(
      (event) => event.is_current
    );

    const gameweek = currentGameweek?.id ??
      bootstrap.events.find((event) => event.is_next)?.id ??
      1;

    const [picks, fixtures, transfers] = await Promise.all([
      getFpl(`/entry/${TEAM_ID}/event/${gameweek}/picks/`),
      getFpl("/fixtures/"),
      getFpl(`/entry/${TEAM_ID}/transfers/`)
    ]);

    return NextResponse.json({
      teamId: TEAM_ID,
      updatedAt: new Date().toISOString(),
      gameweek,
      bootstrap,
      team,
      history,
      picks,
      fixtures,
      transfers
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 502 }
    );
  }
}
