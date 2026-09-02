# Turvo Page Behaviors & Interaction Models

Extracted from live inspection of https://turvo.com/

## 1. Header & Navigation Behaviors
- **Sticky on Scroll**: The navbar fixes to the top of the viewport when scrolling down (`window.scrollY > 20`), applying background `rgba(24, 23, 29, 0.95)`, `backdrop-blur-md`, and subtle bottom border `rgba(255, 255, 255, 0.1)`.
- **Mega Menu Dropdown**: Hovering over menu items ("Product", "Resources", "Our Company") opens a styled dropdown panel with smooth fade-in and slide-down transition (`opacity: 1`, `transform: translateY(0)`). Leaving the menu area has a slight delay to prevent accidental closing.
- **Search Modal**: Clicking the magnifying glass opens a full-screen or centered overlay with blur backdrop, auto-focused search input, escape-key listener, and click-outside handler to close.
- **Mobile Menu Drawer**: Clicking the hamburger icon triggers a slide-in drawer from the right, preventing body scroll, with expandable accordion submenus for nested links.

## 2. Solutions Cards Hover
- On hover, each of the 4 solution cards (`3PLs`, `Freight Brokers`, `Shippers`, `Carriers`):
  - Background image scales from `scale(1)` to `scale(1.06)` with `transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)`.
  - Gradient overlay shifts to emphasize text readability.
  - Border highlights with Turvo cyan outline glow.

## 3. Partner Logo Marquee
- Marquee animates infinitely from right to left (`marquee-to-left` keyframe) with `animation-timing-function: linear`, `animation-iteration-count: infinite`.
- On mouse hover, the marquee smoothly pauses so the user can inspect or click partner case study links.

## 4. Video Lightbox Modal
- Clicking the play button on the Hero screen preview or Port X Logistics customer story card opens an accessible modal with YouTube video iframe or local video player.
- Escape key and backdrop click close the modal and stop video playback.

## 5. Newsletter Signup Form
- Input with validation, handling empty submission and valid email submission with interactive success state ("Thank you for subscribing to Turvo updates!").
