"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { fetchSecurityQuestions, submitResetPassword } from "@/services/auth/client";

export default function ResetPasswordPage() {
    const router = useRouter();

    // step 1: email
    const [email, setEmail] = useState("");
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // step 2: answers + new password
    const [step, setStep] = useState<1 | 2>(1);
    const [question1, setQuestion1] = useState("");
    const [question2, setQuestion2] = useState("");
    const [answer1, setAnswer1] = useState("");
    const [answer2, setAnswer2] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loadingReset, setLoadingReset] = useState(false);

    const handleFetchQuestions = async () => {
        if (!email.trim()) { toast.error("Please enter your email."); return; }
        try {
            setLoadingQuestions(true);
            const data = await fetchSecurityQuestions(email.trim());
            setQuestion1(data.question1);
            setQuestion2(data.question2);
            setStep(2);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const validateReset = (): string | null => {
        if (!answer1.trim()) return "Please answer the first security question.";
        if (!answer2.trim()) return "Please answer the second security question.";
        if (!newPassword) return "Please enter a new password.";
        if (newPassword.length < 12) return "Password must be at least 12 characters.";
        if (!/[0-9]/.test(newPassword)) return "Password must include at least one number.";
        if (!/[a-z]/.test(newPassword)) return "Password must include at least one lowercase letter.";
        if (!/[A-Z]/.test(newPassword)) return "Password must include at least one uppercase letter.";
        if (newPassword !== confirmPassword) return "Passwords do not match.";
        return null;
    };

    const handleReset = async () => {
        const error = validateReset();
        if (error) { toast.error(error); return; }
        try {
            setLoadingReset(true);
            await submitResetPassword(email.trim(), answer1, answer2, newPassword);
            toast.success("Password reset successfully. Please log in.");
            router.push("/auth/login");
        } catch (err: any) {
            // answers/password fields are NOT cleared on failure
            toast.error(err.message);
        } finally {
            setLoadingReset(false);
        }
    };

    return (
        <div className="flex items-center justify-center px-6 sm:px-10 py-12 bg-background w-full">
            <div className="w-full max-w-md space-y-8">
                {/* Mobile Only */}
                <div className="lg:hidden flex items-center justify-center select-none">
                    <Image src={"/logo-full.png"} alt="Markify Logo" height={0} width={260} />
                </div>

                <div className="space-y-2 select-none">
                    <h2 className="text-2xl font-semibold">Reset Password</h2>
                    <p className="text-sm text-muted-foreground">
                        {step === 1
                            ? "Enter your email to retrieve your security questions."
                            : "Answer your security questions and set a new password."}
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">Email</label>
                            <Input
                                type="email"
                                placeholder="example@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loadingQuestions}
                                className="h-10"
                            />
                        </div>
                        <Button
                            className="w-full h-11 cursor-pointer"
                            onClick={handleFetchQuestions}
                            disabled={loadingQuestions || !email}
                        >
                            {loadingQuestions ? "Looking up..." : "Continue"}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 mb-2!">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">{question1}</label>
                            <Input
                                type="text"
                                placeholder="Your answer"
                                value={answer1}
                                onChange={(e) => setAnswer1(e.target.value)}
                                disabled={loadingReset}
                                className="h-10"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">{question2}</label>
                            <Input
                                type="text"
                                placeholder="Your answer"
                                value={answer2}
                                onChange={(e) => setAnswer2(e.target.value)}
                                disabled={loadingReset}
                                className="h-10"
                            />
                        </div>

                        <Separator className="my-4 bg-foreground/20" />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">New Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loadingReset}
                                    className="h-10 pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Must be at least 12 characters and include an uppercase letter, a lowercase letter, and a number.
                            </p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">Confirm New Password</label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loadingReset}
                                    className="h-10 pr-10"
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            className="w-full h-11 cursor-pointer"
                            onClick={handleReset}
                            disabled={loadingReset || !answer1 || !answer2 || !newPassword || !confirmPassword}
                        >
                            {loadingReset ? "Resetting..." : "Reset Password"}
                        </Button>

                        <button
                            onClick={() => setStep(1)}
                            className="w-full text-sm text-muted-foreground hover:underline cursor-pointer text-center"
                            disabled={loadingReset}
                        >
                            Use a different email
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-center gap-1">
                    <span className="text-foreground/70 select-none">Remembered your password?</span>
                    <a className="text-primary hover:underline cursor-pointer" href="/auth/login">Log in</a>
                </div>
            </div>
        </div>
    );
}