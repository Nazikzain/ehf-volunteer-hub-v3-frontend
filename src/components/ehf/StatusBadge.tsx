const map: Record<string, string> = {
  Approved: "bg-success-soft text-success", Accepted: "bg-success-soft text-success", Active: "bg-success-soft text-success", Completed: "bg-success-soft text-success", Issued: "bg-success-soft text-success",
  "Under Review": "bg-warning-soft text-warning", Pending: "bg-warning-soft text-warning", Medium: "bg-warning-soft text-warning",
  Rejected: "bg-danger-soft text-destructive", High: "bg-danger-soft text-destructive",
  "Pending Approval": "bg-warning-soft text-warning", "Pending Issue": "bg-warning-soft text-warning",
  "Checked In": "bg-info-soft text-primary", "Checked Out": "bg-success-soft text-success", Present: "bg-success-soft text-success", Absent: "bg-danger-soft text-destructive", "Excused Absence": "bg-warning-soft text-warning", Eligible: "bg-success-soft text-success", "Email Sent": "bg-success-soft text-success", "Email Failed": "bg-danger-soft text-destructive",
  "In Progress": "bg-info-soft text-primary",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
