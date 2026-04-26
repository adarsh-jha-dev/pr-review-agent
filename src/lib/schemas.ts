import { z } from "zod";

export const reviewSchema = z.object({
  summary: z.string(),
  verdict: z.enum(["approve", "request_changes", "needs_info"]),
  comments: z.array(
    z.object({
      file: z.string(),
      line: z.number().nullable(),
      severity: z.enum(["critical", "warning", "suggestion", "praise"]),
      message: z.string(),
    })
  ),
  positives: z.array(z.string()),
});

export type PRReview = z.infer<typeof reviewSchema>;