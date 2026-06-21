---
name: WhatsApp Appointment Maker
description: Professional utility for scheduling and WhatsApp client reminders.
colors:
  primary: "#006b5f"
  on-primary: "#ffffff"
  primary-container: "#2dd4bf"
  on-primary-container: "#00574d"
  secondary: "#a93349"
  on-secondary: "#ffffff"
  secondary-container: "#fe7488"
  on-secondary-container: "#730425"
  surface: "#faf8ff"
  on-surface: "#131b2e"
  outline: "#6b7a76"
  outline-variant: "#bacac5"
typography:
  display:
    fontFamily: "Manrope, Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#00574d"
---

# Design System: WhatsApp Appointment Maker

## 1. Overview

**Creative North Star: "The Modern Desk"**

A professional, highly efficient workspace designed for Sports, Health & Professional Consultants, and Beauty & Wellness Solopreneurs. It rejects SaaS clutter, low-contrast text, and multi-step modal labyrinths. Instead, it offers a clean, flat-by-default visual shell that prioritizes speed, high typographic contrast, and restrained visual feedback.

**Key Characteristics:**
- Flat-by-default hierarchy relying on light structural container boundaries and subtle border lines instead of heavy shadows.
- Refined & restrained components with minimal, elegant transitions.
- High-contrast typography optimized for quick reading on mobile screens.

## 2. Colors

A professional dual-accent palette centered around clinical teal and coral.

### Primary
- **Deep Muted Teal** (#006b5f): Used for primary action indicators, active headers, and focused states.
- **Teal Container** (#2dd4bf): Used for positive status containers and text background highlighting.

### Secondary
- **Deep Coral** (#a93349): Used for secondary cues, alerts, and critical actions.

### Neutral
- **Slate Navy** (#131b2e): The main ink color for text and layout labels, ensuring maximum readability.
- **Soft Lavender-White** (#faf8ff): Background and container canvas to keep the interface feeling light and clean.
- **Cool Grey-Green** (#6b7a76): Outlines, placeholder labels, and disabled states.

### Named Rules
**The Restrained Highlight Rule.** Primary and secondary containers must cover less than 15% of any page layout to preserve their value as highlight elements.

## 3. Typography

**Display Font:** 'Manrope', 'Inter', sans-serif  
**Body Font:** 'Inter', sans-serif  

**Character:** A modern, geometric sans-serif pairing that balances corporate structure with clean wellness-focused warmth.

### Hierarchy
- **Display** (Bold, 32px, 1.25): App-level titles and key summaries.
- **Headline** (Semi-Bold, 20px, 1.3): Section-level titles.
- **Title** (Semi-Bold, 16px, 1.4): Card headings and field label headers.
- **Body** (Regular, 14px, 1.5): Input texts, descriptions, and primary data list entries.
- **Label** (Bold, 11px, 0.10em letter-spacing, Uppercase): Small caps indicators, field metadata, and status tags.

## 4. Elevation

The system is flat-by-default. Layering and grouping are established via container boundaries (`1px` borders or lighter fill containers) rather than drop shadows.

### Shadow Vocabulary
- **Ambient Low** (`0 12px 24px -10px rgba(0, 107, 95, 0.10)`): Soft teal shadow used exceptionally for the primary scheduling form card.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. No depth indicators are applied unless responding to user interaction or highlighting the main form.

## 5. Components

### Buttons
- **Shape:** Rounded-xl (12px)
- **Primary:** Background `#006b5f`, Text `#ffffff`, Padding `12px 24px`.
- **Hover / Focus:** Transitions background to `#00574d` with a scale transition of `scale-[0.98]` on active click.

### Chips
- **Style:** Rounded-full (9999px) with background `#eaedff` and text `#3c4a46` when inactive.
- **State:** Active state transitions background to `#fe7488` and text to `#730425`.

### Cards / Containers
- **Corner Style:** Rounded-xl (12px)
- **Background:** Solid white (`#ffffff`) or Soft container (`#f2f3ff`).
- **Border:** `1px` solid border (`rgba(186, 202, 197, 0.35)`).

### Inputs / Fields
- **Style:** Lighter fill (`#f2f3ff`), rounded corners (10px), with a left-aligned icon.
- **Focus:** Highlight border change with zero outline expansion.

## 6. Do's and Don'ts

### Do:
- **Do** maintain a high color contrast of at least 4.5:1 for all text elements.
- **Do** align icons consistently with their respective text baselines.

### Don't:
- **Don't** use heavy multi-step modal layers or floating cards that obscure the app view.
- **Don't** use border-left or border-right accent stripes greater than 1px.
- **Don't** use gradient text or glassmorphic blurs unless explicitly required.
