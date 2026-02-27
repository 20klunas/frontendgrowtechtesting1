import { Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export default function AdminFooter() {
  return (
    <footer className="border-t border-border bg-background px-4 py-8 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center">
            Copyright 2026 GrowTech. All rights reserved. Made by Skyborne.
          </p>
      </div>
    </footer>
  )
}