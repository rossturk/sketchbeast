# Sketchbeast

An image-to-vector art generator that converts photographs into artistic collages composed of geometric shapes using a greedy optimization algorithm. The output is scalable SVG artwork.

## Attribution

**This project is a derivative work based on [primitive.js](https://github.com/ondras/primitive.js) by Ondřej Žára.**

The original primitive.js project pioneered the technique of reproducing images using geometric primitives with a genetic/optimization algorithm. Sketchbeast builds upon this foundation with modifications and enhancements.

## License

MIT License

Original work Copyright (c) Ondřej Žára
Modified work Copyright (c) Ross Turk

## Getting Started

### Build

```bash
yarn run build
# or
make
# or
rollup -c
```

### Development

No dev server is configured. Simply open `public/index.html` in your browser, or use any static server:

```bash
python -m http.server 8000
```

## How It Works

Sketchbeast uses a greedy optimization algorithm to iteratively add geometric shapes to a blank canvas, each time selecting the shape that most improves the visual similarity to the target image.

1. Generate N random candidate shapes
2. For each shape, compute the optimal color that minimizes difference from target
3. Select the best shape
4. Mutate the winning shape to refine it further
5. Add shape to the SVG and repeat

Shape types include: Triangle, Rectangle, Rotated Rectangle, Ellipse, Quadrilateral, Line, Bent Line, Squiggle, and Scribble.

## Usage

1. Open `public/index.html` in a browser
2. Upload an image
3. Select the number of shapes and shape type
4. Click the button to generate SVG artwork
5. Download the resulting SVG file

## Contact

Ross Turk <ross@rossturk.com>
sketchbeast@basementexperiment.com

## Repository

https://github.com/rossturk/sketchbeast
