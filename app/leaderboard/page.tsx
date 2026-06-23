"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Visit } from "@/types/visit";

const NAME_MAP: Record<string, string> = {
  "boro mama": "Minar",
  "bhaisab": "Minar",

  "salma": "Salma",
  "boro mami": "Salma",

  "abu": "Abu Bakr",
  "abu bakr": "Abu Bakr",
};

function normaliseName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getDisplayName(name: string) {
  const key = normaliseName(name);
  return NAME_MAP[key] ?? name.trim();
}

export default function LeaderboardPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("visits")
        .select("*");

      setVisits((data as Visit[]) || []);
      setLoading(false);
    }

    load();
  }, []);

  const leaderboard = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const visit of visits) {
      const name = getDisplayName(visit.name);

      const start = new Date(visit.start_time);
      const end = new Date(visit.end_time);

      const hours =
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60);

      totals[name] =
        (totals[name] || 0) + hours;
    }

    return Object.entries(totals)
      .map(([name, hours]) => ({
        name,
        hours,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [visits]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-[3px] border-blue-600/30 border-t-blue-600 animate-spin" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  function getMedal(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        Leaderboard
      </h1>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.name}
            className="
              flex justify-between items-center
              rounded-xl p-4
              bg-white/5
              border border-white/10
              transition
              hover:bg-white/10
            "
          >
            <div className="flex items-center gap-3">
              <span className="text-lg w-8">
                {getMedal(index)}
              </span>

              <span className="font-medium">
                {entry.name}
              </span>
            </div>

            <span className="text-slate-300">
              {entry.hours.toFixed(1)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}