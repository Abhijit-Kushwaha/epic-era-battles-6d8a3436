

# Shoulder-Aim Zoom Mode

## What it does
When the player **holds right-click in TPV mode**, the camera shifts to a shoulder-aim position with a tighter FOV, providing an over-the-shoulder aiming view. Releasing right-click returns to normal TPV.

## Changes

### 1. `src/game/use3DGameEngine.ts`
- Track a new `isAiming` boolean state (true while right mouse button is held)
- Change `onMouseDown` to detect `event.button === 2` (right-click) to set `isAiming = true` instead of triggering lock-on
- Change `onMouseUp` to detect `event.button === 2` to set `isAiming = false`
- Keep left-click (`button === 0`) for firing
- Keep `contextmenu` prevention but remove lock-on from it (move lock-on to Q-key only)
- Expose `isAiming` in the return object

### 2. `src/components/CombatArena3D.tsx` — `CameraController`
- Accept new `isAiming` prop
- When `isAiming && cameraMode === "tpv"`:
  - Reduce TPV distance from 5 to ~2.5
  - Offset camera X by +0.8 (right shoulder)
  - Raise camera Y slightly (+0.3)
  - Reduce target FOV from 70 to ~55
  - Look target shifts to the far aim point (like FPV look target) instead of the player center
- Smooth transition using existing lerp pattern (~0.15 factor)
- All changes are additive to existing TPV logic, no structural refactor needed

### 3. HUD updates
- Show a subtle "ADS" indicator or tighten the crosshair when aiming in TPV

## Controls Summary
| Input | Action |
|-------|--------|
| Right-click hold | Shoulder aim (TPV) / was lock-on toggle |
| Q key | Lock-on toggle (unchanged) |
| V key | Switch FPV/TPV (unchanged) |

