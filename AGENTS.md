# Lunyon

Brand: Lunyon  
Domain: lunyo.ai  
Core promise: Reclaim Your Time.  
Positioning: Premium productivity software powered by AI.

## Product principles

- We sell reclaimed time, not AI.
- AI should feel useful and mostly invisible.
- Product UI should demonstrate value rather than explain it with marketing copy.
- Work completed → time reclaimed is the core visual narrative.
- Avoid AI hype and generic futuristic visual clichés.
- Prefer simplicity over feature density.
- New screens should inherit the established Lunyon visual language before inventing new styling patterns.

## Core product story

Work completed → Time reclaimed.

Do not merely list features. Show what work Lunyon removes from the user's day.

### Product hierarchy

Prompts → Workflows → AI Employees → Outcomes

These are layers of one system, not disconnected tools:

- Prompts give Lunyon instructions and context.
- Workflows turn instructions into repeatable processes.
- AI Employees execute specialized work.
- The outcome is completed work and time returned to the user.

### Marketing principle

Lunyon is a quiet AI workforce operating behind the user.

It should not feel like a chatbot, a prompt marketplace, generic AI software, or an automation builder for technical users.

Tone: calm, confident, premium, clear, intelligent, human, concise.

### Design principle

Lunyon should feel active even when the user is not interacting with it.

The interface should communicate: "Lunyon is working."

## Lunyon Visual Language

- Dark navy is the visual foundation
- Lunyon blue is the main accent
- Gradients are allowed only when subtle
- Glow is exceptional, not default
- Prefer borders and surface contrast over heavy shadows
- Interfaces should feel calm, premium and productive
- Use generous whitespace
- Avoid crowded dashboards
- Avoid generic AI imagery
- Avoid robot/brain/chip clichés
- Motion should communicate state or progress
- Avoid animation for decoration
- Core visual story: work is being completed and time is being reclaimed
- Time saved/reclaimed should be visually prioritized where relevant
- Prefer concise labels over explanatory paragraphs
- UI should feel like premium productivity software, not gaming/crypto/cyberpunk software

### Preferred visual primitives

- Dark navy background (`--lunyo-bg`)
- Subtle elevated surfaces (`--lunyo-surface`, `--lunyo-surface-elevated`)
- Thin restrained borders (`--lunyo-border`)
- Off-white primary text (`--lunyo-text`)
- Muted blue-gray secondary text (`--lunyo-text-muted`)
- One primary blue accent (`--lunyo-primary`)
- Restrained green success state (`--lunyo-success`)
- Rounded corners, but not overly soft (`--lunyo-radius`)
- Minimal shadow

### Motion

- Use Framer Motion sparingly
- Animate state changes and progress, not decoration
- Prefer short durations (~350–550ms) with calm easing (`--lunyo-ease`)
- Continuous motion should be rare (e.g. a tiny status pulse)

### Connected Intelligence V2

The Lunyon neural network is a core brand motion system.

Its visual grammar is:

**NODE → INFORMATION → PROCESSING → NODE → WORK COMPLETED**

- Moving pulses represent information being processed
- Node activation represents a Lunyon capability receiving or completing work
- Multiple simultaneous transmissions communicate that Lunyon continuously coordinates many specialized capabilities
- Movement should be calm enough to follow visually (~2–4 seconds per transmission)
- Prefer multiple slow readable transmissions over a few fast particles
- The animation must always remain subordinate to content

Implementation notes:

- Nodes represent specialized work capabilities; connections represent information flow
- Zone-seeded distribution avoids dead zones and corner clustering
- Arrival reactions (brief brighten, subtle swell, soft ring) make transmission readable
- Chained flow uses organic probability — not every arrival triggers continuation
- Landing uses higher activity; login uses a calmer preset with stronger form-side fade
- Respect `prefers-reduced-motion`: static network, no traveling pulses

### Connected Intelligence

Lunyon may use subtle network/node imagery as a core brand motif.

- Nodes represent specialized capabilities
- Connections represent coordination
- Pulses represent information/work moving
- Node activation represents processing/completion
- The motif must remain abstract, premium, and restrained
- Avoid literal robots and generic AI brains
- The neural network is a background/supporting visual system — it must not compete with content
- Movement should suggest Lunyon is continuously working for the user
- The outcome remains: work completed → time reclaimed
- Product demonstrations may echo this grammar (incoming work → specialized employees → completed outcome) without adding a second full-page canvas

### Tokens

Visual tokens live in `frontend/src/index.css` as `:root` CSS variables.
Use those variables before inventing new colors or radii.

## Official Brand Asset

The official Lunyon logo asset is:

`frontend/public/brand/lunyo-logo.png`

This file is the visual source of truth for the Lunyon brand.

Agents must:

- use the official asset for brand display
- never recreate the logo using CSS, text, icons, or generative approximations
- never recolor, distort, crop, or add visual effects to it
- preserve aspect ratio
- avoid duplicate wordmarks when the image already contains "Lunyon"

## Public internationalization

Public marketing and auth copy lives in:

`frontend/src/i18n/`

English (`en.ts`) is the canonical dictionary. Portuguese (`pt.ts`, Brazilian) and Spanish (`es.ts`) must match the same keys.

Routes:

- `/` English landing
- `/pt` Portuguese landing
- `/es` Spanish landing
- `/login`, `/pt/login`, `/es/login` for the public auth journey

Do not hardcode public marketing strings in landing or login components.

Do not create locale-prefixed dashboard routes.

Never translate the brand name Lunyon.

The URL is the source of truth for locale. Do not auto-redirect `/` from browser language or storage.
