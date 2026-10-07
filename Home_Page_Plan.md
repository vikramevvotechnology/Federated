# FederatedOne — Home Page Plan (v1)

> Source: `References/FederatedOne_ABCDE_1pager.pdf` + `References/Federated_Logo.svg`
> Scope: Home page only. Inner pages (Agentis, Build, Cloud, DC, Ecosystem, Partners, Contact) come later.

---

## 1. Positioning, in one line

**"One accountable integrator for private AI — from software to data centre."**

The whole page tells one story: *private AI usually means many vendors and nobody accountable; FederatedOne gives you one integrator across five layers (A–E), which you can take together or one at a time.*

Tone: calm, confident, factual. Nothing like "revolutionary" or "10x". Short sentences, plenty of white space, no stock photos of robots or glowing brains.

---

## 2. Design direction — "Quiet Infrastructure"

The references are sites that look premium because they hold back: Anthropic (editorial serif + warm paper), Cohere (lots of space), Linear/Vercel (precise hairlines and grids), and Swiss/editorial print layouts. The PDF's **A–E index** becomes the design system: every section is "filed" under a letter, the way a well-made annual report or architecture monograph is.

| Principle | What it means on the page |
|---|---|
| Editorial, not "tech" | Large serif headlines, small sans body text, mono labels |
| Hairline precision | 1px rules, thin grid lines, no heavy shadows, no glassmorphism |
| One accent, used rarely | The logo's red only marks the single most important thing in each view |
| Light and dark rhythm | Mostly warm-ivory sections, with 2 deep-navy "infrastructure" sections for contrast |
| Motion with purpose | Slow (600–900ms) eased reveals; diagrams that build themselves; nothing bounces |

### Colour (taken from the logo)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0E1430` | Main text, dark sections (a deeper version of the logo navy) |
| `navy` | `#243264` | Logo navy: headings on light backgrounds, diagram strokes |
| `royal` | `#204388` | Links, active states, diagram highlights |
| `signal` | `#E12629` | Logo red: **accent only** (≤ 3% of any screen): the "One", key dots, CTA hover |
| `plum` | `#722D4B` | Middle stop of the logo gradient; used only inside the navy→plum→red gradient line |
| `paper` | `#F7F5F0` | Main background (warm ivory, not pure white) |
| `bone` | `#ECE8DF` | Cards, alternate sections |
| `line` | `#0E1430` at 12% | Hairlines and grid |
| `mute` | `#5B6178` | Secondary text |

The logo gradient (navy → plum → red) is used as a **single 1–2px line** (dividers, the active layer in the stack diagram, progress), never as a large fill. That keeps it classy.

> Note: the PDF uses teal and gold accents. I recommend **not** using them on the website, so it stays on-brand with the logo. Tell me if teal must stay.

### Typography

| Role | Recommended (licensed) | Free alternative | Spec |
|---|---|---|---|
| Display / headlines | **Canela** or **GT Sectra** | **Instrument Serif** / **Newsreader** | 72–120px hero, tight tracking (-2%), line-height 1.0 |
| UI / body | **Söhne** or **Neue Haas Unica** | **Inter Tight** / **Geist** | 16–18px body, 1.6 line-height, max ~64 characters per line |
| Labels / data | **Söhne Mono** | **Geist Mono** / **JetBrains Mono** | 11–12px, uppercase, +8% tracking: `A — AGENTIS`, specs, standards |

The serif gives the "classy" feel, the grotesk keeps it enterprise, and the mono labels make it feel technical and exact. Use an italic serif for one emphasised word per headline (e.g. *accountable*).

### Grid & spacing
- 12-column grid, 1440px max width, 120px outer margins on desktop.
- Section padding 160–200px top and bottom (generous on purpose).
- An 8px spacing scale. A faint vertical hairline grid shows behind the hero and the stack diagram only.

---

## 3. Page structure (top to bottom)

### 00 · Navigation (sticky, see-through → solid paper with a hairline on scroll)
`[Logo]   Platform ▾   Solutions   Partners   Company        Talk to us →`
- "Platform" opens a mega-menu with the 5 components in A–E rows (letter, name, one-line description).
- CTA is a text link with an arrow; it turns red on hover. No chunky filled buttons.

