"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, Trash2, Users, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClassSummary } from "@/services/classes/types";
import { getAccentColor } from "@/lib/accent-color";

interface LecturerClassCardProps {
    cls: ClassSummary;
    index?: number;
    onDelete?: (cls: ClassSummary) => void;
    deleting?: boolean;
}

export function LecturerClassCard({ cls, index = 0, onDelete, deleting = false, }: LecturerClassCardProps) {
    const color = getAccentColor(cls.classId);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.04 }}>
            <Card className="group relative overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="flex items-stretch">
                    {/* left color accent */}
                    <div className="w-1.5 shrink-0" style={{ backgroundColor: `hsl(${color})` }} />

                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                        {/* icon and identity */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="hidden sm:flex w-11 h-11 rounded-md items-center justify-center shrink-0" style={{ backgroundColor: `hsl(${color} / 0.12)` }}>
                                <BookOpen className="w-5 h-5" style={{ color: `hsl(${color})` }} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="secondary" className="text-xs font-mono">
                                        {cls.courseCode}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {cls.classCode}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                        {cls.academicYear}
                                    </Badge>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug truncate">
                                    {cls.courseName}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{cls.students} students</span>
                                </div>
                            </div>
                        </div>

                        {/* actions */}
                        <div className="flex items-center gap-2 sm:shrink-0">
                            <Link href={`/course/${cls.classId}`} className="flex-1 sm:flex-none">
                                <Button variant="default" size="sm" className="w-full gap-1.5">
                                    <Eye className="w-3.5 h-3.5" />
                                    View Class
                                </Button>
                            </Link>
                            {onDelete && (
                                <Button variant="ghost" size="sm" disabled={deleting} className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(cls)}>
                                    {deleting
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Trash2 className="w-3.5 h-3.5" />
                                    }
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}