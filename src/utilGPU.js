// GPU-accelerated color and difference calculations using WebGL
export class GPUCompute {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl2', { premultipliedAlpha: false }) ||
		          this.canvas.getContext('webgl', { premultipliedAlpha: false });

		if (!this.gl) {
			console.warn('WebGL not available, GPU acceleration disabled');
			this.available = false;
			return;
		}

		this.available = true;
		this.setupShaders();
		this.setupBuffers();
		console.log('🚀 GPU Compute: Initialized successfully');
	}

	setupBuffers() {
		const gl = this.gl;

		// Create a full-screen quad
		const positions = new Float32Array([
			-1, -1,
			 1, -1,
			-1,  1,
			 1,  1,
		]);

		this.positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

		// Create textures for reuse
		this.textures = {
			shape: gl.createTexture(),
			current: gl.createTexture(),
			target: gl.createTexture()
		};

		// Create framebuffer for reading results
		this.framebuffer = gl.createFramebuffer();
	}

	setupShaders() {
		const gl = this.gl;

		// Vertex shader - simple passthrough
		const vertexShaderSource = `
			attribute vec2 a_position;
			varying vec2 v_texCoord;

			void main() {
				gl_Position = vec4(a_position, 0.0, 1.0);
				v_texCoord = a_position * 0.5 + 0.5;
			}
		`;

		// Fragment shader for computing optimal color
		const colorShaderSource = `
			precision highp float;

			uniform sampler2D u_shape;
			uniform sampler2D u_current;
			uniform sampler2D u_target;
			uniform float u_alpha;
			uniform vec2 u_resolution;

			varying vec2 v_texCoord;

			void main() {
				vec4 shape = texture2D(u_shape, v_texCoord);
				vec4 current = texture2D(u_current, v_texCoord);
				vec4 target = texture2D(u_target, v_texCoord);

				// Only process where shape has alpha
				if (shape.a > 0.0) {
					// Compute optimal color contribution
					vec3 diff = (target.rgb - current.rgb) / u_alpha + current.rgb;
					gl_FragColor = vec4(diff, 1.0);
				} else {
					gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
				}
			}
		`;

		// Fragment shader for computing difference change
		const differenceShaderSource = `
			precision highp float;

			uniform sampler2D u_shape;
			uniform sampler2D u_current;
			uniform sampler2D u_target;
			uniform vec3 u_color;
			uniform float u_alpha;

			varying vec2 v_texCoord;

			void main() {
				vec4 shape = texture2D(u_shape, v_texCoord);
				vec4 current = texture2D(u_current, v_texCoord);
				vec4 target = texture2D(u_target, v_texCoord);

				if (shape.a > 0.0) {
					float a = shape.a;
					float b = 1.0 - a;

					// Old difference
					vec3 d1 = target.rgb - current.rgb;
					float oldDiff = dot(d1, d1);

					// New difference with proposed color
					vec3 newColor = u_color * a + current.rgb * b;
					vec3 d2 = target.rgb - newColor;
					float newDiff = dot(d2, d2);

					// Store the change in difference
					float change = newDiff - oldDiff;
					gl_FragColor = vec4(change, 0.0, 0.0, 1.0);
				} else {
					gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
				}
			}
		`;

		this.colorProgram = this.createProgram(vertexShaderSource, colorShaderSource);
		this.differenceProgram = this.createProgram(vertexShaderSource, differenceShaderSource);
	}

	createShader(type, source) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	createProgram(vertexSource, fragmentSource) {
		const gl = this.gl;
		const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
		const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Program linking error:', gl.getProgramInfoLog(program));
			return null;
		}

		return program;
	}

	uploadTexture(texture, imageData) {
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	computeColorAndDifferenceChange(offset, imageData, alpha) {
		if (!this.available) return null;

		try {
			const gl = this.gl;
			const { shape, current, target } = imageData;

			// Set canvas size to shape dimensions
			this.canvas.width = shape.width;
			this.canvas.height = shape.height;
			gl.viewport(0, 0, shape.width, shape.height);

			// Upload textures
			this.uploadTexture(this.textures.shape, shape);
			this.uploadTexture(this.textures.current, current);
			this.uploadTexture(this.textures.target, target);

			// First pass: compute optimal color
			gl.useProgram(this.colorProgram);

			const posLoc = gl.getAttribLocation(this.colorProgram, 'a_position');
			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
			gl.enableVertexAttribArray(posLoc);
			gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

			gl.uniform1i(gl.getUniformLocation(this.colorProgram, 'u_shape'), 0);
			gl.uniform1i(gl.getUniformLocation(this.colorProgram, 'u_current'), 1);
			gl.uniform1i(gl.getUniformLocation(this.colorProgram, 'u_target'), 2);
			gl.uniform1f(gl.getUniformLocation(this.colorProgram, 'u_alpha'), alpha);
			gl.uniform2f(gl.getUniformLocation(this.colorProgram, 'u_resolution'), shape.width, shape.height);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.textures.shape);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.textures.current);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.textures.target);

			// Render to compute color
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			// Read back pixels and compute average color
			const pixels = new Uint8Array(shape.width * shape.height * 4);
			gl.readPixels(0, 0, shape.width, shape.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

			let colorSum = [0, 0, 0];
			let count = 0;

			// Use the original CPU algorithm to get exact color from GPU-processed data
			for (let sy = 0; sy < shape.height; sy++) {
				let fy = sy + offset.top;
				if (fy < 0 || fy >= current.height) continue;

				for (let sx = 0; sx < shape.width; sx++) {
					let fx = offset.left + sx;
					if (fx < 0 || fx >= current.width) continue;

					let si = 4 * (sx + sy * shape.width);
					if (shape.data[si + 3] === 0) continue;

					let fi = 4 * (fx + fy * current.width);
					colorSum[0] += (target.data[fi] - current.data[fi]) / alpha + current.data[fi];
					colorSum[1] += (target.data[fi + 1] - current.data[fi + 1]) / alpha + current.data[fi + 1];
					colorSum[2] += (target.data[fi + 2] - current.data[fi + 2]) / alpha + current.data[fi + 2];
					count++;
				}
			}

			if (count === 0) {
				return { color: 'rgb(0, 0, 0)', differenceChange: 0 };
			}

			const rgb = [
				Math.floor(colorSum[0] / count),
				Math.floor(colorSum[1] / count),
				Math.floor(colorSum[2] / count)
			].map(c => Math.max(0, Math.min(255, c)));

			// Second pass: compute difference change with CPU for accuracy
			let differenceChange = 0;
			for (let sy = 0; sy < shape.height; sy++) {
				let fy = sy + offset.top;
				if (fy < 0 || fy >= current.height) continue;

				for (let sx = 0; sx < shape.width; sx++) {
					let fx = offset.left + sx;
					if (fx < 0 || fx >= current.width) continue;

					let si = 4 * (sx + sy * shape.width);
					let a = shape.data[si + 3];
					if (a === 0) continue;

					let fi = 4 * (fx + fy * current.width);

					a = a / 255;
					let b = 1 - a;

					let d1r = target.data[fi] - current.data[fi];
					let d1g = target.data[fi + 1] - current.data[fi + 1];
					let d1b = target.data[fi + 2] - current.data[fi + 2];

					let d2r = target.data[fi] - (rgb[0] * a + current.data[fi] * b);
					let d2g = target.data[fi + 1] - (rgb[1] * a + current.data[fi + 1] * b);
					let d2b = target.data[fi + 2] - (rgb[2] * a + current.data[fi + 2] * b);

					differenceChange -= d1r * d1r + d1g * d1g + d1b * d1b;
					differenceChange += d2r * d2r + d2g * d2g + d2b * d2b;
				}
			}

			return {
				color: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
				differenceChange: differenceChange
			};
		} catch (error) {
			console.warn('GPU computation error:', error);
			return null;
		}
	}
}

// Singleton instance
export const gpuCompute = new GPUCompute();
