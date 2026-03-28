import * as util from "./util.js";
import State from "./state.js";
import { gpuCompute } from "./utilGPU.js";

/* Step: a Shape, color and alpha */
export default class Step {
	constructor(shape, cfg) {
		this.shape = shape;
		this.cfg = cfg;
		this.alpha = cfg.alpha;
		
		/* these two are computed during the .compute() call */
		this.color = "#000";
		this.distance = Infinity;
	}

	toSVG() {
		this.shape.color = this.color;
		this.shape.alpha = this.alpha.toFixed(2);
		let node = this.shape.toSVG();
		return node;
	}

	/* apply this step to a state to get a new state. call only after .compute */
	apply(state) {
		let newCanvas = state.canvas.clone().drawStep(this);
		return new State(state.target, newCanvas, this.distance);
	}

	/* find optimal color and compute the resulting distance */
	compute(state) {
		let pixels = state.canvas.node.width * state.canvas.node.height;
		let offset = this.shape.bbox;

		let imageData = {
			shape: this.shape.rasterize(this.alpha).getImageData(),
			current: state.canvas.getImageData(),
			target: state.target.getImageData()
		};

		// Try to use worker if available, otherwise fall back to main thread
		if (this.cfg.useWorkers && this.cfg.workerPool) {
			// Clone the buffers to avoid detachment issues when reusing imageData
			let shapeBuffer = imageData.shape.data.buffer.slice(0);
			let currentBuffer = imageData.current.data.buffer.slice(0);
			let targetBuffer = imageData.target.data.buffer.slice(0);

			return this.cfg.workerPool.postMessage({
				offset: offset,
				shape: {
					data: shapeBuffer,
					width: imageData.shape.width,
					height: imageData.shape.height
				},
				current: {
					data: currentBuffer,
					width: imageData.current.width,
					height: imageData.current.height
				},
				target: {
					data: targetBuffer,
					width: imageData.target.width,
					height: imageData.target.height
				},
				alpha: this.alpha
			}, [shapeBuffer, currentBuffer, targetBuffer])
			.then(response => {
				if (!response.success) {
					throw new Error(response.error);
				}
				let {color, differenceChange} = response.result;
				this.color = color;
				let currentDifference = util.distanceToDifference(state.distance, pixels);
				this.distance = util.differenceToDistance(currentDifference + differenceChange, pixels);
				return this;
			})
			.catch(error => {
				console.warn('Worker failed, falling back to CPU:', error);
				// Fall back to CPU computation
				return this._computeCPU(state, offset, imageData, pixels);
			});
		} else {
			return this._computeCPU(state, offset, imageData, pixels);
		}
	}

	_computeCPU(state, offset, imageData, pixels) {
		// Try GPU first if available
		if (gpuCompute.available && this.cfg.useGPU !== false) {
			try {
				const result = gpuCompute.computeColorAndDifferenceChange(offset, imageData, this.alpha);
				if (result) {
					this.color = result.color;
					let currentDifference = util.distanceToDifference(state.distance, pixels);
					this.distance = util.differenceToDistance(currentDifference + result.differenceChange, pixels);
					return Promise.resolve(this);
				}
			} catch (error) {
				console.warn('GPU computation failed, falling back to CPU:', error);
			}
		}

		// CPU fallback
		let {color, differenceChange} = util.computeColorAndDifferenceChange(offset, imageData, this.alpha);
		this.color = color;
		let currentDifference = util.distanceToDifference(state.distance, pixels);
		this.distance = util.differenceToDistance(currentDifference + differenceChange, pixels);
		return Promise.resolve(this);
	}

	/* return a slightly mutated step */
	mutate() {
		let newShape = this.shape.mutate(this.cfg);
		let mutated = new this.constructor(newShape, this.cfg);
		if (this.cfg.mutateAlpha) {
			let mutatedAlpha = this.alpha + (Math.random()-0.5) * 0.08;
			mutated.alpha = util.clamp(mutatedAlpha, .1, 1);
		}
		return mutated;
	}
}
