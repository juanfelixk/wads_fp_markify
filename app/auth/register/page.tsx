"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { authClient } from "@/services/auth/client";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [courseCode, setCourseCode] = useState("");
    const [classCode, setClassCode] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [enrollmentKey, setEnrollmentKey] = useState("");

    const validate = (): string | null => {
        const trimmedName = name.trim();
        if (!trimmedName) return "Name is required.";
        if (!email.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address.";
        if (password !== confirmPassword) return "Passwords do not match.";
        if (password.length < 12) return "Password must be at least 12 characters.";
        if (!/[0-9]/.test(password)) return "Password must include at least one number.";
        if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
        if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
        if (!courseCode.trim()) return "Course code is required.";
        if (!classCode.trim()) return "Class code is required.";
        if (!academicYear.trim()) return "Academic year is required.";
        if (!/^\d{4}\/\d{4}$/.test(academicYear.trim())) return "Academic year must be in format e.g. 2024/2025.";
        if (!enrollmentKey.trim()) return "Enrollment key is required.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validate();

        if (error) {
            toast.error(error);
            return;
        }

        try {
            setLoading(true);
            const image = getAvatarUrl(name);
            const { data, error } = await authClient.signUp.email({
                name: name.trim(),
                email: email.trim(),
                password,
                image,
                callbackURL: "/dashboard",
                // @ts-expect-error: extra fields passed through to databaseHooks
                courseCode: courseCode.trim(),
                classCode: classCode.trim(),
                academicYear: academicYear.trim(),
                enrollmentKey: enrollmentKey.trim(),
            });
            if (error) {
                toast.error(error.message ?? "Registration failed.");
                return;
            }
            if (data) {
                toast.success("Account created successfully. Welcome!");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: unknown) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center px-6 sm:px-10 py-12 bg-background">
            <div className="w-full max-w-md space-y-8">
                {/* Mobile Only */}
                <div className="lg:hidden flex items-center justify-center select-none">
                    <Image src={"/logo-full.png"} alt="Markify Logo" height={0} width={260} />
                </div>

                <div className="space-y-2 select-none">
                    <h2 className="text-2xl font-semibold">
                        Create a Student Account
                    </h2>
                    <p className="text-sm text-muted-foreground gap-1 flex">
                        <span>Signing up as a Lecturer?</span>
                        <a className="text-primary hover:underline cursor-pointer" href="#">Learn more</a>
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="name" className="text-sm font-medium text-foreground select-none">Full Name</label>
                        <Input type="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium text-foreground select-none">Email</label>
                        <Input type="email" placeholder="example@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-10" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="text-sm font-medium text-foreground select-none">Password</label>
                        </div>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="h-10 pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Must be at least 12 characters and include an uppercase letter, a lowercase letter, and a number.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="text-sm font-medium text-foreground select-none">Confirm Password</label>
                        </div>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="h-10 pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Course Code</label>
                        <Input type="text" placeholder="e.g. CS101" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Class Code</label>
                        <Input type="text" placeholder="e.g. L1AC" value={classCode} onChange={(e) => setClassCode(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Academic Year</label>
                        <Input type="text" placeholder="e.g. 2024/2025" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Enrollment Key</label>
                        <Input type="text" placeholder="Provided by your lecturer" value={enrollmentKey} onChange={(e) => setEnrollmentKey(e.target.value)} disabled={loading} className="h-10" />
                    </div>

                    <Button className="w-full h-11 cursor-pointer" disabled={loading || !email || !password || !name || !confirmPassword || !courseCode || !classCode || !academicYear || !enrollmentKey} onClick={handleSubmit} >
                        {loading ? "Signing up..." : "Sign Up"}
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-1">
                    <span className="text-foreground/70 select-none">Already have an account?</span>
                    <a className="text-primary hover:underline cursor-pointer" href="/auth/login">Log in</a>
                </div>
            </div>
        </div>
    );
}