"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { addDays, subDays } from "date-fns";

import WeekBar from "@/components/WeekBar";
import DayView from "@/components/DayView";
import VisitForm from "@/components/VisitForm";
import { Visit } from "@/types/visit";

const SNAP_THRESHOLD = 0.2;
const SNAP_DURATION = 320;
const EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export default function HomePage() {
  const today = new Date();

  const [selectedDay, setSelectedDay] = useState(today);
  const [weekDate, setWeekDate] = useState(today);
  const [days, setDays] = useState([
    subDays(today, 1),
    today,
    addDays(today, 1),
  ]);

  // Single VisitForm instance at page level
  const [formOpen, setFormOpen] = useState(false);
  const [formVisit, setFormVisit] = useState<Visit | null>(null);
  const reloadRefs = useRef<Record<string, () => void>>({});

  function openForm(visit: Visit) {
    setFormVisit(visit);
    setFormOpen(true);
  }

  function handleSaved() {
    // Reload all three panels
    Object.values(reloadRefs.current).forEach((reload) => reload());
  }

  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);
  const isAnimating = useRef(false);
  const selectedDayRef = useRef(selectedDay);
  selectedDayRef.current = selectedDay;

  useEffect(() => {
    const el = stripRef.current;
    const width = containerRef.current?.offsetWidth ?? window.innerWidth;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translateX(${-width}px)`;
  }, []);

  function setTranslate(px: number, animated: boolean) {
    const el = stripRef.current;
    if (!el) return;
    const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth;
    el.style.transition = animated ? `transform ${SNAP_DURATION}ms ${EASING}` : "none";
    el.style.transform = `translateX(${-containerWidth + px}px)`;
  }

  const snapTo = useCallback((direction: "prev" | "next" | "center") => {
    if (isAnimating.current) return;
    const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth;

    if (direction === "center") {
      isAnimating.current = true;
      setTranslate(0, true);
      setTimeout(() => { isAnimating.current = false; }, SNAP_DURATION);
      return;
    }

    isAnimating.current = true;
    setTranslate(direction === "next" ? -containerWidth : containerWidth, true);

    setTimeout(() => {
      const current = selectedDayRef.current;
      const newDay = direction === "next" ? addDays(current, 1) : subDays(current, 1);

      const el = stripRef.current;
      if (el) {
        el.style.transition = "none";
        el.style.transform = `translateX(${-containerWidth}px)`;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
      }

      setDays([subDays(newDay, 1), newDay, addDays(newDay, 1)]);
      setSelectedDay(newDay);
      setWeekDate(newDay);
      isAnimating.current = false;
    }, SNAP_DURATION);
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    if (isAnimating.current) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (isAnimating.current || touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;
    e.preventDefault();
    setTranslate(dx, false);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isHorizontal.current || touchStartX.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      isHorizontal.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = (containerRef.current?.offsetWidth ?? window.innerWidth) * SNAP_THRESHOLD;

    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontal.current = null;

    if (dx < -threshold) snapTo("next");
    else if (dx > threshold) snapTo("prev");
    else snapTo("center");
  }

  function jumpToDay(day: Date) {
    setDays([subDays(day, 1), day, addDays(day, 1)]);
    setSelectedDay(day);
    setWeekDate(day);
    const el = stripRef.current;
    const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth;
    if (el) {
      el.style.transition = "none";
      el.style.transform = `translateX(${-containerWidth}px)`;
    }
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white overflow-hidden">
      <WeekBar
        selectedDay={selectedDay}
        onSelectDay={jumpToDay}
        weekDate={weekDate}
        setWeekDate={setWeekDate}
        onToday={() => jumpToDay(new Date())}
      />

      <div
        ref={containerRef}
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={stripRef}
          className="flex"
          style={{
            width: "300%",
            transform: "translateX(calc(-100vw))",
            willChange: "transform",
          }}
        >
          {days.map((day) => (
            <div key={day.toISOString()} style={{ width: "33.333%" }}>
              <DayView
                selectedDay={day}
                onOpenForm={openForm}
                onVisitsLoaded={(reload) => {
                  reloadRefs.current[day.toISOString()] = reload;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SINGLE MODAL INSTANCE — lives outside the carousel */}
      <VisitForm
        open={formOpen}
        setOpen={setFormOpen}
        visit={formVisit}
        onSaved={handleSaved}
      />
    </main>
  );
}