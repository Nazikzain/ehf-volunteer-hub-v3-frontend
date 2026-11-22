import { Facts } from "./DetailBits";
import { PERFORMANCE_CRITERIA, overallRating } from "@/lib/performance-workflow";
import type { PerformanceValues } from "@/lib/portal-workflow";
export function PerformanceDetails({ review, project }: { review: PerformanceValues; project: string }) {
  return <Facts items={[
    ["Project", project], ["Review Date", review.date], ["Reviewer", review.reviewer],
    ...PERFORMANCE_CRITERIA.map((label, i): [string, string] => [label, `${review.ratings[i] ?? 0} / 5`]),
    ["Overall rating", `${overallRating(review.ratings)} / 5`], ["Strengths", review.strengths], ["Areas for improvement", review.improvements], ["Admin comments", review.comments], ["Development recommendations", review.recommendations],
  ]} />;
}