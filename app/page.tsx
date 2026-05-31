"use client";

import { useState, useRef } from "react";

import WeekBar from "@/components/WeekBar";
import DayView from "@/components/DayView";

export default function HomePage() {
  const today = new Date();

  const [selectedDay, setSelectedDay] =
    useState(today);

  const [weekDate, setWeekDate] =
    useState(today);

  const touchStartX =
    useRef<number | null>(null);

  const touchStartY =
    useRef<number | null>(null);

  function handleTouchStart(
    e: React.TouchEvent
  ) {
    touchStartX.current =
      e.touches[0].clientX;

    touchStartY.current =
      e.touches[0].clientY;
  }

  function handleTouchEnd(
    e: React.TouchEvent
  ) {
    if (
      touchStartX.current === null ||
      touchStartY.current === null
    )
      return;
  
    const diffX =
      e.changedTouches[0].clientX -
      touchStartX.current;
  
    const diffY =
      e.changedTouches[0].clientY -
      touchStartY.current;
  
    // User mostly scrolled vertically
    if (
      Math.abs(diffY) >
      Math.abs(diffX)
    ) {
      return;
    }
  
    if (Math.abs(diffX) < 120) {
      return;
    }
  
    const nextDay = new Date(
      selectedDay
    );

    if (diffX < 0) {
      nextDay.setDate(
        nextDay.getDate() + 1
      );
    } else {
      nextDay.setDate(
        nextDay.getDate() - 1
      );
    }

    setSelectedDay(nextDay);
    setWeekDate(nextDay);

    touchStartX.current = null;
    touchStartY.current = null;
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <WeekBar
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        weekDate={weekDate}
        setWeekDate={setWeekDate}
        onToday={() => {
          const today = new Date();
      
          setSelectedDay(today);
          setWeekDate(today);
        }}
      />

      <DayView
        selectedDay={selectedDay}
      />
    </main>
  );
}