### 01 · Hero (light, full viewport)
- Mono eyebrow: `PRIVATE AI · SOFTWARE TO DATA CENTRE`
- Headline (serif, 2 lines):
  **One *accountable* integrator for private AI.**
- Sub: *Five components — from agents to the data centre — that work together or stand alone.*
- CTAs: `Explore the platform →` (primary) · `Talk to an architect` (text link)
- **Hero visual (signature):** an exploded, isometric **5-layer stack** drawn in navy hairlines on the right. It assembles slowly on load (layers slide together). The thin gradient line runs vertically through all five layers: "one thread, one integrator". Each layer carries a small mono label (A–E).
- Bottom strip: `Powered by  MiPhi aiDAPTIV+  ·  MiPhi Syntax  ·  Evvo Group` in small mono, with a hairline above.

### 02 · The statement (light, editorial)
One large serif paragraph across 8 columns, with nothing around it:
> "Private AI today usually means a model vendor, an integrator, a GPU supplier, a hosting provider and a stack of contracts — and no one accountable for the whole. **FederatedOne is one.**"

Small mono footnote on the right: `01 / Why FederatedOne`.

### 03 · The FederatedOne Stack — main infographic (dark ink section)
This is the centrepiece and turns the PDF's A–E list into an architecture diagram.

```
            ┌──────────────────────────────────────┐
  E ─ ─ ─ ─ │  ECOSYSTEM  (surrounds the stack)    │ ─ ─ partners ⇄ clients
            │  ┌────────────────────────────────┐  │
            │  │ B  BUILD     any tool → agent  │  │   ← software
            │  ├────────────────────────────────┤  │
            │  │ A  AGENTIS   AI stack + agents │  │
            │  ├────────────────────────────────┤  │
            │  │ C  CLOUD     GPUs + aiDAPTIV+  │  │   ← compute
            │  ├────────────────────────────────┤  │
            │  │ D  DC        power, cooling,   │  │   ← facility
            │  │              network, security │  │
            │  └────────────────────────────────┘  │
            └──────────────────────────────────────┘
```
- Interaction: the diagram stays pinned while you scroll; each step lights up one layer (gradient edge) and the left column shows its name, the PDF's one-liner and its "key word".
- Mobile: the same idea as a vertical accordion.
- Footnote from the PDF: *"Components can be combined or taken one at a time."*

### 04 · The five components (light, alternating editorial rows)
Five rows, each with a big mono letter, a name, 3 short points and a **key word** set huge in serif. The PDF's black "tiles" become typographic moments:

| # | Component | Key word (huge serif) | Caption | 3 points (from PDF) |
|---|---|---|---|---|
| A | Federated Agentis | **Syntax** | on AgentStation, from MiPhi | Complete AI stack, multi-tenant · Cited research with Word/PDF/PPT/Excel output · Agents, routines, notetaker with human approval gates |
| B | Federated Build | **Any tool** | idea to working agent | Bespoke agentic tools on Agentis · e.g. tender/bid assistants, technical documentation search · Same approval gates and audit trail |
| C | Federated Cloud | **aiDAPTIV+** | MiPhi memory extension, in the box | Larger models, longer context, more users on the same GPUs · Spills onto in-box flash instead of failing · Enterprise NVIDIA GPUs shared across business units |
| D | Federated DC | **Private** | under your control | Hosting, power, cooling, networking, security |
| E | Federated Ecosystem | **Connected** | partners and clients | Trusted vendors, integrators and builders · Governed platform for partners |

Each row ends with `Explore Agentis →` etc. (these links lead to the inner pages later). Each row gets a small line icon (custom, 1.25px stroke), not stock illustrations.

### 05 · Inside aiDAPTIV+ — technical infographic (dark ink section)
An explainer of the Cloud component, because it is the clearest technical difference:
- Diagram of memory tiers: **GPU memory → system memory → in-box flash (aiDAPTIV+)**.
- Animated "session" bars fill the GPU memory; instead of hitting a red "OUT OF MEMORY" wall, the overflow flows smoothly down into flash.
  - Label 1: **aiDAPTIV+ Link** — *adds capacity*
  - Label 2: **aiDAPTIV+ Cache** — *keeps it responsive*
