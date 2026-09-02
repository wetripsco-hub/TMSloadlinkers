# Turvo Design Tokens

Extracted from live inspection of https://turvo.com/

## 1. Color Palette

### Base & Backgrounds
- Background Primary (Dark): `#18171d` / `oklch(0.14 0.01 280)`
- Background Deep: `#111015`
- Background Card/Surface: `#1f1e24` / `#23222a`
- Background Light Card (hover): `#2a2933`
- Background White (Light sections): `#ffffff`
- Foreground Primary: `#ffffff`
- Foreground Muted: `#9ca3af` / `#a0a0aa`
- Border Color: `rgba(255, 255, 255, 0.1)`

### Brand & Accents
- Turvo Cyan: `#49c2f5` / `#25a9ef` / `oklch(0.72 0.18 220)`
- Turvo Blue: `#2b7ee2` / `oklch(0.58 0.22 250)`
- Turvo Dark Blue: `#0b7cc1`
- Accent Green (Text highlight): `#00d084` / `#7bdcb5`
- Primary Gradient (Blue-Cyan): `linear-gradient(90deg, #49c2f5 0%, #2b7ee2 100%)`
- Brand Diagonal Gradient: `linear-gradient(135deg, #0b7cc1 0%, #17325b 100%)`
- Card Hover Overlay: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(17,16,21,0.95) 100%)`

## 2. Typography

- Primary Font Family: `Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Secondary / Heading Font: `Figtree, sans-serif`
- Heading Sizes:
  - Hero H1: `clamp(2.5rem, 5vw, 4rem)` (40px - 64px), Weight: 700 / 800, Line Height: 1.15
  - Section H2: `2.25rem - 2.75rem` (36px - 44px), Weight: 700, Line Height: 1.2
  - Subtitle / Eyebrow: `1rem` (16px), Weight: 600, Text Transform: uppercase / capitalized, Color: `#49c2f5`
  - Card Titles H3: `1.5rem` (24px), Weight: 600
  - Body Text: `1.05rem - 1.125rem` (17px - 18px), Weight: 400, Line Height: 1.6
  - Small / Nav: `0.875rem` (14px), Weight: 500

## 3. Shadows & Radii
- Card Border Radius: `16px` / `1rem`
- Button Border Radius (Pill): `9999px`
- Modal Border Radius: `20px`
- Card Glow Shadow: `0 10px 30px -10px rgba(43, 126, 226, 0.3)`
- Dropdown Shadow: `0 20px 40px -15px rgba(0, 0, 0, 0.5)`
