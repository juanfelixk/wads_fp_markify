import { redirect } from "next/navigation";
import { getSession } from "@/modules/auth/server";
import Image from "next/image";
import { CircleCheckBig, FileText, PencilLine, Circle } from "lucide-react";

export default async function AuthLayout({children,}: {children: React.ReactNode;}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return (
    <div className="min-h-screen grid lg:grid-cols-[35%_65%]">
        {/* Left Panel - Large Screens Only */}
        <div className="hidden lg:flex flex-col justify-center bg-primary text-primary-foreground px-20 border-r border-primary-foreground/10 select-none relative overflow-hidden">

            <Circle className="absolute -top-20 -left-20 w-[400px] h-[400px] text-white/10" strokeWidth={.1} />
            <Circle className="absolute bottom-[-250px] right-[-200px] w-[700px] h-[700px] text-white/10" strokeWidth={.1} />

            <div className="max-w-md space-y-11">
                <div className="space-y-8">
                    <div>
                        <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight">
                            <Image src="/logo-white-bg.svg" alt="Markify Logo" height={50} width={50} className="rounded-lg" priority />
                            Markify
                        </h1>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-semibold">
                            AI-Powered Essay Grading
                        </p>
                        <p className="text-lg text-primary-foreground/70 leading-relaxed">
                            Elevate academic assessment with intelligent, rubric-aligned
                            feedback that helps students grow.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="inline-flex items-center gap-2">
                        <CircleCheckBig className="w-5 h-5 shrink-0" />
                        Rubric-aligned AI grading
                    </span>

                    <span className="inline-flex items-center gap-2">
                        <PencilLine className="w-5 h-5 shrink-0" />
                        Inline feedback & annotations
                    </span>

                    <span className="inline-flex items-center gap-2">
                        <FileText className="w-5 h-5 shrink-0" />
                        Revision history tracking
                    </span>
                </div>
            </div>
        </div>

        {children}

    </div>
  );
}