- Three outcomes in mono-label columns: `LARGER MODELS` · `LONGER CONTEXT` · `MORE USERS, SAME GPUs`
- Footnote (required, from the PDF): *"Gains depend on workload and configuration."*
- **No made-up numbers.** If MiPhi provides approved benchmark figures, we add them here as large serif numbers.

### 06 · Governance, built in (light)
Split layout. Left: headline *"Security and governance aren't an add-on."* Right: a quiet 2×3 grid with hairline borders:
- Role-based access · Metering · Audit trail · Human approval gates · Runs on-prem in your network · Multi-tenant isolation

Below: a band showing **ISO 27001 · GDPR · EU AI Act** as typographic "seals" (mono text inside a circular hairline badge).
> Wording must stay as the PDF says, **"mapped to"**, not "certified", unless certification is confirmed.

### 07 · Take one, or take all five (light / bone) — interactive
A small, elegant configurator: five letter chips `A B C D E`. Turning them on/off lights up the matching layers in a mini stack and updates one sentence, e.g. *"Agentis + Cloud: the full AI stack on aiDAPTIV+ GPUs, in your data centre."* It shows the modularity point without a long text block. CTA: `Discuss this configuration →` (fills the contact form later).

### 08 · For clients / For partners (split, two columns)
Comes from the Ecosystem component.
- **For clients**: one accountable integrator, a trusted network of vendors and builders, private by default.
- **For partners**: access to clients, a governed platform, a place in the FederatedOne stack.
Each column has its own CTA. A thin vertical gradient line separates the two.

### 09 · Powered by (light, very quiet)
Three partner wordmarks in grayscale: **MiPhi aiDAPTIV+ · MiPhi Syntax · Evvo Group**, with one sentence for each role. (Needs approved partner logo files.)

### 10 · Closing CTA (dark ink, full width)
Large serif: **"Private AI, with one name accountable."**
`Talk to us →`, plus a small mono line: `Federated Agentis · Build · Cloud · DC · Ecosystem` (echoes the PDF footer).

### 11 · Footer (ink)
Logo (white version) + "The One AI landlord" · columns: Platform (A–E), Company, Partners, Legal (Privacy, Cookies, AI policy) · a hairline and © line.

---

## 4. Motion & interaction rules
- Easing `cubic-bezier(0.22, 1, 0.36, 1)`, 600–900ms; reveals use a short 12–16px rise plus fade, staggered by 60ms.
- Only two "big" moments: the hero stack assembling (01) and the pinned stack scroll (03). Everything else is subtle.
- Respect `prefers-reduced-motion`: show static diagrams instead.
- Hover: underline drawn from left to right, arrow moves 4px. No scaling cards.

## 5. Responsive
- Desktop 1440 / laptop 1280 / tablet 768 / mobile 390.
- Hero stack moves below the headline on mobile; the pinned diagram (03) becomes an accordion; the configurator (07) becomes a vertical chip list.
- Headline sizes use `clamp()` (hero ~44px on mobile → 112px on desktop).

## 6. Technical recommendation
- **Next.js (App Router) + Tailwind CSS + Framer Motion**, with the diagrams as hand-built **inline SVG** so they stay crisp, light and animatable. Static export makes hosting simple.
- Alternative if the site should be very lightweight or edited by non-developers: **Astro** (static) or **Webflow**.
- Targets: Lighthouse 95+, LCP < 2s, WCAG 2.2 AA contrast (the red is not used for small body text on ivory).

## 7. Content cautions
- No invented statistics, client logos or testimonials. Every claim comes from the one-pager.
- Keep "mapped to ISO 27001, GDPR and the EU AI Act" wording exact.
- Keep the disclaimer "Gains depend on workload and configuration" next to any performance claim.
- Spelling: UK English (*centre*, *realise*), as in the PDF.

## 8. Open questions for you
1. Is **teal** from the PDF a brand colour that must appear, or can we follow the logo (navy + red)?
2. Font budget: licensed fonts (Canela / Söhne) or free Google fonts (Instrument Serif / Inter Tight)?
3. Build stack: Next.js (my recommendation), Astro, WordPress, or Webflow?
4. Do we have approved MiPhi / Evvo partner logos and any benchmark numbers for section 05?
5. Primary conversion goal: "Talk to us" (enquiry form), booking a call, or a downloadable PDF?
