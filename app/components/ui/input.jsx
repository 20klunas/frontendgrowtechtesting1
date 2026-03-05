"use client"

import React from "react"

function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function Input({
  className,
  type = "text",
  ...props
}) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border px-3 py-2 text-sm",
        "bg-white text-black",
        "border-gray-300",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-purple-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}