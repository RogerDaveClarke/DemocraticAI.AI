---
name: Diagrams
description: Describe what this custom agent does and when to use it.
tools: Read, Grep, Glob, Bash # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

from pathlib import Path
import zipfile, json

root = Path("/mnt/data/democratic-ai-mermaid-branding")
(root / "templates").mkdir(parents=True, exist_ok=True)
(root / "examples").mkdir(parents=True, exist_ok=True)

skill = r"""---
name: democratic-ai-mermaid-branding
description: Generate and review Mermaid diagrams so they consistently follow the Democratic AI visual language, semantic color system, diagram standards, accessibility rules, and Responsible AI conventions. Use whenever creating, editing, or reviewing Mermaid architecture, workflow, sequence, state, process, governance, or agent diagrams for Parliament AI or Democratic AI.
---

# Democratic AI Mermaid Branding

## Purpose

This skill ensures that every Mermaid diagram created for Democratic AI or Parliament AI looks and behaves like part of the same visual system as the product, documentation, Medium articles, README files, architecture docs, and presentations.

This is not only a color theme.

It governs:

- visual identity
- semantic color meaning
- diagram structure
- layout direction
- typography
- node shapes
- connectors
- subgraphs
- Responsible AI representation
- accessibility
- readability
- consistency across diagrams

The goal is for a user to recognize a Democratic AI diagram before reading the title.

---

# Canonical Sources

Before generating or reviewing a Mermaid diagram, read if present:

1. `CLAUDE.md`
2. `docs/DEMOCRATIC_AI_DESIGN_GOVERNANCE_SYSTEM.md`
3. `docs/DIAGRAM_STANDARD.md`
4. `code/design-tokens.json`
5. `code/tailwind.democratic-ai.ts`

Treat these as authoritative.

If this skill conflicts with the canonical Design & Governance System, follow the canonical system and flag the discrepancy.

---

# Operating Modes

## GENERATE — default when asked to create a diagram

Produce Mermaid source that follows the Democratic AI standard.

## REVIEW

When asked to review an existing Mermaid diagram:

1. evaluate semantic correctness,
2. evaluate visual consistency,
3. identify style violations,
4. return a corrected version.

## APPLY

When explicitly instructed, update Mermaid source files in the repository.

Do not modify unrelated diagrams.

---

# Democratic AI Diagram Principles

Every diagram should be:

- calm
- institutional
- modern
- evidence-led
- readable
- low-noise
- consistent
- accessible
- semantically meaningful

Avoid:

- decorative gradients
- neon colors
- robot/AI-brain visual clichés
- excessive node count
- arbitrary use of color
- 3D effects
- inconsistent shape meanings
- excessive icons/emojis
- unreadable labels
- spaghetti connectors

---

# Canonical Color System

Use these semantic classes.

## Official Source

**Purpose:** official parliamentary records, public datasets, trusted external records.

- Fill: `#F8FAFC`
- Stroke: `#0D3B66`
- Text: `#0F172A`

Class name:

`source`

---

## Data / Processing

**Purpose:** ingestion, normalization, transformation, indexing, storage pipeline.

- Fill: `#ECFEFF`
- Stroke: `#14B8A6`
- Text: `#0F172A`

Class name:

`pipeline`

---

## AI / Retrieval

**Purpose:** embeddings, semantic search, RAG, LLMs, retrieval, orchestration.

- Fill: `#EFF6FF`
- Stroke: `#2563EB`
- Text: `#0F172A`

Class name:

`ai`

---

## Responsible AI / Governance

**Purpose:** evaluation, safeguards, bias analysis, explainability, provenance, integrity controls, human review.

- Fill: `#F5F3FF`
- Stroke: `#7C3AED`
- Text: `#0F172A`

Class name:

`governance`

---

## User / Product Experience

**Purpose:** Parliament AI UI, citizen/researcher-facing experiences, validated outputs.

- Fill: `#ECFDF5`
- Stroke: `#16A34A`
- Text: `#0F172A`

Class name:

`product`

---

## Caution / Review

**Purpose:** uncertain state, review required, conditional behavior.

- Fill: `#FFF7ED`
- Stroke: `#F59E0B`
- Text: `#0F172A`

Class name:

`warning`

---

## Error / Blocker

**Purpose:** failure state, security/release blocker, invalid path.

- Fill: `#FEF2F2`
- Stroke: `#DC2626`
- Text: `#0F172A`

Class name:

`error`

Red is never decorative.

---

## External Dependency

**Purpose:** third-party platforms or systems outside Democratic AI control.

- Fill: `#F8FAFC`
- Stroke: `#64748B`
- Text: `#0F172A`
- Dashed border when supported.

Class name:

`external`

---

# Canonical Mermaid Theme

Use this init block by default for flowcharts unless the host renderer strips Mermaid init directives.

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "fontFamily": "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "fontSize": "14px",
    "primaryColor": "#FFFFFF",
    "primaryTextColor": "#0F172A",
    "primaryBorderColor": "#E2E8F0",
    "lineColor": "#64748B",
    "secondaryColor": "#ECFEFF",
    "tertiaryColor": "#F5F3FF",
    "clusterBkg": "#FFFFFF",
    "clusterBorder": "#E2E8F0",
    "edgeLabelBackground": "#FFFFFF",
    "mainBkg": "#FFFFFF",
    "nodeBorder": "#E2E8F0"
  },
  "flowchart": {
    "curve": "basis",
    "htmlLabels": true,
    "nodeSpacing": 40,
    "rankSpacing": 55
  }
}}%%