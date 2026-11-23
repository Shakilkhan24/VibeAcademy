# 0013. Keep lesson feedback private and publish aggregate votes

**Accepted for M1.** Extends [ADR 0007](0007-analytics.md).

A reader can mark a lesson complete or answer whether it helped them decide. The two analytics events carry the lesson slug and published version. Each submission has its own idempotency key so a retry can be acknowledged once without assigning the reader an account or a cross-lesson identifier.

The vote and optional 500-character comment live in a private table linked to the feedback event. The event and vote commit together. A rate-limit counter lives in a separate table and has no reference to a feedback row. The public query reads aggregate votes and completions and never selects the comment column.

The public sample is ten feedback responses per lesson, pooled across versions. Helpful rate is the share of responses marked Yes. Completion counts describe recorded completion marks. This design provides no count of unique readers.
