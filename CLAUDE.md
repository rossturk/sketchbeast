# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sketchbeast** is an image-to-vector art generator that converts photographs into artistic collages composed of geometric shapes using a greedy optimization algorithm. The output is scalable SVG artwork.

**This project is a derivative work based on [primitive.js](https://github.com/ondras/primitive.js) by Ondřej Žára.** The original primitive.js project pioneered the technique of reproducing images using geometric primitives with an optimization algorithm. Sketchbeast builds upon this foundation with modifications and enhancements.

## Build & Development Commands

```bash
# Build the project (bundles and minifies src/* to public/js/beast.js)
yarn run build
# or
make
# or
rollup -c

# Serve locally (for development)
# No dev server configured - open public/index.html in browser directly
# Or use any static server: python -m http.server 8000
```

The build process:
- Entry point: `src/beast.js`
- Output: `public/js/beast.js` (UMD format, minified with terser)
- Creates `public/js/` directory if it doesn't exist

## Core Architecture

### Data Flow

```
User uploads image → Beast.load() → Canvas.original()
                                         ↓
                     Beast.begin() → Creates SVG + Optimizer
                                         ↓
              Optimizer.start() → Optimization Loop (iterative)
                                         ↓
                  _findBestStep(): Generate N random shapes in parallel
                                   Compute optimal color for each (via Web Workers)
                                   Select best shape
                                         ↓
                  _optimizeStep(): Mutate shape M times
                                   Accept mutations that improve distance
                                         ↓
                  Apply step if it improves overall state
                                         ↓
                  Repeat until reaching target number of shapes
                                         ↓
                     Serialize SVG and dispatch 'beast' event
```

### Key Classes & Responsibilities

**Beast** (`beast.js`) - Main orchestrator
- Configures shape types, alpha, blur settings based on UI mode
- Loads images and initializes SVG canvas
- Creates and manages Optimizer instance
- Handles UI callbacks (onStep events, progress updates)

**Optimizer** (`optimizer.js`) - Core optimization engine
- Manages iterative shape-finding loop
- `_findBestStep()`: Generates N random candidate shapes, evaluates each in parallel, returns best
- `_optimizeStep()`: Mutates best shape M times until M consecutive failures
- Only accepts shapes that improve overall state distance metric

**Step** (`step.js`) - Represents shape + color + alpha
- `compute()`: Calculates optimal RGB color for shape placement and resulting distance metric
- `apply()`: Applies step to state, creating new state with updated canvas
- `mutate()`: Returns new Step with slightly mutated shape (and optionally alpha)

**State** (`state.js`) - Tracks optimization state
- Contains target canvas (original image), current canvas (work in progress), and distance metric
- Distance is RMS difference in RGB values across all pixels

**Shape** (`shape.js`) - Shape generation and mutations
- Shape types: Triangle, Rectangle, RotatedRectangle, Ellipse, Quadrilateral, Line, BentLine, Squiggle, Scribble
- `Shape.create()`: Generates random shape of configured type(s)
- Each shape has custom `mutate()` logic (e.g., polygons move vertices, rectangles expand/contract sides)
- `rasterize()`: Renders shape to canvas for pixel-level analysis
- `toSVG()`: Creates SVG DOM element

**Canvas** (`canvas.js`) - Canvas operations wrapper
- `Canvas.original()`: Loads and scales image to computation size (default 400px)
- `Canvas.empty()`: Creates blank canvas or SVG element
- Handles image data manipulation, drawing shapes, cloning canvases

**util.js** - Mathematical utilities
- `computeColorAndDifferenceChange()`: Core algorithm for finding optimal shape color
- Computes pixel-by-pixel change in distance when adding shape with given alpha
- Distance metric: normalized RMS difference in RGB values

**WorkerPool** (`workerPool.js`) - Web Worker management
- Pool of 4 web workers for parallel shape evaluation
- Workers compute optimal colors without blocking main thread
- Queue-based task distribution

### Configuration Object

The `cfg` object passed throughout contains:
- `steps`: Number of shapes to generate (7-150)
- `mode`: Shape type selection (0=mixed, 1=rectangles, 2=triangles, etc.)
- `blur`: Blur filter level (0=crystal clear, 1=pleasing, 2=dreamy)
- `alpha`: Shape transparency (default 0.5)
- `computeSize`: Canvas size for computation (default 400px)
- `shapes`: Candidate shapes evaluated per step (default 200)
- `mutations`: Maximum mutation attempts (default 50)
- `mutateAlpha`: Whether to mutate alpha values (default false)
- `shapeTypes`: Array of shape classes to use
- `minlinewidth`/`maxlinewidth`: Line width ranges for line-based shapes
- `nodes`: DOM nodes for output and state storage

### Optimization Algorithm Details

**Shape Evaluation:**
1. Generate N (default 200) random shapes
2. For each shape, calculate optimal color that minimizes visual difference from target
3. Select shape with best (lowest) distance improvement

**Mutation Strategy:**
- Mutate winning shape up to M (default 50) times
- Accept mutations that improve distance
- Stop after M consecutive failed mutations
- Each shape type has custom mutation logic (move vertices, adjust dimensions, etc.)

**Distance Metric:**
- Root-mean-square difference in RGB values across all pixels
- Normalized by image dimensions and bit depth: `sqrt(difference / (3 * pixels)) / 255`
- Lower distance = closer match to target image

**Color Computation:**
- For each pixel covered by shape, calculate color that minimizes difference
- Formula accounts for current canvas state, target image, and alpha blending
- Color computed before distance, as optimal color depends on current state

## Common Workflows

### Adding a New Shape Type

1. Add shape class to `src/shape.js` extending base `Shape` class
2. Implement `constructor()` with random generation logic
3. Implement `mutate()` for shape refinement
4. Implement `rasterize()` to draw shape on canvas
5. Implement `toSVG()` to create SVG element
6. Add to `Beast.configure()` mode switch in `src/beast.js`

### Modifying Optimization Parameters

Default parameters in `public/index.html` (lines 276-287):
- `computeSize`: Resolution for computation (higher = slower but more precise)
- `shapes`: Candidates per step (higher = better shapes but slower)
- `alpha`: Shape transparency
- `mutations`: Mutation attempts (higher = better refinement but slower)

### Testing Changes

No automated tests exist. Manual testing:
1. Build: `yarn run build`
2. Open `public/index.html` in browser
3. Upload test image
4. Select configuration (shape count, type, blur)
5. Click "this button" to generate
6. Verify SVG output quality and download functionality

## GitHub Actions

Three workflows configured:
1. **Publish** (`.github/workflows/publish.yml`): Builds and deploys to GitHub Pages on main branch push
2. **PR Preview** (`.github/workflows/pr-preview.yml`): Deploys PR previews to `gh-pages` in subdirectories
3. **PR Preview Cleanup** (`.github/workflows/pr-preview-cleanup.yml`): Removes preview directories when PRs close

All workflows use Yarn and Node 16, run `yarn run build`, and deploy `./public` directory.

## Notable Implementation Details

- **Web Workers**: Color computation offloaded to workers to prevent UI blocking. Workers are located at `js/worker.js` (copied from `src/worker.js` during build).
- **SVG Generation**: Shapes are rendered to both canvas (for optimization) and SVG (for output). SVG serialization happens on every step for live preview.
- **Continue Feature**: `Beast.continue()` allows adding more shapes to existing SVG by reinitializing optimizer with current state.
- **Random Variance**: User-selected shape count is randomized ±20% to add variety (line 133 in `public/index.html`).
- **No Testing Framework**: Project has no unit tests or test runner configured.

## Dependencies

- **Rollup 3.5.1+**: Module bundler
- **@rollup/plugin-terser**: Minification
- **jQuery 3.5.1** (CDN): DOM manipulation in UI
- **Bootstrap 4.5.3** (CDN): UI styling

Web APIs used: Canvas API, SVG DOM API, Web Workers, FileReader API, XMLSerializer

## Repository Info

- **License**: MIT
  - Original work Copyright (c) Ondřej Žára
  - Modified work Copyright (c) Ross Turk
- **Original Author**: Ondřej Žára (primitive.js)
- **Derivative Work Author**: Ross Turk <ross@rossturk.com>
- **Contact**: sketchbeast@basementexperiment.com
- **Repository**: git@github.com:rossturk/sketchbeast.git
- **Original Project**: https://github.com/ondras/primitive.js
