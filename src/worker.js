// Import required modules
self.SVGNS = "http://www.w3.org/2000/svg";

// Utility functions (duplicated from util.js for worker context)
function clamp(x, min, max) {
	return Math.max(min, Math.min(max, x));
}

function clampColor(x) {
	return clamp(x, 0, 255);
}

function computeColor(offset, imageData, alpha) {
	let color = [0, 0, 0];
	let {shape, current, target} = imageData;
	let shapeData = shape.data;
	let currentData = current.data;
	let targetData = target.data;

	let si, sx, sy, fi, fx, fy;
	let sw = shape.width;
	let sh = shape.height;
	let fw = current.width;
	let fh = current.height;
	let count = 0;

	for (sy=0; sy<sh; sy++) {
		fy = sy + offset.top;
		if (fy < 0 || fy >= fh) { continue; }

		for (sx=0; sx<sw; sx++) {
			fx = offset.left + sx;
			if (fx < 0 || fx >= fw) { continue; }

			si = 4*(sx + sy*sw);
			if (shapeData[si+3] == 0) { continue; }

			fi = 4*(fx + fy*fw);
			color[0] += (targetData[fi] - currentData[fi]) / alpha + currentData[fi];
			color[1] += (targetData[fi+1] - currentData[fi+1]) / alpha + currentData[fi+1];
			color[2] += (targetData[fi+2] - currentData[fi+2]) / alpha + currentData[fi+2];

			count++;
		}
	}

	return color.map(x => ~~(x/count)).map(clampColor);
}

function computeDifferenceChange(offset, imageData, color) {
	let {shape, current, target} = imageData;
	let shapeData = shape.data;
	let currentData = current.data;
	let targetData = target.data;

	let a, b, d1r, d1g, d1b, d2r, d2b, d2g;
	let si, sx, sy, fi, fx, fy;
	let sw = shape.width;
	let sh = shape.height;
	let fw = current.width;
	let fh = current.height;

	var sum = 0;

	for (sy=0; sy<sh; sy++) {
		fy = sy + offset.top;
		if (fy < 0 || fy >= fh) { continue; }

		for (sx=0; sx<sw; sx++) {
			fx = offset.left + sx;
			if (fx < 0 || fx >= fw) { continue; }

			si = 4*(sx + sy*sw);
			a = shapeData[si+3];
			if (a == 0) { continue; }

			fi = 4*(fx + fy*fw);

			a = a/255;
			b = 1-a;
			d1r = targetData[fi]-currentData[fi];
			d1g = targetData[fi+1]-currentData[fi+1];
			d1b = targetData[fi+2]-currentData[fi+2];

			d2r = targetData[fi] - (color[0]*a + currentData[fi]*b);
			d2g = targetData[fi+1] - (color[1]*a + currentData[fi+1]*b);
			d2b = targetData[fi+2] - (color[2]*a + currentData[fi+2]*b);

			sum -= d1r*d1r + d1g*d1g + d1b*d1b;
			sum += d2r*d2r + d2g*d2g + d2b*d2b;
		}
	}

	return sum;
}

function computeColorAndDifferenceChange(offset, imageData, alpha) {
	let rgb = computeColor(offset, imageData, alpha);
	let differenceChange = computeDifferenceChange(offset, imageData, rgb);
	let color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
	return {color, differenceChange};
}

// Message handler
self.onmessage = function(e) {
	try {
		const {offset, shape, current, target, alpha} = e.data;

		// Reconstruct ImageData objects
		const imageData = {
			shape: {
				data: new Uint8ClampedArray(shape.data),
				width: shape.width,
				height: shape.height
			},
			current: {
				data: new Uint8ClampedArray(current.data),
				width: current.width,
				height: current.height
			},
			target: {
				data: new Uint8ClampedArray(target.data),
				width: target.width,
				height: target.height
			}
		};

		const result = computeColorAndDifferenceChange(offset, imageData, alpha);
		self.postMessage({success: true, result});
	} catch (error) {
		self.postMessage({success: false, error: error.message});
	}
};
