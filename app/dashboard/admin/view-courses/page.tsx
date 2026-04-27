"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, GraduationCap, LibraryBig, Pencil, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { authClient } from "@/services/auth/client";
import { toast } from "sonner";
import { fetchCourses, fetchCourseClasses, updateCourseClient } from "@/services/admin/client";
import { CourseSummary, CourseClass } from "@/services/admin/types";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ViewCoursesPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const institution = session?.user?.institution ?? "Your Institution";

    const [courses, setCourses] = useState<CourseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    // view modal
    const [viewCourse, setViewCourse] = useState<CourseSummary | null>(null);
    const [classes, setClasses] = useState<CourseClass[]>([]);
    const [classesLoading, setClassesLoading] = useState(false);

    // edit modal
    const [editCourse, setEditCourse] = useState<CourseSummary | null>(null);
    const [editCode, setEditCode] = useState("");
    const [editName, setEditName] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        fetchCourses()
            .then(setCourses)
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load courses."))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return courses;
        return courses.filter(
            (c) =>
                c.code.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q) ||
                c.id.toLowerCase().includes(q)
        );
    }, [query, courses]);

    const handleViewClasses = async (course: CourseSummary) => {
        setViewCourse(course);
        setClasses([]);
        setClassesLoading(true);
        try {
            setClasses(await fetchCourseClasses(course.id));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load classes.");
        } finally {
            setClassesLoading(false);
        }
    };

    const openEdit = (course: CourseSummary) => {
        setEditCourse(course);
        setEditCode(course.code);
        setEditName(course.name);
    };

    const handleEdit = async () => {
        if (!editCourse) return;
        if (!editCode.trim()) { 
            toast.error("Course code is required."); 
            return; 
        }
        if (!editName.trim()) { 
            toast.error("Course name is required."); 
            return; 
        }
        if (editCode.trim().toUpperCase() === editCourse.code && editName.trim() === editCourse.name) {
            toast.error("No changes were made.");
            return;
        }

        setEditLoading(true);
        try {
            await updateCourseClient(editCourse.id, { code: editCode, name: editName });
            setCourses((prev) =>
                prev.map((c) =>
                    c.id === editCourse.id
                        ? { ...c, code: editCode.trim().toUpperCase(), name: editName.trim() }
                        : c
                )
            );
            toast.success("Course updated successfully.");
            setEditCourse(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update course.");
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground mb-4" onClick={() => router.push("/dashboard/admin")}>
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </Button>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Institution</p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{institution}</h1>
                <p className="text-sm text-muted-foreground mt-1">All courses registered on Markify in your institution.</p>
            </motion.div>

            {/* stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardContent className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LibraryBig className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Courses</p>
                            <p className="text-xl font-semibold text-foreground">{loading ? "—" : courses.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Showing</p>
                            <p className="text-xl font-semibold text-foreground">{loading ? "—" : filtered.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                <Card>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-border border-b pb-4">
                            <h3 className="text-lg font-semibold">Courses</h3>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Search by code or name" value={query} onChange={(e) => setQuery(e.target.value)} className="px-9 bg-foreground/3" />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 text-muted-foreground">Course</TableHead>
                                    <TableHead className="text-muted-foreground">Course Code</TableHead>
                                    <TableHead className="text-muted-foreground">Registered</TableHead>
                                    <TableHead className="text-center text-muted-foreground">No. of Classes</TableHead>
                                    <TableHead className="text-center pr-6 text-muted-foreground">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            {query ? "No courses match your search." : "No courses found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                        <BookOpen className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{c.name}</p>
                                                        <p className="text-xs font-mono text-muted-foreground">{c.id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono text-muted-foreground">{c.code}</span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(c.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {c._count.classes}
                                            </TableCell>
                                            <TableCell className="text-center pr-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleViewClasses(c)}>
                                                        View
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => openEdit(c)}>
                                                        Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

            {/* view modal */}
            <Dialog open={!!viewCourse} onOpenChange={(open) => { if (!open) setViewCourse(null); }}>
                <DialogContent className="max-w-sm sm:max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <BookOpen className="w-4 h-4" /> {viewCourse?.name}
                        </DialogTitle>
                        <span className="text-sm text-muted-foreground font-mono text-left">{viewCourse?.code}</span>
                    </DialogHeader>

                    {classesLoading ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">Loading classes...</p>
                    ) : classes.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">No classes have been created under this course yet.</p>
                    ) : (
                        <div className="space-y-3 mt-2">
                            {classes.map((cls) => (
                                <div key={cls.id} className="border border-border rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="w-4 h-4 text-primary shrink-0 my-auto" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-foreground">{cls.code}</p>
                                                    <p className="text-xs text-muted-foreground">{cls.lecturer.name ?? cls.lecturer.email}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {cls._count.enrollments} student{cls._count.enrollments !== 1 ? "s" : ""}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{cls.academicYear}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* edit modal */}
            <Dialog open={!!editCourse} onOpenChange={(open) => { if (!open) setEditCourse(null); }}>
                <DialogContent className="max-w-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <Pencil className="w-4 h-4" /> Edit Course
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">Course Code</label>
                            <Input
                                value={editCode}
                                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                placeholder="e.g. CS101"
                                disabled={editLoading}
                                className="h-10"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">Course Name</label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="e.g. Introduction to Computer Science"
                                disabled={editLoading}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditCourse(null)} disabled={editLoading} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={editLoading || !editCode.trim() || !editName.trim()} className="cursor-pointer">
                            {editLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}