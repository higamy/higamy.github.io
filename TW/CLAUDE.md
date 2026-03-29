# TW (Tribal Wars) Tools

A collection of browser-based tools for the game Tribal Wars (tribalwars.net).

> **Note:** Update this file whenever you learn new details about the game mechanics, coordinate system, building stats, or any other Tribal Wars domain knowledge that would be useful for future development.

## Project Structure

```
TW/
  main.html              - Main stats viewer (tribe/player statistics with Highcharts)
  script.js              - Stats viewer logic (loads data from TW/Data/ JSON files)
  styles.css             - Styles for the stats viewer (main.html)
  tw-tools.css           - Shared stylesheet for optimizer tools (light/dark mode)
  mintOptimizer.html     - Mint village optimizer tool
  churchOptimizer.html   - Church placement optimizer tool
  massScavCopy.js        - In-game scavenging script
  tribeMembersTrend.js   - Tribe member trend analysis
  troopCountSummary.js   - Troop count summaries
  upgradeFlags.js        - Upgrade flag script
  Data/                  - Tribe/player statistics by server and world
  Scripts/               - In-game scripts (Approved/ and Unapproved/)
```

## Shared Stylesheet: tw-tools.css

Used by `mintOptimizer.html` and `churchOptimizer.html`. Provides:
- CSS custom properties for theming (dark/light mode)
- Common component classes prefixed with `tw-` (e.g. `tw-section`, `tw-btn`, `tw-stat-card`)
- Light/dark mode toggle via `data-theme="light"` attribute on `<html>`
- Theme preference persisted in `localStorage` key `tw-tools-theme`
- Dark mode: navy/dark blue palette (#1a1a2e, #16213e, #0f3460) with red accent (#e94560)
- Light mode: TW game-style tan/brown palette (#d2c09e, #f4e4c1) with brown accent (#804000), uses TW background tile

## Coordinate System

- Villages use `XXX|YYY` format (e.g. `601|483`)
- X and Y range from 0-999
- **Y increases southward** (matching the game map) - important for canvas rendering
- Coordinates are parsed with regex `\d{1,3}\|\d{1,3}` which strips messy text, allowing users to paste raw game data
- On paste/input, coordinates are automatically cleaned - any surrounding text is stripped leaving only the coordinates
- Duplicates are filtered by coordinate string
- Player-owned villages are rendered in gold (#f0c800) on all maps

## Mint Optimizer (mintOptimizer.html)

Finds optimal "mint" (resource distribution) villages to minimise total travel distance.

- **Algorithm**: k-medoids clustering
  - Brute force if C(n,k) <= 100,000 combinations
  - Greedy + local swap improvement for larger inputs
- **Inputs**: village coordinates, number of mints, deliveries per village
- **Outputs**: selected mint villages, group assignments, distance stats, village map, dynamic group filters
- **Dynamic Filters**: finds circular distance filters for in-game group setup using sweep-line optimisation
- **Map**: HTML5 Canvas with interactive tooltips, group coloring, filter circle overlays

## Church Optimizer (churchOptimizer.html)

Finds minimum number of churches needed to provide religious coverage to all villages.

### Game Mechanics
- A church provides a radius of influence; villages within radius fight at full strength
- Villages outside all church radii fight at 50% strength
- No benefit to being covered by multiple churches
- **Church Level 1**: radius 4 fields
- **Church Level 2**: radius 6 fields
- **Church Level 3**: radius 8 fields
- Church image: `https://dsen.innogamescdn.com/asset/7d1f39b6/graphic/big_buildings/church3.webp`

### Algorithm
1. **Minimum set cover** (NP-hard problem):
   - Brute force: tries all subsets of increasing size k=1,2,3... until coverage found (if C(n,k) <= 200,000)
   - Greedy fallback: iteratively picks the village covering the most uncovered villages
2. **Level optimisation** (minimise total church levels):
   - For <= 12 churches: exhaustive search of all level combinations (3^n) with pruning
   - For more: greedy reduction (try reducing each church's level, check coverage maintained)
3. Priority: minimum churches first, then minimum total levels

### Outputs
- Number of churches needed and their levels
- Coverage count (X/Y villages covered)
- Per-church coverage details
- Village map with radius circles (color-coded by level: green=Lv1, blue=Lv2, red=Lv3)
- Uncovered villages highlighted with red X

## Stats Viewer (main.html)

- Uses Bootstrap 5, jQuery, Axios, Highcharts
- Two-column layout: plot selector sidebar + chart area
- Loads tribe/player data from `TW/Data/` directory (JSON files organised by server/world)
- Supports searching and grouping tribes/players for comparison charts

## External Dependencies

- InnoGames CDN (`dsen.innogamescdn.com`): game assets, building images, icons
- twstats.co.uk: background tile image used in light mode and stats viewer
- Bootstrap 5 (CDN) - stats viewer only
- jQuery, Axios, Highcharts (CDN) - stats viewer only

## Canvas Rendering Notes

- Y axis is NOT flipped (cy = offsetY + (gy - dataMinY) * scale) because game Y increases downward
- Grid lines use `niceStep()` for readable axis intervals
- Theme-aware colors read from CSS custom properties via `getComputedStyle()`
- Charts redraw on theme toggle to update canvas colors
- Tooltip follows mouse with nearest-village snapping (20px threshold)
- Maps support zoom (mouse wheel) and pan (click-drag), double-click to reset
- Zoom/pan state is stored in `zoomLevel`, `panX`, `panY` globals and reset on new calculation

## Development

- All optimizer tools are self-contained HTML files with inline JS
- No build step required - open directly in browser or serve with any HTTP server
- `styles.css` is for the stats viewer only; `tw-tools.css` is for optimizer tools
- Adding a new optimizer tool: link `tw-tools.css`, use `tw-` prefixed classes, add theme toggle JS snippet
