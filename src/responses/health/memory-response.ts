import { t } from "elysia";

export const memoryResponse = t.Object({
  current: t.String(),
  peak: t.String(),
  currentCommit: t.String(),
  peakCommit: t.String(),
  pageFaults: t.String(),
});
