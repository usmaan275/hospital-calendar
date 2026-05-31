"use client";

import { useState } from "react";

import WeekBar from "@/components/WeekBar";
import DayView from "@/components/DayView";

export default function HomePage() {
  const today = new Date();

  const [selectedDay, setSelectedDay] =
    useState(today);

  const [weekDate, setWeekDate] =
    useState(today);

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      <WeekBar
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        weekDate={weekDate}
        setWeekDate={setWeekDate}
      />

      <DayView
        selectedDay={selectedDay}
      />
    </main>
  );
}