import type { Metadata } from "next";

import { CalendarView } from "@/components/calendar-view";

export const metadata: Metadata = {
  title: "Academic Calendar",
  description:
    "Browse exams, deadlines, holidays and university events in chronological order.",
};

export default function CalendarPage() {
  return <CalendarView />;
}
