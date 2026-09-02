# Graph Report - turvo-clone  (2026-09-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 224 nodes · 264 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92872bc4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- compilerOptions
- components.json
- package.json
- dependencies
- icons.tsx
- navbar.tsx
- devDependencies
- keywords
- sync-skills.mjs
- button.tsx
- download-turvo-assets.mjs
- sync-agent-rules.sh
- layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `keywords` - 9 edges
3. `include` - 7 edges
4. `scripts` - 7 edges
5. `aliases` - 6 edges
6. `tailwind` - 6 edges
7. `LoadlinkersLogo()` - 4 edges
8. `lib` - 4 edges
9. `SolutionCard` - 3 edges
10. `Button()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Button()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/button.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.08
Nodes (23): CollaborationCloud(), featureRows, NextStepCTA(), Footer(), HeroSection(), LogoMarquee(), partnerLogos, SubscribeSection() (+15 more)

### Community 1 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 2 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 3 - "package.json"
Cohesion: 0.09
Nodes (21): author, bugs, url, description, engines, node, homepage, license (+13 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): @base-ui/react, class-variance-authority, clsx, lucide-react, next, dependencies, @base-ui/react, class-variance-authority (+13 more)

### Community 5 - "icons.tsx"
Cohesion: 0.17
Nodes (15): applications, TransportationToolbox(), AnalyticsIcon(), DriverIcon(), FacebookIcon(), IntegrationsIcon(), InventoryIcon(), LinkedInIcon() (+7 more)

### Community 6 - "navbar.tsx"
Cohesion: 0.16
Nodes (11): LoadlinkersLogo(), MegaMenuCompany(), MegaMenuProduct(), MegaMenuResources(), MobileNav(), MobileNavProps, Navbar(), SearchModal() (+3 more)

### Community 7 - "devDependencies"
Cohesion: 0.13
Nodes (15): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @tailwindcss/postcss, @types/node, @types/react (+7 more)

### Community 8 - "keywords"
Cohesion: 0.20
Nodes (10): tailwindcss, keywords, ai, claude-code, nextjs, reverse-engineering, shadcn-ui, template (+2 more)

### Community 9 - "sync-skills.mjs"
Cohesion: 0.29
Nodes (6): agentSkill(), geminiBody, match, noArgs(), ROOT, SOURCE

### Community 10 - "button.tsx"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

### Community 11 - "download-turvo-assets.mjs"
Cohesion: 0.67
Nodes (3): assets, downloadFile(), run()

### Community 12 - "sync-agent-rules.sh"
Cohesion: 0.83
Nodes (3): resolve_imports(), sync-agent-rules.sh script, write_file()

## Knowledge Gaps
- **109 isolated node(s):** `MegaMenuConfig`, `NavSection`, `NavSubItem`, `MobileNavProps`, `SearchModalProps` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 117 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `keywords`, `package.json`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `keywords` connect `keywords` to `package.json`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `MegaMenuConfig`, `NavSection`, `NavSubItem` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07807807807807808 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `components.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._