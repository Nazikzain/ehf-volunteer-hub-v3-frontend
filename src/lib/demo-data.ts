// DEMONSTRATION DATA ONLY — replace with responses from the EHF backend.
export type Status = string;

import type { Application, Volunteer } from "@/lib/volunteer-workflow";

const h = (at: string, by: string, action: string, note?: string) => ({ at, by, action, ...(note ? { note } : {}) });
const person = (name: string, email: string, phone: string, address: string, postcode: string, nationality: string, language: string, skills: string, days: string[]) =>
  ({ name, email, phone, address, postcode, nationality, language, skills, availabilityType: (days.length ? "Specific Days of the Week" : "Flexible") as Application["availabilityType"], availabilityDays: days });

const P = {
  amina: person("Amina Hassan", "amina.h@example.org", "07700 900101", "12 Demo Street, Cardiff", "CF10 1AA", "British", "Arabic", "Event support, Translation", ["Saturday", "Sunday"]),
  john: person("John Smith", "john.s@example.org", "07700 900102", "4 Sample Road, Cardiff", "CF11 2BB", "British", "English", "IT, Training", []),
  zara: person("Zara Ali", "zara.a@example.org", "07700 900103", "8 Test Lane, Newport", "NP20 3CC", "Pakistani", "Urdu", "Health promotion", ["Monday", "Wednesday"]),
  paul: person("Paul Green", "paul.g@example.org", "07700 900104", "21 Example Ave, Cardiff", "CF14 4DD", "British", "English", "Event logistics", []),
  fatima: person("Fatima Mohammed", "fatima.m@example.org", "07700 900105", "3 Fictional Close, Cardiff", "CF24 5EE", "Somali", "Somali", "Translation", ["Tuesday", "Thursday"]),
  hannah: person("Hannah Lewis", "hannah.l@example.org", "07700 900106", "17 Mock Place, Swansea", "SA1 6FF", "British", "Welsh", "Befriending", ["Friday"]),
  omar: person("Omar Abdi", "omar.a@example.org", "07700 900107", "9 Placeholder St, Cardiff", "CF5 7GG", "Somali", "Somali", "Interpreting", []),
  daniel: person("Daniel Okafor", "daniel.o@example.org", "07700 900108", "30 Demo Crescent, Cardiff", "CF3 8HH", "Nigerian", "English", "Research, Data entry", ["Monday"]),
  priya: person("Priya Sharma", "priya.s@example.org", "07700 900109", "5 Sample Gardens, Cardiff", "CF23 9JJ", "Indian", "Hindi", "Health promotion", []),
  kwame: person("Kwame Mensah", "kwame.m@example.org", "07700 900110", "14 Example Row, Newport", "NP19 1KK", "Ghanaian", "Twi", "Outreach", ["Saturday"]),
};
const submitted = (at: string) => h(at, "Applicant", "Application submitted");

export const applications: Application[] = [
  { ref: "EHF-VOL-2026-0158", ...P.daniel, date: "07 Oct 2026", interest: "Research", status: "Pending", notes: [], history: [submitted("07 Oct 2026 09:12")] },
  { ref: "EHF-VOL-2026-0157", ...P.zara, date: "06 Oct 2026", interest: "Health Awareness", status: "Pending", notes: [], history: [submitted("06 Oct 2026 14:03")] },
  { ref: "EHF-VOL-2026-0156", ...P.hannah, date: "05 Oct 2026", interest: "Carers Support", status: "Under Review", notes: [h("06 Oct 2026 10:00", "Demo Primary Administrator", "Internal note", "References requested.")], history: [submitted("05 Oct 2026 11:40"), h("06 Oct 2026 09:55", "Demo Primary Administrator", "Status changed to Under Review")] },
  { ref: "EHF-VOL-2026-0155", ...P.paul, date: "04 Oct 2026", interest: "Events", status: "Rejected", decisionDate: "05 Oct 2026 16:20", decidedBy: "Demo Primary Administrator", rejectionReason: "No current events vacancies in applicant's area.", notes: [], history: [submitted("04 Oct 2026 08:30"), h("04 Oct 2026 15:00", "Demo Primary Administrator", "Status changed to Under Review"), h("05 Oct 2026 16:20", "Demo Primary Administrator", "Status changed to Rejected", "No current events vacancies in applicant's area.")] },
  { ref: "EHF-VOL-2026-0154", ...P.fatima, date: "03 Oct 2026", interest: "Translation", status: "Accepted", decisionDate: "04 Mar 2026 12:00", decidedBy: "Demo Primary Administrator", volunteerId: "V-1038", notes: [], history: [submitted("01 Mar 2026 10:00"), h("02 Mar 2026 09:00", "Demo Primary Administrator", "Status changed to Under Review"), h("04 Mar 2026 12:00", "Demo Primary Administrator", "Status changed to Accepted"), h("04 Mar 2026 12:00", "System", "Volunteer profile V-1038 created")] },
  { ref: "EHF-VOL-2026-0151", ...P.omar, date: "27 Sep 2026", interest: "Translation", status: "Accepted", decisionDate: "29 Sep 2026 11:15", decidedBy: "Demo Primary Administrator", volunteerId: "V-1015", notes: [], history: [submitted("27 Sep 2026 13:00"), h("28 Sep 2026 10:00", "Demo Primary Administrator", "Status changed to Under Review"), h("29 Sep 2026 11:15", "Demo Primary Administrator", "Status changed to Accepted"), h("29 Sep 2026 11:15", "System", "Volunteer profile V-1015 created")] },
  { ref: "EHF-VOL-2026-0142", ...P.amina, date: "01 Sep 2026", interest: "Community support", status: "Accepted", volunteerId: "V-1042", decidedBy: "Demo Primary Administrator", decisionDate: "01 Sep 2026 10:00", notes: [], history: [submitted("01 Sep 2026 09:00"), h("01 Sep 2026 10:00", "Demo Primary Administrator", "Existing volunteer profile V-1042 linked")] },
];

