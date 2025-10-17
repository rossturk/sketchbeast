# Sketchbeast v2.0 - Quick Start Guide

## What Changed?

Sketchbeast now has:
- ⚡ **Web Workers** - Faster, multi-threaded processing
- 📱 **Mobile Support** - Works great on phones and tablets
- ♿ **Accessibility** - Screen reader and keyboard friendly
- 🎯 **Better Performance** - Smoother rendering, responsive UI
- 🛡️ **Error Handling** - Clear messages when things go wrong
- 🚫 **No jQuery** - Modern vanilla JavaScript
- 📦 **Better Build** - Proper bundling with Rollup

## Quick Test (Without Building)

The new HTML file is ready to use! Just need a web server:

```bash
# Option 1: Python (easiest)
python3 -m http.server 8000 --directory public

# Option 2: PHP
php -S localhost:8000 -t public

# Then open http://localhost:8000
```

**Note**: The JavaScript modules won't work if you just double-click index.html - you need a web server.

## To Build for Production

If you want minified, optimized code:

```bash
# Install dependencies
npm install
# or
yarn install

# Build
npm run build
# or
yarn build

# This creates:
# - public/js/beast.js (minified main bundle)
# - public/js/worker.js (minified worker bundle)
```

## Files You Care About

### For Users
- `public/index.html` - The new, modernized interface
- `public/index-old.html` - Backup of the original (just in case)

### For Developers
- `src/` - All the source code (modernized)
- `rollup.config.mjs` - Build configuration
- `IMPROVEMENTS.md` - Detailed documentation of all changes
- `UPGRADE_SUMMARY.md` - Summary of what was done

## What Works Right Now

✅ Everything! The code is backward compatible:

```javascript
// Old code still works
const beast = new Beast();
beast.configure({
  computeSize: 400,
  shapes: 200,
  alpha: 0.5
});
```

```javascript
// New features are optional
beast.configure({
  useWorkers: true,  // NEW: Enable Web Workers (default: true)
  batchSize: 5,      // NEW: Batch rendering (default: 5)
  // ... all old options still work
});
```

## Testing Checklist

Quick things to verify:

1. **Upload an image** - Should preview correctly
2. **Click "this button"** - Should process
3. **Try on mobile** - Layout should stack vertically
4. **Try invalid file** - Should show error message
5. **Check console** - Should see "Initialized X Web Workers"

## Performance Tips

### If Processing is Slow
- Check console for "Failed to initialize Web Workers" message
- Try smaller images (under 2000px)
- Reduce shape count

### If UI is Laggy
- Increase `batchSize` to reduce DOM updates
- Check if browser is limiting workers

## Troubleshooting

### "Web Workers not available"
- This is fine! Falls back to main thread automatically
- Still works, just a bit slower

### "Failed to load image"
- Check file format (JPG, PNG, GIF should work)
- Try a different image
- Check browser console for details

### Page won't load
- Make sure you're using a web server (not file://)
- Check browser console for errors
- Try `public/index-old.html` to verify server is working

### Build fails
- Make sure Node.js and npm are installed
- Try deleting `node_modules` and running `npm install` again
- Check `yarn-error.log` if using yarn

## Browser Requirements

### Recommended
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Minimum
- Any modern browser with ES6 support
- Web Workers optional (automatic fallback)

## Deployment

To deploy to production:

1. Build the project: `npm run build`
2. Upload the `public/` directory to your web server
3. Done!

All dependencies are either bundled or loaded from Bootstrap CDN.

## Key Improvements You'll Notice

1. **Faster processing** - Multiple CPU cores used automatically
2. **Stays responsive** - UI doesn't freeze during processing
3. **Works on mobile** - Proper layout and touch support
4. **Better errors** - Clear messages instead of silent failures
5. **Keyboard friendly** - Can use without a mouse
6. **Smaller page** - No jQuery = faster load

## Development

### Watch mode (auto-rebuild on changes)
```bash
npm run dev
```

### Project structure
```
src/
  beast.js         - Main controller
  optimizer.js     - Shape optimization loop
  step.js          - Single shape + color computation
  shape.js         - Shape definitions
  canvas.js        - Canvas wrapper
  worker.js        - Web Worker code
  workerPool.js    - Worker pool management
  utilGPU.js       - GPU acceleration framework
  util.js          - Utility functions

public/
  index.html       - Main HTML (modernized)
  css/             - Styles
  js/              - Built JavaScript (generated)
  images/          - Demo images
```

## Need Help?

1. Check `IMPROVEMENTS.md` for detailed docs
2. Check browser console for error messages
3. Try the old version: `public/index-old.html`
4. Check if issue exists in original version

## Summary

**Everything works and is backward compatible!**

The new version adds:
- Performance improvements
- Mobile support
- Accessibility
- Better error handling

But the core functionality and API remain the same.

Just build and deploy! 🚀
