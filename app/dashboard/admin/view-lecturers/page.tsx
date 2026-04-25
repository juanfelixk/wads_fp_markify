"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, GraduationCap, Mail, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAllLecturers } from "@/services/admin/client";
import { authClient } from "@/services/auth/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchLecturerClasses } from "@/services/classes/client";
import { LecturerOrStudent, LecturerClass } from "@/services/admin/types";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const initials = (name: string) => (name ?? "").replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, "").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export default function ViewLecturersPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const institution = session?.user?.institution ?? "Your Institution";
    const [lecturers, setLecturers] = useState<LecturerOrStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    // modal state
    const [selectedLecturer, setSelectedLecturer] = useState<LecturerOrStudent | null>(null);
    const [classes, setClasses] = useState<LecturerClass[]>([]);
    const [classesLoading, setClassesLoading] = useState(false);

    useEffect(() => {
        fetchAllLecturers()
            .then(setLecturers)
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load lecturers."))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return lecturers;
        return lecturers.filter(
            (l) => l.name?.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
        );
    }, [query, lecturers]);

    const handleViewClasses = async (lecturer: LecturerOrStudent) => {
        setSelectedLecturer(lecturer);
        setClasses([]);
        setClassesLoading(true);
        try {
            const data = await fetchLecturerClasses(lecturer.id);
            setClasses(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load classes.");
        } finally {
            setClassesLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
                <Button variant="ghost" size="lg" className="gap-2 cursor-pointer hover:bg-foreground/10 text-muted-foreground mb-4" onClick={() => router.push("/dashboard/admin")}>
                    <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </Button>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Institution</p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{institution}</h1>
                <p className="text-sm text-muted-foreground mt-1">All lecturers using Markify services in your institution.</p>
            </motion.div>

            {/* stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardContent className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Lecturers</p>
                            <p className="text-xl font-semibold text-foreground">{loading ? "—" : lecturers.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Showing</p>
                            <p className="text-xl font-semibold text-foreground">{loading ? "-" : filtered.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                <Card>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-border border-b pb-4">
                            <h3 className="text-lg font-semibold">Lecturers</h3>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="px-9 bg-foreground/3" />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 text-muted-foreground">Full Name</TableHead>
                                    <TableHead className="text-muted-foreground">Email</TableHead>
                                    <TableHead className="text-muted-foreground">Joined</TableHead>
                                    <TableHead className="text-center pr-6 text-muted-foreground">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            {query ? "No lecturers match your search." : "No lecturers found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((l) => (
                                        <TableRow key={l.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-9 h-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                            {initials(l.name ?? "")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">{l.name ?? "—"}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{l.id}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                    <Mail className="w-3.5 h-3.5" /> {l.email}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(l.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-center pr-6">
                                                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleViewClasses(l) }>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>

            {/* modal */}
            <Dialog open={!!selectedLecturer} onOpenChange={(open) => { if (!open) setSelectedLecturer(null); }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Classes of {selectedLecturer?.name ?? "Lecturer"}
                        </DialogTitle>
                        <span className="flex items-center text-sm text-muted-foreground gap-2">
                            <Mail className="w-3.5 h-3.5" /> {selectedLecturer?.email}
                        </span>
                    </DialogHeader>

                    {classesLoading ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">Loading classes...</p>
                    ) : classes.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground text-sm">This lecturer has no classes yet.</p>
                    ) : (
                        <div className="space-y-3 mt-2">
                            {classes.map((cls) => (
                                <div key={cls.id} className="border border-border rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="w-4 h-4 text-primary shrink-0 my-auto" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-foreground">{cls.course.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{cls.course.code}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {cls._count.enrollments} student{cls._count.enrollments !== 1 ? "s" : ""}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{cls.code} · {cls.academicYear}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}