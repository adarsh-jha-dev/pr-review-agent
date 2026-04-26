import { z } from "zod";

export const coreReviewSchema = z.object({
  summary: z.string(),
  verdict: z.enum(["approve", "request_changes", "needs_info"]),
  comments: z.array(z.object({
    file: z.string(),
    line: z.number().nullable(),
    severity: z.enum(["critical", "warning", "suggestion", "praise"]),
    message: z.string(),
  })),
  positives: z.array(z.string()),
});

export const reviewSchema = coreReviewSchema.extend({
  changedFiles: z.array(z.object({
    filename: z.string(),
    additions: z.number(),
    deletions: z.number(),
    changes: z.number(),
    status: z.string(),
  })).optional(),
  ciChecks: z.array(z.object({
    name: z.string(),
    status: z.enum(["completed", "in_progress", "queued"]),
    conclusion: z.enum(["success", "failure", "skipped", "cancelled"]).nullable().optional(),
    url: z.string(),
  })).optional(),
  vulnerabilities: z.array(z.object({
    pkg: z.string(),
    ecosystem: z.string(),
    vulns: z.array(z.object({
      id: z.string(),
      summary: z.string(),
      severity: z.string(),
    })),
  })).optional(),
  bundleImpact: z.array(z.object({
    pkg: z.string(),
    sizeGzip: z.number(),
    sizeParsed: z.number(),
    isNew: z.boolean(),
  })).optional(),
  teamStyleConcerns: z.array(z.string()).optional(),
});

export type PRReview = z.infer<typeof reviewSchema>;