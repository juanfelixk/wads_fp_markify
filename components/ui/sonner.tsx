"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      gap={8}
      closeButton
      toastOptions={{
        classNames: {
          toast: "group-[.toaster]:bg-white group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-sm group-[.toaster]:rounded-lg group-[.toaster]:text-sm",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          closeButton: "group-[.toaster]:bg-white group-[.toaster]:border-border group-[.toaster]:text-muted-foreground hover:group-[.toaster]:bg-muted",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          success: "group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900",
          error: "group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900",
          warning: "group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900",
          info: "group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }