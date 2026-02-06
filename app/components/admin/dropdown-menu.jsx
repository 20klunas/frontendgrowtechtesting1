'use client'

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "../../lib/utils"

/* ROOT */
const DropdownMenu = DropdownMenuPrimitive.Root

/* TRIGGER */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

/* CONTENT */
const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-xl",
          "border border-[#3d2b5e] bg-[#1a1a2e] p-1",
          "text-white shadow-xl",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
)
DropdownMenuContent.displayName =
  DropdownMenuPrimitive.Content.displayName

/* ITEM */
const DropdownMenuItem = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center",
        "rounded-lg px-3 py-2 text-sm",
        "outline-none transition-colors",
        "focus:bg-purple-700/30 focus:text-white",
        "hover:bg-purple-700/20",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
)
DropdownMenuItem.displayName =
  DropdownMenuPrimitive.Item.displayName

/* SEPARATOR */
const DropdownMenuSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("my-1 h-px bg-white/10", className)}
      {...props}
    />
  )
)
DropdownMenuSeparator.displayName =
  DropdownMenuPrimitive.Separator.displayName

/* EXPORT */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
