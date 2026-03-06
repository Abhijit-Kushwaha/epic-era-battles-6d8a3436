
# ERA WARS -- Sound, Minimap, and Night Vision

## 1. Sound Effects System

Create a new `src/game/soundSystem.ts` module using the Web Audio API to generate synthesized sounds (no external audio files needed).

**Sounds per era:**
- **Shooting:** Each era gets a unique synthesized sound (ancient = twang, medieval = thud, modern = sharp crack, future = laser zap)
- **Hit impact:** A short percussive burst when a projectile lands
- **Footsteps:** Rhythmic low thumps tied to player movement, varying pitch by era
- **Reload:** Mechanical click sequence
- **Ambient:** A looping background drone/pad unique to each era (wind for ancient, birds for medieval, city hum for modern, electronic pulse for future)

Integration points:
- `use3DGameEngine.ts`: Call sound functions on fire, hit, reload, and death events
- `CombatArena3D.tsx`: Start ambient loop on mount, play footstep sounds based on player movement in the game loop

## 2. Minimap Component

Create `src/components/Minimap.tsx` -- a fixed-position 2D canvas overlay in the bottom-right or top-left corner of the HUD.

**Features:**
- Renders a top-down view of the map (scaled-down rectangles from `mapBlocks`)
- Player shown as a green arrow/triangle indicating direction
- Enemies shown as red dots (only visible within detection range or always, configurable)
- Map walls/cover rendered as gray/brown blocks
- Rotating or fixed orientation (player-up vs north-up)
- Semi-transparent background

**Implementation:**
- Use an HTML5 `<canvas>` element drawn each frame via `useEffect` + `requestAnimationFrame`
- Takes `player`, `enemies`, and `mapBlocks` as props
- Renders inside the HUD overlay in `CombatArena3D.tsx`

## 3. Night Vision System

Create `src/components/NightVision.tsx` -- a modular overlay component with CSS filter-based post-processing.

**Visual effects (CSS-based for performance):**
- Green monochrome filter via `hue-rotate + saturate` CSS filters on the canvas
- Increased brightness and contrast
- Vignette via a radial-gradient overlay div
- Grain/noise via a small repeating SVG or CSS animation on a semi-transparent layer
- Enemy glow: enemies get an emissive boost when night vision is active (passed as a prop to `VoxelCharacter`)

**Toggle and battery system:**
- Press `N` to toggle on/off
- Battery bar (0-100%) drains at ~5% per second while active
- Auto-disables at 0% battery
- Recharges at ~8% per second when off
- Smooth fade transition (CSS transition on opacity/filter over 0.3s)
- Battery bar displayed in the HUD near the HP bar

**State management:**
- Night vision state (active, battery) managed in `use3DGameEngine.ts` or a new `useNightVision.ts` hook
- `N` key added to the existing key handler
- Battery updates run in the existing game loop

---

## Technical Details

### New Files
| File | Purpose |
|------|---------|
| `src/game/soundSystem.ts` | Web Audio API sound synthesis and playback |
| `src/components/Minimap.tsx` | 2D canvas minimap overlay |
| `src/hooks/useNightVision.ts` | Night vision state, battery, toggle logic |
| `src/components/NightVision.tsx` | Visual overlay (green filter, vignette, grain) |

### Modified Files
| File | Changes |
|------|---------|
| `src/game/use3DGameEngine.ts` | Add sound triggers on fire/hit/kill/death; add `N` key binding; expose movement state for footsteps |
| `src/components/CombatArena3D.tsx` | Add Minimap component to HUD; wrap Canvas in NightVision filter; pass nightVision active state to enemies for glow; add battery bar to HUD; start/stop ambient sounds |

### Performance Considerations
- CSS filters applied to a wrapper div (not per-frame shader) -- very lightweight
- Minimap uses a small canvas (150x150px) with simple rect drawing
- Sound synthesis uses oscillators (no file loading)
- Night vision grain uses a tiny animated CSS pattern, not per-pixel noise
