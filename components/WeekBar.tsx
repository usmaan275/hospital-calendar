"use client";

import { useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, subWeeks, isSameDay } from "date-fns";

import { getWeekDays, formatDayLabel, formatDayNumber } from "@/lib/dates";

interface Props {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  weekDate: Date;
  setWeekDate: (date: Date) => void;
  onToday: () => void;
}

const SNAP_THRESHOLD = 0.2;
const SNAP_DURATION = 320;
const EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export default function WeekBar({ selectedDay, onSelectDay, weekDate, setWeekDate, onToday }: Props) {
  const weekDays = getWeekDays(weekDate);
  const viewingToday = isSameDay(selectedDay, new Date());

  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const weekDateRef = useRef(weekDate);
  weekDateRef.current = weekDate;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);

  function getWidth() {
    return containerRef.current?.offsetWidth ?? window.innerWidth;
  }

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translateX(${-getWidth()}px)`;
  }, []);

  function setTranslate(px: number, animated: boolean) {
    const el = stripRef.current;
    if (!el) return;
    el.style.transition = animated ? `transform ${SNAP_DURATION}ms ${EASING}` : "none";
    el.style.transform = `translateX(${-getWidth() + px}px)`;
  }

  const snapTo = useCallback((direction: "prev" | "next" | "center") => {
    if (isAnimating.current) return;

    if (direction === "center") {
      isAnimating.current = true;
      setTranslate(0, true);
      setTimeout(() => { isAnimating.current = false; }, SNAP_DURATION);
      return;
    }

    isAnimating.current = true;
    const width = getWidth();
    setTranslate(direction === "next" ? -width : width, true);

    setTimeout(() => {
      const newWeekDate =
        direction === "next"
          ? addWeeks(weekDateRef.current, 1)
          : subWeeks(weekDateRef.current, 1);

      const el = stripRef.current;
      if (el) {
        el.style.transition = "none";
        el.style.transform = `translateX(${-width}px)`;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
      }

      setWeekDate(newWeekDate);
      isAnimating.current = false;
    }, SNAP_DURATION);
  }, [setWeekDate]);

  // Native touch listeners with { passive: false } so preventDefault actually works
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onTouchStart(e: TouchEvent) {
      if (isAnimating.current) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontal.current = null;
    }

    function onTouchMove(e: TouchEvent) {
      if (isAnimating.current || touchStartX.current === null || touchStartY.current === null) return;

      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      // Axis lock: wait for first 6px of movement to decide direction
      if (isHorizontal.current === null) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          isHorizontal.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }

      if (!isHorizontal.current) return;

      e.preventDefault(); // works because listener is non-passive
      setTranslate(dx, false);
    }

    function onTouchEnd(e: TouchEvent) {
      if (!isHorizontal.current || touchStartX.current === null) {
        touchStartX.current = null;
        touchStartY.current = null;
        isHorizontal.current = null;
        return;
      }

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const threshold = getWidth() * SNAP_THRESHOLD;

      touchStartX.current = null;
      touchStartY.current = null;
      isHorizontal.current = null;

      if (dx < -threshold) snapTo("next");
      else if (dx > threshold) snapTo("prev");
      else snapTo("center");
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [snapTo]);

  const weeks = [
    getWeekDays(subWeeks(weekDate, 1)),
    weekDays,
    getWeekDays(addWeeks(weekDate, 1)),
  ];

  return (
    <div className="sticky top-0 z-20 bg-[#070B14] border-b border-white/10">
      <div className="relative px-2 py-3">

        {/* FIXED ARROWS */}
        <button onClick={() => snapTo("prev")} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 z-10">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => snapTo("next")} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 z-10">
          <ChevronRight size={20} />
        </button>

        {/* SWIPEABLE DATE STRIP */}
        <div ref={containerRef} className="overflow-hidden mx-9">
          <div
            ref={stripRef}
            className="flex"
            style={{
              width: "300%",
              willChange: "transform",
            }}
          >
            {weeks.map((days, wi) => (
              <div key={wi} style={{ width: "33.333%" }}>
                <div className="flex justify-between">
                  {days.map((day) => {
                    const selected = isSameDay(day, selectedDay);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => onSelectDay(day)}
                        className="flex flex-col items-center"
                      >
                        <span className="text-xs text-slate-400">
                          {formatDayLabel(day)}
                        </span>
                        <div className={`
                          mt-1 h-10 w-10 rounded-full flex items-center justify-center text-sm transition
                          ${selected ? "bg-blue-600 text-white" : "bg-transparent"}
                        `}>
                          {formatDayNumber(day)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TODAY BUTTON */}
      <div className="flex justify-center">
        <button
          onClick={onToday}
          disabled={viewingToday}
          className={`
            px-8 py-2 rounded-lg transition mb-4
            ${viewingToday ? "opacity-50 cursor-not-allowed bg-white/10" : "bg-blue-600 hover:bg-blue-500"}
          `}
        >
          Today
        </button>
      </div>
    </div>
  );
}