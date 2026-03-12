"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { authClient } from "@/modules/auth/client";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const validate = (): string | null => {
        const trimmedName = name.trim();
        if (!trimmedName) return "Name is required.";
        if (!email.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address.";
        if (password.length < 8) return "Password must be at least 8 characters.";
        if (password !== confirmPassword) return "Passwords do not match.";
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
                            <Input type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="h-10 pr-10" />
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
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="text-sm font-medium text-foreground select-none">Confirm Password</label>
                        </div>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="h-10 pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button className="w-full h-11 cursor-pointer" disabled={loading || !email || !password || !name || !confirmPassword} onClick={handleSubmit} >
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