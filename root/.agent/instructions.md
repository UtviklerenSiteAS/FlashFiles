# FlashFiles Design Guidelines

Always follow these design principles when modifying or creating new screens for FlashFiles:

## Core Aesthetics
- **Background**: Always use a clean white background (`#FFFFFF`).
- **Alignment**: All content, headers, and text must be **left-aligned** (`alignItems: 'flex-start'` or `textAlign: 'left'`).
- **Typography**: 
    - Use black (`#000000`) for primary text and titles.
    - Use dark gray (`#666666`) or medium gray (`#999999`) for secondary/subtitle text.
    - Titles should be bold/extra-bold (`fontWeight: '800'`).
    - **Feature points/Highlights**: Use a **horizontal, edge-to-edge infinite-scrolling marquee** under the title with compact spacing (`20px` gap) to maintain a fast-paced, modern feel.
    - **Visual Storytelling**: Use subtle, looped animations (e.g., a phone frame with a **3D swipe motion**) to fill large white spaces. The animation should use a **quick snap flick gesture** (very short touch travel, releases instantly) to show files "flying out" of the frame, representing high-velocity, effortless transfers.

## Components
- **Buttons**:
    - Primary actions: Solid black background (`#000000`) with white text.
    - Secondary actions: Transparent background with a light border (`#EEEEEE`) and black text.
    - Border radius: `12px`.
- **Inputs**:
    - Use a very light gray background (`#F5F5F7`).
    - No heavy borders; use subtle background fills.
    - Padding: `16px` horizontal, `56px` height.
- **Icons**:
    - Primary icons should use system blue (`#007AFF`) or black.

## Layout & Spacing
- **Maximize White Space**: Do not cluster all elements in the center of the screen.
- **Vertical Distribution**: On landing/start screens, create interest by placing the **Visual Animation at the top** (using `flex: 1` to push content down) and the **Title/Features/Actions grouped at the bottom**. For the **Authenticated Home Screen**, use a strictly centered minimalist layout on a pure white background.
- **Alignment**: All content, headers, and text must be **left-aligned** (`alignItems: 'flex-start'`).
- **Padding**: Use standard horizontal padding of `30px`. Use vertical padding (e.g., `80px` top, `100px` bottom) to create a spacious, breathable feel.

## User Experience

## Popup & Modal Cards
When creating popup cards, notifications, or modals, follow this premium style pattern:

- **Positioning**: Use `position: fixed` with generous margins from screen edges (`48px` minimum).
- **Sizing**: Fixed width (`320px-360px`) with `maxWidth: calc(100vw - 96px)` for responsiveness.
- **Container Style**:
    - Background: Pure white (`#FFFFFF`) or semi-transparent (`rgba(255,255,255,0.95)` with backdrop blur).
    - Border radius: Large, soft corners (`24px-32px`).
    - Shadow: Deep, layered shadow for "floating" effect: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)`.
    - Overflow: `hidden` to clip content to rounded corners.
- **Internal Layout**:
    - Padding: `12px` around image/preview areas, `20px` for text/action areas.
    - Image containers: `border-radius: 24px`, `aspect-ratio: 1/1`, `background: #f5f5f5`.
- **Buttons**:
    - Primary (Accept): `background: #007AFF`, white text, `border-radius: 16px`, `padding: 14px 0`, with blue glow shadow (`0 8px 20px rgba(0, 122, 255, 0.35)`).
    - Secondary (Decline): `background: #f3f4f6`, dark gray text (`#374151`), `border-radius: 16px`.
    - Use `display: flex` with `gap: 12px` for button rows.
- **Animation**: Use spring animations for entry/exit (`type: 'spring', damping: 25, stiffness: 300`). Entry from bottom with scale (`y: 60, scale: 0.95` → `y: 0, scale: 1`).
- **Typography**:
    - Title: `fontWeight: 700`, `fontSize: 18px`, `color: #111`.
    - Subtitle/filename: `fontSize: 14px`, `color: #888`, with `text-overflow: ellipsis`.
- **IMPORTANT**: Always use **inline styles** for popup components to ensure reliable rendering across all environments.

## Backend & Environment
- **Provider**: Supabase.
- **Environment Variables**:
    - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
- **Client**: Use the shared client from `@/lib/supabase`.
