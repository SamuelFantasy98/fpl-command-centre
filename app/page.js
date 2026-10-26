
"use client";

import { useEffect, useState } from "react";

const money = (value) =>
  value == null ? "—" : `£${(value / 10).toFixed(1)}m`;

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Squad");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/fpl", {
        cache: "no-store"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load FPL data");
      }

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const players = data?.bootstrap?.elements || [];
  const teams = data?.bootstrap?.teams || [];
  const picks = data?.picks?.picks || [];

  const squad = picks.map((pick) => {
    const player = players.find((p) => p.id === pick.element);
    const club = teams.find((t) => t.id === player?.team);

    return {
      ...pick,
      name: player?.web_name || "Unknown",
      club: club?.short_name || "",
      position: player?.element_type,
      price: player?.now_cost,
      total: player?.total_points,
      form: player?.form,
      points: player?.event_points
    };
  });

  const starters = squad.filter((p) => p.position <= 11);
  const bench = squad.filter((p) => p.position > 11);

  const sections = [
    "Squad", "Fixtures", "Transfers", "Leagues"
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#071d1c",
      color: "#f5fff9",
      fontFamily: "Arial, sans-serif",
      padding: "24px",
      maxWidth: 1100,
      margin: "auto"
    }}>
      <header style={{ marginBottom: 30 }}>
        <div style={{ color: "#5bf0b5", fontWeight: 700 }}>
          FPL COMMAND CENTRE
        </div>
        <h1 style={{ fontSize: 32, marginBottom: 5 }}>
          {data?.team?.name || "My Fantasy Team"}
        </h1>
        <p style={{ color: "#9bb8ae" }}>
          Team 4727294 · Gameweek {data?.gameweek || "—"}
        </p>
        <button onClick={refresh} disabled={loading}
          style={buttonStyle}>
          {loading ? "Loading..." : "Refresh FPL Data"}
        </button>
      </header>

      {error && (
        <div style={{
          padding: 16,
          background: "#56282d",
          borderRadius: 12,
          marginBottom: 20
        }}>
          Connection error: {error}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 24
      }}>
        <Stat label="Total Points"
          value={data?.team?.summary_overall_points} />
        <Stat label="Overall Rank"
          value={data?.team?.summary_overall_rank?.toLocaleString()} />
        <Stat label="GW Points"
          value={data?.team?.summary_event_points} />
        <Stat label="Team Value"
          value={money(data?.team?.last_deadline_value)} />
      </div>

      <nav style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        marginBottom: 20
      }}>
        {sections.map((section) => (
          <button key={section}
            onClick={() => setTab(section)}
            style={{
              ...buttonStyle,
              background: tab === section ? "#5bf0b5" : "#173632",
              color: tab === section ? "#071d1c" : "white"
            }}>
            {section}
          </button>
        ))}
      </nav>

      {tab === "Squad" && (
        <section>
          <h2>Starting XI</h2>
          <div style={gridStyle}>
            {squad.filter((p) => p.position <= 11).map((p) => (
              <Player key={p.element} player={p} />
            ))}
          </div>
          <h2>Bench</h2>
          <div style={gridStyle}>
            {squad.filter((p) => p.position > 11).map((p) => (
              <Player key={p.element} player={p} />
            ))}
          </div>
        </section>
      )}

      {tab === "Fixtures" && (
        <section>
          <h2>Upcoming Fixtures</h2>
          {(data?.fixtures || [])
            .filter((f) => !f.finished)
            .slice(0, 20)
            .map((f) => (
              <div key={f.id} style={cardStyle}>
                {teams.find((t) => t.id === f.team_h)?.short_name}
                {" vs "}
                {teams.find((t) => t.id === f.team_a)?.short_name}
                <div style={{ color: "#9bb8ae", fontSize: 13 }}>
                  {f.kickoff_time
                    ? new Date(f.kickoff_time).toLocaleString("en-AU")
                    : "TBC"}
                </div>
              </div>
            ))}
        </section>
      )}

      {tab === "Transfers" && (
        <section>
          <h2>Transfer History</h2>
          {(data?.transfers || []).length === 0
            ? <p>No transfers available.</p>
            : data.transfers.slice(0, 20).map((t, i) => (
              <div key={i} style={cardStyle}>
                GW{t.event}:{" "}
                {players.find((p) => p.id === t.element_out)?.web_name || "Unknown"}
                {" → "}
                {players.find((p) => p.id === t.element_in)?.web_name || "Unknown"}
              </div>
            ))}
        </section>
      )}

      {tab === "Leagues" && (
        <section>
          <h2>Your Mini-Leagues</h2>
          {(data?.team?.leagues?.classic || []).map((league) => (
            <div key={league.id} style={cardStyle}>
              <strong>{league.name}</strong>
              <div style={{ color: "#9bb8ae" }}>
                League ID: {league.id}
              </div>
            </div>
          ))}
        </section>
      )}

      <footer style={{
        marginTop: 40,
        color: "#9bb8ae",
        fontSize: 12
      }}>
        Public FPL data · Unofficial dashboard ·
        Last updated: {data?.updatedAt
          ? new Date(data.updatedAt).toLocaleString("en-AU")
          : "Not loaded"}
      </footer>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div style={cardStyle}>
      <div style={{ color: "#9bb8ae", fontSize: 13 }}>
        {label}
      </div>
      <div style={{
        fontSize: 26,
        fontWeight: 800,
        marginTop: 8
      }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function Player({ player }) {
  return (
    <div style={cardStyle}>
      <strong>
        {player.name}
        {player.is_captain ? " (C)" : ""}
        {player.is_vice_captain ? " (VC)" : ""}
      </strong>
      <div style={{ color: "#9bb8ae", fontSize: 13 }}>
        {player.club}
      </div>
      <div style={{ marginTop: 8 }}>
        {money(player.price)} · {player.total ?? "—"} pts
      </div>
      <div style={{ color: "#5bf0b5", fontSize: 13 }}>
        Form: {player.form ?? "—"}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#12312e",
  border: "1px solid #245048",
  padding: 16,
  borderRadius: 14,
  marginBottom: 8
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 24
};

const buttonStyle = {
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap"
};
