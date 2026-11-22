import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartHandshake, Home, UserRoundCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ehf/Logo";
import { Button } from "@/components/ui/button";
import { HomepageSignIn } from "@/components/ehf/HomepageSignIn";
import { VolunteerRecognition } from "@/components/ehf/VolunteerRecognition";
import { ADMIN_LOGIN_URL } from "@/lib/admin-login";
import manchester from "@/assets/manchester-town-hall.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Volunteer Sign In — EHF Volunteer Hub" },
    { name: "description", content: "Sign in to the Ethnic Health Forum Volunteer Hub to access your volunteering projects, tasks, hours and certificates." },
    { property: "og:title", content: "Volunteer Sign In — EHF Volunteer Hub" },
    { property: "og:description", content: "The volunteer workspace for Ethnic Health Forum, supporting diverse communities in Manchester." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const [month, setMonth] = useState("November 2026");
  useEffect(() => setMonth(new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" }).format(new Date())), []);
  return <div className="ehf-homepage">
    <aside className="homepage-sidebar" aria-label="Ethnic Health Forum">
      <Link to="/" aria-label="EHF Volunteer Hub home"><Logo className="homepage-logo" /></Link>
      <h1 className="homepage-hub-title">Volunteer Management Dashboard</h1>
      <div className="homepage-sidebar-divider" />
      <div className="homepage-community"><HeartHandshake size={58} strokeWidth={1.2} /><p>Supporting<br />Diverse<br />Communities<br />in Manchester</p><div className="homepage-accent" /></div>
      <div className="homepage-sidebar-city" aria-hidden="true"><img src={manchester} alt="" width={1024} height={1024} /></div>
    </aside>
    <main className="homepage-main">
      <nav className="homepage-navigation" aria-label="Homepage navigation">
        <Button asChild className="homepage-nav-button"><a href="https://www.ethnichealth.org.uk/" target="_blank" rel="noopener noreferrer"><Home />Home Page</a></Button>
        <Button asChild className="homepage-nav-button">{ADMIN_LOGIN_URL ? <a href={ADMIN_LOGIN_URL}><UserRoundCog />Admin Log In</a> : <Link to="/admin"><UserRoundCog />Admin Log In</Link>}</Button>
      </nav>
      <VolunteerRecognition month={month} />
      <div className="homepage-landmark" aria-hidden="true"><img src={manchester} alt="" width={1024} height={1024} /></div>
      <header className="homepage-welcome">
        <p className="homepage-subtitle">Welcome to the Ethnic Health Forum Volunteer Hub</p>
        <p className="homepage-description"><span />Manage your volunteering activities, projects, tasks, hours and certificates.<span /></p>
      </header>
      <div className="homepage-form-position"><HomepageSignIn /></div>
      <div className="homepage-waves" aria-hidden="true"><div /><div /><div /></div>
    </main>
  </div>;
}
