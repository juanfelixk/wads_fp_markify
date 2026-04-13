"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authClient } from "@/services/auth/client";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { data: session, refetch } = authClient.useSession();
    const [name, setName] = useState("");
    const [nameLoading, setNameLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [accounts, setAccounts] = useState<{ providerId: string }[]>([]);
    const hasPassword = accounts.some((a) => a.providerId === "credential");

    useEffect(() => {
        authClient.listAccounts().then(({ data }) => {
            if (data) setAccounts(data);
        });
        if (session?.user?.name) setName(session.user.name);
    }, [session?.user?.name]);

    const validatePassword = (): string | null => {
        if (newPassword.length < 12) return "Password must be at least 12 characters.";
        if (!/[0-9]/.test(newPassword)) return "Password must include at least one number.";
        if (!/[a-z]/.test(newPassword)) return "Password must include at least one lowercase letter.";
        if (!/[A-Z]/.test(newPassword)) return "Password must include at least one uppercase letter.";
        if (newPassword !== confirmPassword) return "Passwords do not match.";
        return null;
    };

    const handleNameUpdate = async () => {
        if (!name.trim()) { toast.error("Name cannot be empty."); return; }
        if (name.trim() === session?.user?.name) { toast.error("No changes detected."); return; }
        try {
            setNameLoading(true);
            const { error } = await authClient.updateUser({ name: name.trim() });
            if (error) { toast.error(error.message ?? "Failed to update name."); return; }
            await refetch();
            toast.success("Name updated successfully.");
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setNameLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword) { toast.error("Current password is required."); return; }
        const error = validatePassword();
        if (error) { toast.error(error); return; }
        try {
            setPasswordLoading(true);
            const { error } = await authClient.changePassword({
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            });
            if (error) { toast.error(error.message ?? "Failed to change password."); return; }
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className={hasPassword
            ? "flex flex-col items-center justify-center min-h-[calc(100vh-9rem)] px-4"
            : "flex flex-col items-center justify-center min-h-[calc(100vh-13rem)] px-4"
        }>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-lg space-y-4">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-4">
                    <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your account details</p>
                </motion.div>

                {/* name */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground select-none">Full Name</label>
                        <Input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={nameLoading} className="h-10" placeholder="Your full name" />
                    </div>
                    <Button className="w-full h-10 cursor-pointer" onClick={handleNameUpdate} disabled={nameLoading}>
                        {nameLoading ? "Saving..." : "Save Name"}
                    </Button>
                </motion.div>

                {/* password */}
                {hasPassword && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="border border-border rounded-lg p-6 space-y-4 bg-card">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">Current Password</label>
                            <div className="relative">
                                <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={passwordLoading} className="h-10 pr-10" placeholder="Enter current password" />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">New Password</label>
                            <div className="relative">
                                <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={passwordLoading} className="h-10 pr-10" placeholder="Enter new password" />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Must be at least 12 characters and include an uppercase letter, a lowercase letter, and a number.
                            </p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-foreground select-none">Confirm New Password</label>
                            <div className="relative">
                                <Input type={showNew ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={passwordLoading} className="h-10 pr-10" placeholder="Confirm new password" />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button className="w-full h-10 cursor-pointer" onClick={handlePasswordChange} disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
                            {passwordLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}