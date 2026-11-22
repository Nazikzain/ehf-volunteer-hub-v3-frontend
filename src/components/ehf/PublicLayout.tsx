import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { ADMIN_LOGIN_URL } from "@/lib/admin-login";
import { Globe, Mail, MapPin, Phone } from "lucide-react";


export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-nav text-nav-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/"><Logo className="h-12 sm:h-14" /></Link>
          <nav className="flex items-center gap-5 text-sm font-semibold uppercase tracking-wide sm:gap-8 sm:text-lg">
            <Link to="/" className="transition-opacity hover:opacity-70">Home</Link>
            <a href="https://www.ethnichealth.org.uk/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70">About Us</a>
          </nav>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/portal-login" className="rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:px-4 sm:text-sm">Volunteer Hub</Link>
            {ADMIN_LOGIN_URL ? <a href={ADMIN_LOGIN_URL} className="rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:px-4 sm:text-sm">Admin Dashboard</a> : <Link to="/admin" className="rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:px-4 sm:text-sm">Admin Dashboard</Link>}
          </div>
        </div>
        <div className="brand-bar h-1" />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="space-y-3 text-sm">
            <Logo className="h-16" />
            <p className="font-bold text-sidebar-accent-foreground">Ethnic Health Forum</p>
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>City View House, 5 Union Street<br />Ardwick, Manchester M12 4JD</span></p>
          </div>
          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-sidebar-accent-foreground">Contact</h4>
            <a href="tel:+447918830170" className="flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 text-primary" /> +44 (0) 79 188 301 70</a>
            <a href="mailto:info@ethnichealth.org.uk" className="flex items-center gap-2 hover:underline"><Mail className="h-4 w-4 text-primary" /> info@ethnichealth.org.uk</a>
            <a href="https://www.ethnichealth.org.uk/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><Globe className="h-4 w-4 text-primary" /> www.ethnichealth.org.uk</a>
          </div>
          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-sidebar-accent-foreground">About the Organisation</h4>
            <p>Ethnic Health Forum is a non-profit charitable organisation registered with the Charity Commission for England and Wales.</p>
            <p>Registered Charity Number: <span className="font-semibold">1199687</span></p>
          </div>
        </div>
        <div className="border-t border-primary/40 py-4 text-center text-xs opacity-80">Copyright © {new Date().getFullYear()} Ethnic Health Forum. All Rights Reserved.</div>
      </footer>
    </div>
  );
}
