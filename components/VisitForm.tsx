"use client";

import { useEffect, useState } from "react";

import { Visit } from "@/types/visit";
import { supabase } from "@/lib/supabase";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  visit: Visit | null;
  onSaved: () => void;
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export default function VisitForm({
  open,
  setOpen,
  visit,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visit) return;

    setName(visit.name);

    setStart(
      new Date(visit.start_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    setEnd(
      new Date(visit.end_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    setColor(visit.color);
  }, [visit]);

  if (!open || !visit) return null;

  const currentVisit = visit;

  function buildDate(time: string) {
    const [h, m] = time.split(":");

    const d = new Date(currentVisit.start_time);

    d.setHours(Number(h), Number(m), 0, 0);

    return d;
  }

  async function save() {
    setSaving(true);

    if (!name.trim()) {
      alert("Please enter a name");
      setSaving(false);
      return;
    }

    const startDate = buildDate(start);
    const endDate = buildDate(end);

    let finalEndDate = endDate;

    // NIGHT SHIFT DETECTION
    if (endDate <= startDate) {
      finalEndDate = new Date(endDate);
      finalEndDate.setDate(finalEndDate.getDate() + 1);
    }

    if (currentVisit.id) {
      await supabase
        .from("visits")
        .update({
          name,
          start_time: startDate.toISOString(),
          end_time: finalEndDate.toISOString(),
          color,
        })
        .eq("id", currentVisit.id);
    } else {
      await supabase.from("visits").insert({
        name,
        start_time: startDate.toISOString(),
        end_time: finalEndDate.toISOString(),
        color,
      });
    }

    setSaving(false);
    setOpen(false);
    onSaved();
  }

  async function remove() {
    if (!currentVisit.id) return;

    await supabase
      .from("visits")
      .delete()
      .eq("id", currentVisit.id);

    setOpen(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center">
      <div className="w-full py-10 rounded-3xl bg-[#111827] p-5">
        <h2 className="mb-4 text-xl font-semibold">
          {currentVisit.id ? "Edit Visit" : "Create Visit"}
        </h2>

        {/* NAME */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          placeholder="Name"
          className="mb-4 w-full rounded-lg border border-white/10 bg-[#1F2937] p-3 outline-none focus:border-blue-500 transition"
          required
        />

        {/* TIME */}
        <div className="mb-4 flex gap-2">
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="flex-1 rounded-lg bg-[#1F2937] p-3 outline-none hover:bg-[#273244] transition"
          />

          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="flex-1 rounded-lg bg-[#1F2937] p-3 outline-none hover:bg-[#273244] transition"
          />
        </div>

        {/* COLORS */}
        <div className="mb-6 flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-9 w-9 rounded-full border-2 transition hover:scale-110 active:scale-95"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "white" : "transparent",
              }}
            />
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center">
          {currentVisit.id ? (
            <button
              onClick={remove}
              className="px-3 py-2 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition"
            >
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              Cancel
            </button>

            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className={`px-4 py-2 rounded-lg transition ${saving || !name.trim()
                ? "bg-blue-400 opacity-50 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98]"
                }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}