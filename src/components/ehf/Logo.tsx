import logo from "@/assets/ehf-logo-transparent.png.asset.json";
export function Logo({ className = "h-12" }: { className?: string }) {
  return <img src={logo.url} alt="Ethnic Health Forum" className={`${className} w-auto`} />;
}
