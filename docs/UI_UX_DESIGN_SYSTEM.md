# Farmer Trading App — UI/UX Design System Specification

## 1. Overview & Agricultural Design Philosophy

The Farmer Trading App UI/UX design system provides a specialized, domain-authentic interface tailored to direct agricultural trade. 

The visual identity and user experience reflect the reality of agricultural markets, farming communities, and produce buyers. It is designed to feel trustworthy, grounded, and practical, deliberately avoiding the look and feel of generic AI-generated SaaS dashboards, speculative crypto platforms, or abstract financial terminals.

### Core Design Principles:
- **Agricultural Visual Identity**: Rooted in organic harvest greens, warm earth tones, and clean, high-contrast surfaces.
- **Usability Over Visual Effects**: Clean typography, obvious touch targets, zero gratuitous animations, zero 3D decorations, and fast performance over variable 3G/4G rural networks.
- **Farmer-Friendly Workflows**: Clear visual hierarchy, plain language, and minimal steps for listing produce and evaluating offers.
- **High Outdoor Readability**: Strong contrast ratios (WCAG AAA compliant for critical data) to support reading on mobile screens in direct sunlight.
- **Truthful & Grounded States**: The interface strictly displays real system states. It never simulates transactions, fabricates market data, or creates artificial success states.

---

## 2. Color System & Design Tokens

The color palette is derived from crops, soil, and harvest seasons to convey reliability and natural authenticity.

### Primary Brand & Interactive Tokens

| Token Name | Hex Value | Usage & Visual Role |
| :--- | :--- | :--- |
| `--color-forest-900` | `#143826` | Deep canopy green. Primary brand headers, top navigation, authoritative typography. |
| `--color-harvest-700` | `#1E5128` | Deep harvest green. Primary action buttons, confirmed deal badges, focus rings. |
| `--color-harvest-600` | `#2D6A4F` | Standard active green. Interactive highlights, primary buttons, active links. |
| `--color-sprout-100` | `#E8F5E9` | Light sprout green. Background for active status badges, positive feedback banners. |
| `--color-sprout-50` | `#F1F8F4` | Very pale sprout tint. Alternating table row highlights, active card selections. |

### Warm Earth & Canvas Neutrals

| Token Name | Hex Value | Usage & Visual Role |
| :--- | :--- | :--- |
| `--color-canvas-bg` | `#F9F8F6` | Warm off-white / parchment canvas. Soft on the eyes outdoors; avoids harsh sterile white. |
| `--color-surface-card` | `#FFFFFF` | Crisp pure white. Produce cards, dialog modal surfaces, form card containers. |
| `--color-border-subtle` | `#E6E2DA` | Warm sandstone border. Card outlines, horizontal dividers, input borders. |
| `--color-border-strong` | `#C8C2B7` | Emphasized divider border, input hover/focus states. |
| `--color-soil-900` | `#1A201C` | Deep slate/soil. Primary body text, titles, numeric price displays (maximum contrast). |
| `--color-soil-600` | `#525E57` | Muted slate/soil. Secondary descriptions, date stamps, unit labels, breadcrumbs. |

### Accent & Feedback Tokens

| Token Name | Hex Value | Usage & Visual Role |
| :--- | :--- | :--- |
| `--color-amber-600` | `#D97706` | Golden wheat / amber. Bidding highlights, `PAYMENT_PENDING` badge, pending actions. |
| `--color-amber-100` | `#FEF3C7` | Soft amber background. Pending status container, advisory notices. |
| `--color-terracotta-700` | `#C53030` | Earthy brick/terracotta red. Rejections, `CANCELLED` status badge, error states. |
| `--color-terracotta-100` | `#FEE2E2` | Soft terracotta red background. Error alerts, cancelled deal pill background. |
| `--color-slate-500` | `#6B7280` | Neutral slate. `SOLD_OUT` status badge, withdrawn offers, disabled controls. |
| `--color-slate-100` | `#F3F4F6` | Neutral grey background. Inactive or expired status badge containers. |

