# CLAUDE.md — Democratic AI / Parliament AI

Before generating or modifying UI, documentation, diagrams, copy, or AI-facing content, read:
`docs/DEMOCRATIC_AI_DESIGN_GOVERNANCE_SYSTEM.md`

Treat it as canonical.

## Stack
React + TypeScript + Vite + Tailwind CSS.
Use shadcn/ui / Radix, Lucide React, Recharts, TanStack Table, React Hook Form + Zod.
Do not add MUI, Ant Design, Bootstrap, or a competing design system unless explicitly approved.

## Mandatory feature review
For every requested feature first evaluate:
1. Citizen value
2. Researcher/journalist/policy value
3. Technical feasibility from official parliamentary data
4. Responsible AI implications

Challenge weak, misleading, decorative, or indefensible features before implementation.

## Page rule
Every page must answer one dominant user question. Avoid generic dashboards.

## Styling
Use `code/design-tokens.json`.
White cards on Canvas; 16px card radius; subtle borders; teal interactive accent; navy structural anchor.
Semantic colors may not be decorative. Use Lucide outline icons and sentence-case labels.

## Responsible AI
Distinguish official facts from AI inference. Make sources, evidence, uncertainty, and limitations discoverable.
Never create a truth score or definitive AI-authorship claim. Official records remain authoritative.

## Charts
Prefer bar, line, stacked bar, heat map, timeline, matrix, Sankey.
Avoid pie and 3D charts.
Every chart must answer a research question and include labels, units, context, and an accessible alternative.

## When building/redesigning a page
1. State the primary user question.
2. Evaluate and challenge requested features.
3. Propose the information architecture.
4. Implement with shared components/tokens.
5. Check accessibility.
6. Check Responsible AI.
7. Summarize deliberate exceptions.

When reviewing code, identify deviations from this standard and propose exact fixes.
