# Design System Specification: The Kinetic Luminary

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Intelligent Pulse."** 

In the high-stakes world of CRM management, "standard" dashboard design often leads to cognitive fatigue. This system rejects the static, boxy constraints of traditional enterprise software. Instead, it adopts a high-end editorial approach that prioritizes "speed of action" through **Tonal Layering** and **Intentional Asymmetry**. 

We move beyond the "template" look by treating the interface as a living, breathing environment. By utilizing deep navy foundations and glassmorphic overlays, we create a sense of infinite depth. This isn't just a tool; it's a high-performance cockpit designed for the "Modern Agent"—where data feels light, and AI insights (Royal Purple) feel like a premium, integrated layer of intelligence rather than an afterthought.

---

## 2. Colors & Surface Architecture
The palette is built on a foundation of `surface` (Deep Navy) to reduce ocular strain, with "Electric Blue" and "Royal Purple" serving as the primary drivers of intent.

### The "No-Line" Rule
**Explicit Instruction:** All designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through background color shifts or subtle tonal transitions. 
*   *Implementation:* Use a `surface-container-low` section sitting directly against a `surface` background to define a sidebar or header.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Depth is achieved by "stacking" container tiers:
*   **Base:** `surface` (#0b1326) – The canvas.
*   **Secondary Level:** `surface-container-low` (#131b2e) – For large layout regions (Navigation rails).
*   **Content Cards:** `surface-container` (#171f33) – For primary data widgets.
*   **Active/Pop-over:** `surface-container-highest` (#2d3449) – For elements requiring immediate focus.

### The "Glass & Gradient" Rule
To elevate the CRM from "utility" to "premium," use Glassmorphism for floating elements (Modals, Command Palettes). 
*   **Token:** `surface-variant` with 60% opacity and a `20px` backdrop-blur.
*   **Signature Textures:** For high-value actions (e.g., "Close Deal"), apply a subtle linear gradient from `primary` (#b8c3ff) to `primary-container` (#2d5bff) to provide a "soul" that flat fills lack.

---

## 3. Typography
We utilize **Inter** for its neutral, high-performance legibility in data-dense environments. The scale is designed to create an editorial hierarchy that guides the eye to the most critical KPI first.

*   **Display (lg/md/sm):** Used for "Big Numbers" (e.g., Total Revenue). Use `on-surface` with `-0.02em` letter spacing to feel authoritative.
*   **Headline & Title:** Used for module headers. These should feel grounded. Use `title-lg` for card titles to ensure clear scannability.
*   **Body (lg/md/sm):** The workhorse for CRM data. `body-md` is the default for table row data.
*   **Label (md/sm):** Specifically for "Action Labels" and "AI-Generated Insights." AI labels should always utilize the `tertiary` (Royal Purple) token to denote intelligence.

---

## 4. Elevation & Depth
We eschew traditional shadows in favor of **Tonal Layering**.

### The Layering Principle
Depth is organic. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift. This "inset" look suggests a high-performance, precision-milled interface.

### Ambient Shadows
When a floating effect is mandatory (e.g., a dropdown menu):
*   **Blur:** 24px - 40px.
*   **Opacity:** 4% - 8% of the `on-surface` color. 
*   **Color Tinting:** Never use pure black shadows. The shadow must be a darkened tint of the navy base to maintain the "Midnight" atmosphere.

### The "Ghost Border" Fallback
If accessibility requires a border, use a **Ghost Border**:
*   **Token:** `outline-variant` (#434656).
*   **Opacity:** 15%.
*   **Strict Rule:** 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons & Actions
*   **Primary (Electric Blue):** Uses `primary-container` (#2d5bff). Roundedness is strictly `DEFAULT` (8px). 
*   **AI Action (Royal Purple):** Uses `tertiary-container` (#8342f4). This signals the use of RevRa's proprietary intelligence.
*   **Success Action (Emerald):** To be used sparingly for "Won" deals or "Finalize" states.

### Cards & Lists
*   **No Dividers:** Forbid the use of 1px lines between list items. Use `16px` of vertical whitespace (from the spacing scale) or a subtle hover state shift to `surface-bright`.
*   **Contextual Nesting:** Data tables should exist within `surface-container-low` with headers using `surface-container-high` for a "pinned" feel.

### CRM-Specific Components
*   **The "Pulse" Indicator:** A small, 8px circle using `error` (#ffb4ab) or `tertiary` (#d2bbff) with a soft outer glow to indicate overdue tasks or AI suggestions.
*   **The Deal Stage Ribbon:** A horizontal flow using `secondary-container` with chevron-shaped tonal shifts rather than hard lines.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `title-sm` for table headers in all-caps with `0.05em` letter spacing for an editorial look.
*   **Do** use `surface-container-lowest` for background fields in forms to create an "etched" look.
*   **Do** prioritize `tertiary` (Royal Purple) for any feature that automates a user's workflow.

### Don’t:
*   **Don’t** use shadows on flat dashboard cards; let the color shifts do the work.
*   **Don’t** use pure white text (#FFFFFF). Use `on-surface` (#dae2fd) to keep the contrast sophisticated and readable.
*   **Don’t** use sharp 0px corners. The `DEFAULT` (8px) or `md` (12px) radius is essential to soften the high-density data.