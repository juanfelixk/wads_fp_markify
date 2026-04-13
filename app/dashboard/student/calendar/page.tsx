"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchCalendarAssignments } from "@/services/assignments/client";
import { CalendarAssignment } from "@/services/assignments/types";
import { getAccentColor } from "@/lib/accent-color";
import { statusConfig } from "@/services/assignments/constants";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function formatDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function endDateKey(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
    const router = useRouter();
    const today = new Date();
    const todayKey = formatDateKey(today);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string>(todayKey);
    const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalendarAssignments()
            .then(setAssignments)
            .catch(() => toast.error("Failed to load assignments."))
            .finally(() => setLoading(false));
    }, []);

    const assignmentsByDate = useMemo(() => {
        const map: Record<string, CalendarAssignment[]> = {};
        assignments.forEach((a) => {
            const key = endDateKey(a.endDate);
            if (!map[key]) map[key] = [];
            map[key].push(a);
        });
        return map;
    }, [assignments]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = () => {
        if (currentMonth === 0) { 
            setCurrentMonth(11); setCurrentYear(currentYear - 1); 
        } else { 
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) { 
            setCurrentMonth(0); setCurrentYear(currentYear + 1); 
        } else { 
            setCurrentMonth(currentMonth + 1);
        }
    };

    const selectedAssignments = assignmentsByDate[selectedDate] ?? [];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Calendar</h1>
                </div>
                <p className="text-sm text-muted-foreground">View all your assignment deadlines across enrolled classes</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* calendar */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-2">
                    <Card className="border-border">
                        <CardContent>
                            {/* month */}
                            <div className="flex items-center justify-between mb-5">
                                <Button variant="ghost" size="icon" onClick={prevMonth} className="cursor-pointer hover:bg-foreground/10">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <h2 className="text-lg sm:text-base font-semibold text-foreground">
                                    {MONTHS[currentMonth]} {currentYear}
                                </h2>
                                <Button variant="ghost" size="icon" onClick={nextMonth} className="cursor-pointer hover:bg-foreground/10">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* day headers */}
                            <div className="grid grid-cols-7 mb-1">
                                {DAYS.map((d) => (
                                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* day cells */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                    const dayAssignments = assignmentsByDate[dateKey] ?? [];
                                    const isToday = dateKey === todayKey;
                                    const isSelected = dateKey === selectedDate;
                                    return (
                                        <button key={day} onClick={() => setSelectedDate(dateKey)}
                                            className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-start gap-0.5 transition-colors text-sm border cursor-pointer
                                                ${isToday ? "bg-primary/10 font-bold text-primary" : "text-foreground hover:bg-muted border-transparent"}
                                                ${isSelected ? "border-primary! bg-primary/5 ring-1 ring-primary/50" : ""}`}>
                                            <span className="text-sm">{day}</span>
                                            {!loading && dayAssignments.length > 0 && (
                                                <div className="flex gap-0.5 flex-wrap justify-center">
                                                    {dayAssignments.slice(0, 3).map((a) => (
                                                        <span key={a.id} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(${getAccentColor(a.classId)})` }} />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* sidebar */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card className="border-border lg:sticky lg:top-24">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold text-foreground text-base">
                                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                                </h3>
                            </div>

                            {selectedAssignments.length === 0 && (
                                <p className="text-sm text-muted-foreground">No assignments due on this date.</p>
                            )}

                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {selectedAssignments.map((a, i) => {
                                        const status = statusConfig[a.status];
                                        const accentColor = getAccentColor(a.classId);
                                        return (
                                            <motion.div key={a.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2, delay: i * 0.05 }}>
                                                <div className="rounded-lg border border-border p-3 space-y-2 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 h-full rounded-l-lg" style={{ backgroundColor: `hsl(${accentColor})` }} />
                                                    <div className="pl-3">
                                                        <p className="text-base sm:text-sm font-medium text-foreground truncate">{a.title}</p>
                                                        <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">
                                                            {a.courseName} · {a.courseCode} · {a.classCode}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between pl-3 mt-3">
                                                        <Badge variant="outline" className={`text-xs font-medium select-none ${status.className}`}>
                                                            {status.label}
                                                        </Badge>
                                                        <Button variant="outline" size="sm" className="text-xs h-7 cursor-pointer hover:bg-foreground/10" onClick={() => router.push(`/dashboard/student/class/${a.classId}/assignment/${a.id}`)}>
                                                            View
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}