# 0012. Tutorials use Markdown with YAML frontmatter

**Accepted for M1.** Extends [ADR 0008](0008-content-as-yaml.md).

Tutorials need headings, lists, quotations, links and code examples. The founder can author these in plain Markdown and review each change as a text diff. MDX would also allow executable components in lessons. The reader owns presentation, so the extra execution and build machinery offers little value here.

Each lesson has a `.md` file with Zod-validated YAML frontmatter. Chapter, depth and domain identifiers come from the existing taxonomy. The optional positive `order` gives the founder control of the sequence within a chapter. Prerequisites reference tutorial slugs and related decisions are reached through Decision Card slugs.

The server renders the body with markdown-it, with HTML input disabled and the built-in URL checks enabled. Authors can show markup in fenced code examples. Metadata remains plain data. The tutorial workflow uses the existing draft and reviewed states.
