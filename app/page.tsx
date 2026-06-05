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
  const [days, setDays] = useState([subDays(today, 1), today, addDays(today, 1)]);

  const [formOpen, setFormOpen] = useState(false);
  const [formVisit, setFormVisit] = useState<Visit | null>(null);
  const reloadRefs = useRef<Record<string, () => void>>({});

  function openForm(visit: Visit) {
    setFormVisit(visit);
    setFormOpen(true);
  }

  function handleSaved() {
    Object.values(reloadRefs.current).forEach((reload) => reload());
  }

  const stripRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const selectedDayRef = useRef(selectedDay);
  selectedDayRef.current = selectedDay;

  // Touch state in refs so native handlers can access without stale closures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);

  function getWidth() {
    return containerRef.current?.offsetWidth ?? window.innerWidth;
  }

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
    setTranslate(direction === "next" ? -getWidth() : getWidth(), true);

    setTimeout(() => {
      const current = selectedDayRef.current;
      const newDay = direction === "next" ? addDays(current, 1) : subDays(current, 1);

      const el = stripRef.current;
      if (el) {
        el.style.transition = "none";
        el.style.transform = `translateX(${-getWidth()}px)`;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
      }

      setDays([subDays(newDay, 1), newDay, addDays(newDay, 1)]);
      setSelectedDay(newDay);
      setWeekDate(newDay);
      isAnimating.current = false;
    }, SNAP_DURATION);
  }, []);

  function jumpToDay(day: Date) {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.style.transition = "opacity 400ms ease";
      carousel.style.opacity = "0";
    }
    setTimeout(() => {
      setDays([subDays(day, 1), day, addDays(day, 1)]);
      setSelectedDay(day);
      setWeekDate(day);
      const el = stripRef.current;
      if (el) {
        el.style.transition = "none";
        el.style.transform = `translateX(${-getWidth()}px)`;
      }
      if (carousel) {
        carousel.style.transition = "opacity 1000ms ease";
        carousel.style.opacity = "1";
      }
    }, 400);
  }

  // Native touch listeners with { passive: false } so preventDefault actually works
  useEffect(() => {
    // Initial fade-in on load
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.style.opacity = "0";
      requestAnimationFrame(() => {
        carousel.style.transition = "opacity 1000ms ease";
        carousel.style.opacity = "1";
      });
    }

    const el = stripRef.current;
    const width = containerRef.current?.offsetWidth ?? window.innerWidth;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translateX(${-width}px)`;

    // Recalculate on resize (e.g. orientation change)
    function onResize() {
      if (isAnimating.current) return;
      const w = containerRef.current?.offsetWidth ?? window.innerWidth;
      el!.style.transition = "none";
      el!.style.transform = `translateX(${-w}px)`;
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  return (
    <main className="min-h-screen bg-[#070B14] text-white overflow-hidden">
      <WeekBar
        selectedDay={selectedDay}
        onSelectDay={jumpToDay}
        weekDate={weekDate}
        setWeekDate={setWeekDate}
        onToday={() => jumpToDay(new Date())}
      />

      <div ref={carouselRef} style={{ opacity: 0 }}>
        <div ref={containerRef} className="overflow-hidden">
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
      </div>

      <VisitForm
        open={formOpen}
        setOpen={setFormOpen}
        visit={formVisit}
        onSaved={handleSaved}
      />
    </main>
  );
}