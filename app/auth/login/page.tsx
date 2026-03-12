"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithGoogle, loginWithEmail } from "@/modules/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success("Logging in...");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      toast.success("Login success.");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      let message = "Incorrect credentials.";
      toast.error(message);
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
                        Welcome back
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Sign in to continue to Markify
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium text-foreground select-none">Email</label>
                        <Input type="email" placeholder="example@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="text-sm font-medium text-foreground select-none">Password</label>
                            <span className="text-sm text-foreground/70 hover:underline cursor-pointer">Forgot password?</span>
                        </div>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Enter your password here" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="h-10 pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    <Button className="w-full h-11 cursor-pointer" onClick={handleEmailLogin} disabled={loading || !email || !password} >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </div>

                <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground select-none">
                        or continue with
                    </span>
                </div>

                <Button variant="outline" className="w-full h-11 cursor-pointer" onClick={handleGoogleLogin} disabled={loading} >
                    <Image src={"/google.svg"} alt="Google Logo" width={20} height={20} />
                    Google
                </Button>

                <div className="flex items-center justify-center gap-1">
                    <span className="text-foreground/70 select-none">Don't have an account yet?</span>
                    <a className="text-primary hover:underline cursor-pointer" href="/auth/register">Sign up</a>
                </div>
            </div>
        </div>
    );
}