---

## 3. Typography & Numerals

The typography prioritizes instant legibility for users of varying technical familiarity.

### Font Family
- **Primary Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`.
- **Numerals**: Must use **tabular figures** (`font-variant-numeric: tabular-nums`) across all prices, weights, phone numbers, and dates to ensure numbers align neatly in lists and cards.

### Typographic Scale

| Role | Font Size | Weight | Line Height | Application |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title (H1)** | 28px – 32px | Bold (700) | 1.2 | Marketplace header, Dashboard title |
| **Section Title (H2)**| 22px – 24px | Bold (700) | 1.3 | Produce category, Deal overview section |
| **Card Crop Name** | 18px – 20px | Semi-Bold (600)| 1.3 | Title on Produce Listing Card |
| **Prominent Price** | 22px – 26px | Bold (700) | 1.1 | Starting / Agreed unit price (`₹2,400 / quintal`) |
| **Body Standard** | 15px – 16px | Regular (400) | 1.5 | Primary description text, instructions |
| **Data Label / Units** | 13px – 14px | Medium (500) | 1.4 | Quantity units, availability dates, location pill |
| **Status Badge Text** | 12px – 13px | Semi-Bold (600)| 1.0 | Uppercase status pills (`CONFIRMED`, `PAID`) |

---

## 4. Domain Terminology & Language Guidelines

The interface must use clear, respectful agricultural terminology. Abstract financial, crypto, or corporate SaaS jargon is strictly prohibited.

| Avoid Generic / SaaS Jargon | Use Approved Marketplace Terminology |
| :--- | :--- |
| *Assets / Products / Items* | **Produce / Crops / Produce Listings** |
| *Order Book / Liquidity* | **Marketplace / Available Quantity** |
| *Place Bid / Counter-offer* | **Submit Offer / Make Bid** |
| *Execute Deal / Checkout* | **Accept Offer / Confirm Deal** |
| *Fulfillment / Logistics* | **Delivery & Pickup Tracking** |
| *Vendor / Merchant / Supplier* | **Farmer** |
| *Client / Consumer / Tenant* | **Buyer** |
| *Guaranteed Rate / Market Price* | **AI Price Recommendation (Advisory Only)** |

---

## 5. Layout & Responsive Architecture

- **Mobile-First Layout**: Primary trading workflows must be completely functional on handheld mobile devices (360px+ viewport width).
- **Touch-Friendly Controls**: Minimum touch target of **48px × 48px** for all buttons, form fields, filter chips, and tab bars.
- **Form Layouts**: Single-column vertical form layouts on mobile to reduce cognitive load and prevent accidental input errors.
- **Table / List Views**: Multi-column data tables on desktop must gracefully transform into stacked card lists on mobile viewports.

---

## 6. Core Marketplace Component Specifications

### 6.1 Produce Listing Card

Produce cards are the primary discovery unit in the marketplace.

- **Produce Image Container**:
  - 16:9 aspect ratio with rounded corners (`8px`).
  - **Image Fallback Rule**: If no image is provided, display a neutral, generic agricultural illustration or category icon (e.g., stylized leaf or sack outline). The fallback must **never** imply that a real or certified crop photograph exists.
- **Crop Name**: High-contrast, semi-bold (`--color-soil-900`).
- **Key Metrics Grid**:
  - **Price**: Bold display with currency and unit (e.g., `₹2,400 / quintal`).
  - **Available Quantity**: Plainly visible badge (e.g., `Available: 150 quintals`).
  - **General Location**: Pin icon with Village/Locality and District (e.g., `Nashik District, Maharashtra`).
    - *Security Rule*: Exact street addresses or door numbers must never appear on listing cards.
  - **Availability Date**: Calendar icon with formatted date (e.g., `Ready: Oct 10, 2026`).
- **Listing Status Badge**:
  - `ACTIVE`: Soft sprout green badge.
  - `SOLD_OUT`: Muted slate badge.
  - `CLOSED` / `CANCELLED`: Neutral grey badge.
- **Primary Action**: Obvious full-width primary button: `"View & Make Offer"`.

### 6.2 Marketplace Search & Filter Bar

- **Search Input**: Large search field with clear label: `"Search crops (e.g. Wheat, Basmati Rice, Onion)..."`.
- **Filter Chips**:
  - District / Location filter.
  - Crop category filter.
  - Price range slider or min/max inputs.
  - Availability status filter.
- **Pagination**: Obvious `"Previous"` and `"Next"` controls with explicit page indicators (`"Page 1 of 6"`).

### 6.3 Offer & Bidding Dialog

Designed for clarity so commercial commitments are completely unambiguous before submission:

- **Produce Summary Banner**: Displays crop name, farmer general location, and current available quantity.
- **Quantity Input Field**:
  - Numeric input with unit suffix (e.g., `quintal`, `kg`).
  - Live helper text indicating remaining availability: `"Maximum available: 150 quintals"`.
  - Client-side validation: must be `> 0` and `<= remaining listing quantity`.
- **Offered Price Input Field**:
  - Numeric input with currency prefix (`₹`).
  - Helper text showing starting price for reference.
- **Live Deal Value Calculator**:
  - Prominent calculation box:
    ```text
    Offered Quantity (50 quintals) × Price per Unit (₹2,200) = Total Offer: ₹1,10,000
    ```
- **Optional Note Field**: Short text area for pickup or timing requests.
- **Confirmation Action**:
  - Primary button: `"Submit Offer"` (bold green).
  - Secondary button: `"Cancel"` (outline/neutral).

### 6.4 Deal & Delivery Lifecycle Tracker

Every confirmed deal features a prominent visual progress tracker representing the exact approved lifecycle:

#### Exact Deal Status Stages:
```text
[1. CONFIRMED] ──► [2. PAYMENT_PENDING] ──► [3. PAID] ──► [4. DELIVERY] ──► [5. COMPLETED]
```

- **Deal Status Presentation**:
  - `CONFIRMED`: Deal created after farmer accepts offer. Highlighted in soft green. Prompt: *"Awaiting payment initiation."*
  - `PAYMENT_PENDING`: Payment request created with gateway. Highlighted in amber. Prompt: *"Proceed to secure payment."*
  - `PAID`: Payment verified by backend. Highlighted in deep green with lock icon. Prompt: *"Payment verified. Pickup being scheduled."*
  - `DELIVERY`: Goods in logistics coordination. Highlighted in forest green. Displays delivery status (`PICKUP_SCHEDULED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`).
  - `COMPLETED`: Produce delivered and deal finalized. Highlighted with checkmark badge.
  - `CANCELLED`: Deal aborted. Displayed as a terracotta alert badge with cancellation reason.

### 6.5 AI Price Recommendation Widget (Advisory Component)

The AI price feature must never appear authoritative, binding, or guaranteed.

- **Visual Header**: `"AI Advisory Price Estimate"` accompanied by an `"Advisory Only"` tag.
- **Estimated Range Display**:
  - Suggested Min and Max (e.g., `₹2,100 – ₹2,350 / quintal`).
  - Prominent disclaimer text: *"This is an automated advisory estimate based on available historical/market data. It is not an official government rate or guaranteed price. Final pricing is decided solely between farmer and buyer."*
- **Source Attribution**: Displays data source/model information when available (e.g., *"Source: Market benchmark feed"*).
- **Graceful Fallback State**:
  - When data is insufficient or the service is unreachable:
    ```text
    [!] Market Estimate Unavailable
    Insufficient verified market data to generate a reliable price recommendation for this crop/location.
    ```
  - Must never display a zero, arbitrary guess, or placeholder rate.

### 6.6 Status Badge Color Mapping

All badges follow this standardized status-to-token mapping:

| Entity | Status Enum | Background Token | Text Token | Border Token |
| :--- | :--- | :--- | :--- | :--- |
| **Produce Listing** | `ACTIVE` | `--color-sprout-100` | `--color-forest-900` | `--color-harvest-600` |
| **Produce Listing** | `SOLD_OUT` | `--color-slate-100` | `--color-slate-500` | `--color-border-strong` |
| **Produce Listing** | `DRAFT` / `CLOSED` | `#F3F4F6` | `#4B5563` | `#D1D5DB` |
| **Offer** | `ACTIVE` | `--color-sprout-100` | `--color-forest-900` | `--color-harvest-600` |
| **Offer** | `ACCEPTED` | `--color-forest-900` | `#FFFFFF` | `--color-forest-900` |
| **Offer** | `REJECTED` | `--color-terracotta-100` | `--color-terracotta-700` | `--color-terracotta-700` |
| **Offer** | `WITHDRAWN` | `--color-slate-100` | `--color-slate-500` | `--color-border-subtle` |
| **Offer** | `EXPIRED` | `--color-slate-100` | `--color-slate-500` | `--color-border-subtle` |
| **Deal** | `CONFIRMED` | `--color-sprout-100` | `--color-forest-900` | `--color-harvest-600` |
| **Deal** | `PAYMENT_PENDING`| `--color-amber-100` | `--color-amber-600` | `--color-amber-600` |
| **Deal** | `PAID` | `--color-forest-900` | `#FFFFFF` | `--color-forest-900` |
| **Deal** | `DELIVERY` | `--color-sprout-100` | `--color-forest-900` | `--color-harvest-600` |
| **Deal** | `COMPLETED` | `#E0F2FE` | `#0369A1` | `#0284C7` |
| **Deal** | `CANCELLED` | `--color-terracotta-100` | `--color-terracotta-700` | `--color-terracotta-700` |
| **Delivery** | `PENDING` | `--color-amber-100` | `--color-amber-600` | `--color-amber-600` |
| **Delivery** | `PICKUP_SCHEDULED`| `--color-sprout-100`| `--color-forest-900` | `--color-harvest-600` |
| **Delivery** | `PICKED_UP` | `--color-sprout-100` | `--color-forest-900` | `--color-harvest-600` |
| **Delivery** | `IN_TRANSIT` | `#E0F2FE` | `#0369A1` | `#0284C7` |
| **Delivery** | `DELIVERED` | `--color-forest-900` | `#FFFFFF` | `--color-forest-900` |
| **Delivery** | `CANCELLED` | `--color-terracotta-100` | `--color-terracotta-700` | `--color-terracotta-700` |

---

## 7. Safety, Anti-Hallucination & Scope Guards

The UI layer must strictly obey these hard boundaries:

1. **No Mocked or Fake Success Feedback**:
   - The UI must never display a green "Payment Successful" confirmation immediately upon button click without server verification.
   - It must display an active loading state (`"Verifying payment with gateway..."`) until the server responds with verified status.
2. **Strict Privacy on Addresses**:
   - Public marketplace views, listing cards, and unauthenticated screens must never render private address lines, house numbers, or private GPS coordinates. Only village/locality, district, and state are rendered.
3. **Excluded Feature Guards**:
   - No quality score badges, star ratings for produce quality, or crop grade certificates.
   - No disease diagnosis or crop health banners.
   - No digital wallet balance displays or loan application links.
   - No live GPS vehicle tracking maps or simulated delivery vehicles moving on roads.
   - No automated chatbot negotiation dialogues that claim to accept or counter-offer on behalf of users.
4. **Advisory AI Labeling**:
   - Every AI price recommendation component must include the visible text `"AI Recommendation (Advisory Only)"` to prevent misinterpretation as an official price.
