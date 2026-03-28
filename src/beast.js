import Canvas from "./canvas.js";
import Optimizer from "./optimizer.js";
import {Triangle, Rectangle, RotatedRectangle, Ellipse, Quadrilateral, Squiggle, Scribble, Line, BentLine} from "./shape.js";
import WorkerPool from "./workerPool.js";

class Beast {
	constructor() {
		this.cfg = {};
		this._initWorkers();
	}

	_initWorkers() {
		try {
			// Try to initialize worker pool
			const workerCount = navigator.hardwareConcurrency || 4;
			this.cfg.workerPool = new WorkerPool(workerCount);
			this.cfg.useWorkers = true;
			console.log(`Initialized ${workerCount} Web Workers for computation`);
		} catch (error) {
			console.warn('Failed to initialize Web Workers, using main thread:', error);
			this.cfg.useWorkers = false;
		}

		// Check for WebGL support
		this._checkWebGL();
	}

	_checkWebGL() {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

		if (gl) {
			const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
			const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

			console.log('🎮 WebGL Support: ✅ Available');
			console.log(`   GPU Vendor: ${vendor}`);
			console.log(`   GPU Renderer: ${renderer}`);
			console.log(`   WebGL Version: ${gl.getParameter(gl.VERSION)}`);

			this.cfg.hasWebGL = true;
		} else {
			console.warn('⚠️ WebGL Support: ❌ Not available');
			this.cfg.hasWebGL = false;
		}
	}

	configure(config) {
		this.cfg = {...this.cfg, ...config};
		this.cfg.shapeTypes = [];

		this.cfg.minlinewidth = 1; // defaults
		this.cfg.maxlinewidth = 2; // defaults
		this.cfg.batchSize = config.batchSize || 5; // Progressive rendering batch size

		switch (this.cfg.mode) {
			case 0:
				this.cfg.shapeTypes.push(Triangle);
				this.cfg.shapeTypes.push(RotatedRectangle);
				this.cfg.shapeTypes.push(Rectangle);
				this.cfg.shapeTypes.push(Ellipse);
				this.cfg.shapeTypes.push(Quadrilateral);
				break;
			case 1:
				this.cfg.shapeTypes.push(RotatedRectangle);
				break;
			case 2:
				this.cfg.shapeTypes.push(Triangle);
				break;
			case 3:
				this.cfg.shapeTypes.push(Quadrilateral);
				break;
			case 4:
				this.cfg.shapeTypes.push(Ellipse);
                break;
            case 5:
                this.cfg.shapeTypes.push(Squiggle);
                this.cfg.shapeTypes.push(Line);
                this.cfg.shapeTypes.push(BentLine);
                this.cfg.minlinewidth = 0.1;
                this.cfg.maxlinewidth = 1;
                break;
			case 6:
				this.cfg.shapeTypes.push(Squiggle);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 1;
				break;
			case 7:
				this.cfg.shapeTypes.push(Scribble);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 1;
				break;
			case 8:
				this.cfg.shapeTypes.push(Line);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 1;
				break;
			case 9:
				this.cfg.shapeTypes.push(BentLine);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 1;
				break;
		}
	}

	load(url) {
		return Canvas.original(url, this.cfg).catch(error => {
			console.error('Failed to load image:', error);
			this._showError('Failed to load image. Please try a different file.');
			throw error;
		});
	}

	_showError(message) {
		if (this.cfg.nodes && this.cfg.nodes.output) {
			const errorDiv = document.createElement('div');
			errorDiv.className = 'alert alert-danger';
			errorDiv.setAttribute('role', 'alert');
			errorDiv.textContent = message;
			this.cfg.nodes.output.innerHTML = '';
			this.cfg.nodes.output.appendChild(errorDiv);
		}
	}

	begin(original) {
		this.cfg.nodes.output.innerHTML = "";
        this.cfg.nodes.svgsrc.value = "";
        this.original = original;

		this.optimizer = new Optimizer(this.original, Canvas.empty(this.cfg), this.cfg);
		let steps = 0;

		let w,h;

		if (this.cfg.naturalWidth > this.cfg.naturalHeight) {
			w = this.cfg.viewWidth;
			h = this.cfg.naturalHeight * this.cfg.viewWidth / this.cfg.naturalWidth;
		} else {
			h = this.cfg.viewHeight;
			w = this.cfg.naturalWidth * this.cfg.viewHeight / this.cfg.naturalHeight;
		}

		this.svg = Canvas.empty(this.cfg, true);
		this.svg.setAttribute("width", w);
		this.svg.setAttribute("height", h);
		// this.cfg.nodes.output.appendChild(this.svg);

		let serializer = new XMLSerializer();

		this.optimizer.onStep = (step) => {
			if (step) {
				this.svg.appendChild(step.toSVG());

				// Only update DOM every 50 steps or on final step for extreme speed
				if (steps % 50 === 0 || steps === this.cfg.steps - 1) {
					this.cfg.nodes.svgsrc.value = serializer.serializeToString(this.svg);
					this.cfg.nodes.output.innerHTML = "";
					this.cfg.nodes.output.appendChild(this.svg);
				}
			}

			let stepsremaining = this.cfg.steps - ++steps;
			var event = new CustomEvent("shape", {'detail': {
				stepsremaining: stepsremaining
			}});
			this.cfg.nodes.output.dispatchEvent(event);
		}

		this.optimizer.onMetrics = (metrics) => {
			// Update performance metrics in the UI
			var event = new CustomEvent("metrics", {'detail': metrics});
			this.cfg.nodes.output.dispatchEvent(event);
		}

        this.optimizer.start();
    }
    
    continue() {
		let currentstate = this.optimizer.state.canvas;
		this.optimizer = new Optimizer(this.original, currentstate, this.cfg);
		let steps = 0;

		let serializer = new XMLSerializer();

		this.optimizer.onStep = (step) => {
			if (step) {
				this.svg.appendChild(step.toSVG());

				// Only update DOM every 50 steps or on final step for extreme speed
				if (steps % 50 === 0 || steps === this.cfg.steps - 1) {
					this.cfg.nodes.svgsrc.value = serializer.serializeToString(this.svg);
					this.cfg.nodes.output.innerHTML = "";
					this.cfg.nodes.output.appendChild(this.svg);
				}
			}

			let stepsremaining = this.cfg.steps - ++steps;
			var event = new CustomEvent("shape", {'detail': {
				stepsremaining: stepsremaining
			}});
			this.cfg.nodes.output.dispatchEvent(event);
		}

		this.optimizer.onMetrics = (metrics) => {
			// Update performance metrics in the UI
			var event = new CustomEvent("metrics", {'detail': metrics});
			this.cfg.nodes.output.dispatchEvent(event);
		}

        this.optimizer.start();
    }
}

export default Beast;
