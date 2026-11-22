import { Leaf, Trophy, UserRound } from "lucide-react";
export type VolunteerRecognitionData = { name: string; role: string; photoUrl?: string };
export function VolunteerRecognition({ volunteer, month }: { volunteer?: VolunteerRecognitionData; month: string }) {
  return <section className="homepage-recognition" aria-label="Volunteer of the Month">
    <div className="homepage-trophy" aria-hidden="true"><Leaf className="recognition-laurel recognition-laurel-left" /><Trophy size={32} strokeWidth={1.5} /><Leaf className="recognition-laurel recognition-laurel-right" /></div>
    <div className="homepage-recognition-title"><h2>Volunteer of the Month <span>– {month}</span></h2><div className="homepage-accent" /></div>
    <div className="homepage-recognition-person">
      {volunteer?.photoUrl ? <img src={volunteer.photoUrl} alt={volunteer.name} width={80} height={80} /> : <span className="homepage-avatar"><UserRound size={34} strokeWidth={1.5} /></span>}
      <div className="min-w-0">{volunteer && <p className="font-display font-bold">{volunteer.name}</p>}<p className="mt-1 text-sm">{volunteer?.role ?? "Community Volunteer"}</p></div>
    </div>
  </section>;
}