import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
export function ReviewDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? parseISO(value) : undefined;
  return <Popover><PopoverTrigger asChild><Button variant="outline" aria-label="Review Date" className="w-full justify-start font-normal"><CalendarIcon />{date ? format(date, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={d => onChange(d ? format(d, "yyyy-MM-dd") : "")} className="p-3 pointer-events-auto" /></PopoverContent></Popover>;
}