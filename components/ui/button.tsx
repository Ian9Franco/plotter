"use client"

import { ReactNode } from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  let base = "rounded-lg font-medium transition-all focus:outline-none"
  let variants: Record<string, string> = {
    default: "bg-green-600 text-white hover:bg-green-700",
    outline: "bg-transparent border border-gray-700 text-white hover:bg-gray-700",
    ghost: "bg-transparent text-white hover:bg-gray-800",
  }
  let sizes: Record<string, string> = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
