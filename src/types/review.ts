export type Severity = "critical" | "warning" | "suggestion" | "praise";

export interface LineComment {
  file: string;
  line: number | null;
  severity: Severity;
  message: string;
}

export interface PRReview {
  summary: string;
  verdict: "approve" | "request_changes" | "needs_info";
  comments: LineComment[];
  positives: string[];
}

export interface PRContext {
  title: string;
  description: string;
  author: string;
  diff: string;
  changedFiles: string[];
}