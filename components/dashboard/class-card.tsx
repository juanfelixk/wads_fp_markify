"use client";

import { Eye, Trash2, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassSummary } from "@/modules/classes/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ACCENT_COLORS = [
    "220 60% 35%",
    "160 45% 30%",
    "280 40% 35%",
    "35 55% 40%",
    "340 45% 40%",
    "190 50% 30%",
    "0 50% 40%",
    "250 45% 40%",
];

function getAccentColor(courseId: string): string {
    const sum = courseId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ACCENT_COLORS[sum % ACCENT_COLORS.length];
}

interface ClassCardProps {
    cls: ClassSummary;
    onView: () => void;
    onDelete: () => void;
}

export default function ClassCard({ cls, onView, onDelete }: ClassCardProps) {
    const color = getAccentColor(cls.classId);

    return (
        <Card className="group relative overflow-hidden hover:shadow-md transition-shadow duration-200 pt-0">
            <div className="h-2 w-full" style={{ backgroundColor: `hsl(${color})` }} />

            <CardHeader className="pt-2">
                <span className="inline-block text-xs font-mono font-medium px-2 py-0.5 rounded mb-2 w-fit bg-secondary text-secondary-foreground">
                    {cls.courseCode} — {cls.classCode}
                </span>
                <CardTitle className="text-lg leading-snug font-bold">
                    <h2>{cls.courseName}</h2>
                </CardTitle>
            </CardHeader>

            <CardContent className="pb-2 flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>{cls.lecturer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {cls.students}{" "}
                        {cls.students === 1 ? "student" : "students"}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="gap-2 pt-3 border-t border-border">
                <Button variant="default" size="sm" className="flex-1 gap-1.5 cursor-pointer" onClick={onView}>
                    <Eye className="w-3.5 h-3.5" />
                    View Class
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[60vw] sm:max-w-sm">
                        <AlertDialogHeader className="select-none">
                            <AlertDialogTitle>Drop Class</AlertDialogTitle>
                            <AlertDialogDescription className="my-2">
                                Are you sure you want to drop <span className="font-medium text-foreground">{cls.courseName}</span>? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="cursor-pointer bg-destructive! text-destructive-foreground! hover:bg-destructive/90!" onClick={onDelete}>
                                Drop Class
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}