const vol = (id: string, p: typeof P.amina, extra: Partial<Volunteer> & { languages: string; hours: number; startDate: string; status: string }): Volunteer => ({ id, ...p, pendingHours: 0, ...extra });
export const volunteers: Volunteer[] = [
  vol("V-1042", P.amina, { languages: "English, Arabic", hours: 24, pendingHours: 4.5, startDate: "01 Sep 2026", status: "Active" }),
  vol("V-1038", P.fatima, { applicationRef: "EHF-VOL-2026-0154", languages: "English, Somali", hours: 61, startDate: "04 Mar 2026", status: "Active" }),
  vol("V-1031", P.john, { languages: "English", hours: 40, startDate: "01 Oct 2026", status: "Active" }),
  vol("V-1027", P.priya, { languages: "English, Hindi, Urdu", hours: 88, startDate: "10 Jan 2026", status: "Active" }),
  vol("V-1015", P.omar, { applicationRef: "EHF-VOL-2026-0151", languages: "English, Somali, Arabic", hours: 33, pendingHours: 4, startDate: "29 Sep 2026", status: "Active" }),
  vol("V-1019", P.kwame, { languages: "English, Twi", hours: 12, startDate: "01 Feb 2026", endDate: "30 Sep 2026", status: "Inactive" }),
];

export const projects = [
  { name: "Community Wellbeing Programme", supervisor: "Sarah Ahmed", dates: "Jan – Dec 2026", volunteers: 42, progress: 72, status: "Active" },
  { name: "Digital Skills Support", supervisor: "Mark Taylor", dates: "Oct – Dec 2026", volunteers: 18, progress: 35, status: "Active" },
  { name: "Health Awareness Sessions", supervisor: "Sarah Ahmed", dates: "Mar – Nov 2026", volunteers: 27, progress: 90, status: "Active" },
  { name: "Carers Support Network", supervisor: "Leila Khan", dates: "Feb – Sep 2026", volunteers: 15, progress: 100, status: "Completed" },
];

export const tasks = [
  { task: "Prepare session materials", project: "Digital Skills Support", volunteer: "Amina Hassan", due: "10 Oct 2026", priority: "High", status: "In Progress" },
  { task: "Support community event", project: "Community Wellbeing", volunteer: "Amina Hassan", due: "12 Oct 2026", priority: "Medium", status: "Not Started" },
  { task: "Attend team meeting", project: "Community Wellbeing", volunteer: "Amina Hassan", due: "08 Oct 2026", priority: "Low", status: "Completed" },
  { task: "Update participant feedback", project: "Digital Skills Support", volunteer: "Amina Hassan", due: "15 Oct 2026", priority: "Medium", status: "Not Started" },
  { task: "Translate health leaflet", project: "Health Awareness Sessions", volunteer: "Fatima Mohammed", due: "14 Oct 2026", priority: "High", status: "In Progress" },
];

export const timeLogs = [
  { volunteer: "Amina Hassan", project: "Community Wellbeing", start: "05 Oct 2026 10:00", end: "05 Oct 2026 14:30", hours: 4.5, status: "Pending" },
  { volunteer: "Fatima Mohammed", project: "Health Awareness", start: "04 Oct 2026 09:00", end: "04 Oct 2026 12:00", hours: 3, status: "Approved" },
  { volunteer: "John Smith", project: "Digital Skills Support", start: "03 Oct 2026 13:00", end: "03 Oct 2026 17:00", hours: 4, status: "Approved" },
  { volunteer: "Omar Abdi", project: "Health Awareness", start: "06 Oct 2026 11:00", end: "06 Oct 2026 15:00", hours: 4, status: "Pending" },
  { volunteer: "Priya Sharma", project: "Health Awareness", start: "02 Oct 2026 18:00", end: "02 Oct 2026 20:00", hours: 2, status: "Rejected" },
];

export const hoursTrend = [
  { month: "May", hours: 62 }, { month: "Jun", hours: 88 }, { month: "Jul", hours: 112 },
  { month: "Aug", hours: 135 }, { month: "Sep", hours: 172 }, { month: "Oct", hours: 214 },
];

export const volunteerStatus = [
  { name: "Active", value: 180, fill: "var(--chart-1)" },
  { name: "Approved", value: 38, fill: "var(--chart-2)" },
  { name: "Under Review", value: 12, fill: "var(--chart-3)" },
  { name: "Inactive", value: 8, fill: "var(--chart-4)" },
];
