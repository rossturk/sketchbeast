# Sketchbeast Algorithm Analysis

## Overview

**Sketchbeast** is an **image-to-vector art generator** that converts photographs into artistic collages composed of geometric shapes. The core algorithm is a **greedy optimization algorithm** that iteratively approximates a target image by adding semi-randomly generated shapes with optimally calculated colors.

## Core Algorithm Steps

1. Load an input image and prepare it as a "target" canvas
2. Generate random shapes (triangles, rectangles, ellipses, lines, etc.)
3. For each shape, calculate the optimal color that minimizes the visual difference
4. Apply mutations to refine the shape placement and color
5. Accept or reject the shape based on whether it improves the overall approximation
6. Repeat until reaching the desired number of shapes

## Key Files and Their Purposes

| File | Purpose |
|------|---------|
| **beast.js** | Main orchestrator class that manages the overall process, configuration, and UI interaction |
| **optimizer.js** | Core optimization engine that iteratively finds and applies best shapes |
| **shape.js** | Defines all shape types (Triangle, Rectangle, RotatedRectangle, Ellipse, Quadrilateral, Line, BentLine, Squiggle, Scribble) and shape generation logic |
| **canvas.js** | Wraps canvas operations, handles image loading, rendering, and pixel data manipulation |
| **step.js** | Represents a single step in the optimization (a shape + color + alpha) and computes its improvement |
| **state.js** | Tracks the state of the optimization (target image, current approximation, distance metric) |
| **util.js** | Mathematical utilities for color computation, distance/difference calculations, and pixel-level operations |
| **worker.js** | Web Worker for offloading color computation to prevent blocking |
| **workerPool.js** | Manages a pool of web workers for parallel processing |

## Inputs and Outputs

### Inputs

- **Image file**: User uploads any image (JPG, PNG, etc.)
- **Configuration options**:
  - Number of shapes/steps (7-150)
  - Shape types (mixed, rectangles, triangles, ellipses, lines, squiggles, etc.)
  - Blur effect (crystal clear, pleasing, dreamy)
  - Alpha transparency value (default 0.5)
  - Computation size (default 400px)

### Outputs

- **SVG vector image**: The result is rendered as scalable SVG with:
  - Individual shape elements with calculated colors
  - Opacity/alpha values
  - Optional blur filters
  - Downloadable as SVG file

## Dependencies

### External Libraries

- **Rollup**: Module bundler (v3.5.1+)
- **rollup-plugin-terser**: JavaScript minifier for production builds
- **jQuery**: DOM manipulation (via CDN in HTML)
- **Bootstrap 4**: UI styling (via CDN)

### Web APIs Used

- Canvas API: For image manipulation and rendering
- SVG DOM API: For vector output generation
- Web Workers: For parallel pixel computation
- FileReader API: For image file handling
- XMLSerializer: For SVG serialization

## Architecture and Data Flow

```
User Interface (index.html)
    ↓
Beast (Main Controller)
    ├→ Canvas.original() [Load & prep image]
    ├→ Optimizer.start()
    │   ├→ _findBestStep() [Generate & evaluate candidate shapes]
    │   │   ├→ Shape.create() [Random shape generation]
    │   │   └→ Step.compute() [Calculate optimal color & distance]
    │   └→ _optimizeStep() [Mutate & refine best shape]
    │       ├→ Shape.mutate() [Small random modifications]
    │       └→ Step.compute() [Re-evaluate]
    └→ SVG Output [Display & download]
```

## Technical Highlights

### Color Optimization (util.js)

- Uses pixel-by-pixel analysis to find the optimal RGB color for each shape
- Computes the change in overall visual difference when adding the shape
- Formula: Considers current canvas, target image, and shape alpha blending

### Distance Metric

- Root-mean-square (RMS) difference in RGB values across all pixels
- Normalized by image dimensions and bit depth
- Used to compare different shapes and mutations

### Shape Mutation Strategy

Each shape type has customized mutation logic:
- **Polygons**: Move individual vertices by small random amounts
- **Rectangles**: Expand/contract individual sides
- **Rotated rectangles**: Rotate, scale width/height independently
- **Ellipses**: Move center, adjust radii
- **Lines**: Adjust endpoints

### Optimization Loop

1. Generate N random shapes and evaluate each (parallel evaluation via Web Workers)
2. Select the shape that produces the best improvement
3. Mutate it M times, accepting mutations that improve the result
4. Stop mutation when M consecutive mutations fail to improve
5. Accept shape if it improves the overall state

## ComfyUI Node Conversion Plan

To convert this algorithm into a ComfyUI node, the following adaptations would be needed:

### 1. Port from JavaScript to Python

The algorithm is currently in JavaScript but needs to be in Python for ComfyUI.

### 2. Replace Canvas API with PIL/NumPy

- Use PIL (Pillow) for image loading and manipulation
- Use NumPy arrays for efficient pixel operations
- Replace Canvas drawing with PIL's ImageDraw or direct NumPy operations

### 3. Adapt Shape Rendering

Options:
- Use a Python SVG library (`svgwrite`, `drawsvg`) for vector output
- Render shapes directly to PIL images for raster output
- Hybrid approach: generate SVG and optionally rasterize

### 4. Replace Web Workers

- Remove Web Worker dependency (browser-specific)
- Options:
  - Python multiprocessing for parallel shape evaluation
  - Simple synchronous processing (may be acceptable for ComfyUI)
  - Threading for I/O-bound operations

### 5. ComfyUI Node Interface

Create a node with:

**Inputs**:
- `image`: Input image tensor
- `num_shapes`: Integer (7-150)
- `shape_type`: String/dropdown (mixed, triangles, rectangles, etc.)
- `alpha`: Float (0.0-1.0)
- `blur_amount`: Float or discrete selection
- `seed`: Integer for reproducibility

**Outputs**:
- `image`: Generated raster image (tensor)
- `svg`: Optional SVG string output

### Key Conversion Challenges

1. **Canvas to NumPy**: Converting pixel manipulation from Canvas API to NumPy operations
2. **Shape rendering**: Efficiently rendering shapes on NumPy arrays or PIL images
3. **Performance**: Web Workers provided parallelism; need Python equivalent
4. **SVG generation**: If maintaining vector output, need Python SVG library
5. **Integration**: Ensure compatibility with ComfyUI's tensor formats and conventions

### Conversion Strategy

**Phase 1: Core Algorithm Port**
- Port shape generation logic to Python classes
- Implement color optimization using NumPy
- Create distance metric calculation

**Phase 2: Rendering System**
- Implement shape drawing on NumPy/PIL images
- Add SVG generation capability

**Phase 3: ComfyUI Integration**
- Create node class with proper INPUT_TYPES
- Handle tensor conversion (ComfyUI format ↔ PIL/NumPy)
- Add progress callbacks for ComfyUI UI

**Phase 4: Optimization**
- Add multiprocessing for shape evaluation
- Optimize NumPy operations
- Profile and improve bottlenecks

## Project Metadata

- **Name**: Sketchbeast
- **Version**: 1.0.0
- **License**: MIT
- **Repository**: git@github.com:rossturk/sketchbeast.git
- **Author**: Ross Turk
- **Contact**: sketchbeast@basementexperiment.com

## Build Process

```bash
npm run build  # Runs: rollup -c
```

- Takes `src/beast.js` as input
- Bundles all dependencies
- Minifies with terser
- Outputs to `public/js/beast.js` as UMD module
