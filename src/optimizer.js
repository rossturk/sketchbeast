import Step from "./step.js";
import State from "./state.js";
import Canvas from "./canvas.js";
import {Shape} from "./shape.js";

export default class Optimizer {
	constructor(original, current, cfg) {
		this.cfg = cfg;
		this.state = new State(original, current);
		this._steps = 0;
		this._pendingBatch = [];
		this._batchSize = cfg.batchSize || 5;
		this._paused = false;
		this._shapesPerSecond = 0;
		this._lastMetricsUpdate = 0;
		this._metricsInterval = 1000; // Update metrics every second
		this.onStep = () => {};
		this.onBatch = () => {};
		this.onMetrics = () => {}; // New callback for performance metrics
		// console.log("initial distance %s", this.state.distance);
	}

	pause() {
		this._paused = true;
	}

	resume() {
		this._paused = false;
		this._continue();
	}

	isPaused() {
		return this._paused;
	}

	start() {
		this._ts = Date.now();
		this._addShape();
	}

	_addShape() {
		// Process multiple shapes in parallel for faster completion
		const SHAPE_BATCH_SIZE = 3;
		let shapesToAdd = Math.min(SHAPE_BATCH_SIZE, this.cfg.steps - this._steps);
		let promises = [];

		for (let i = 0; i < shapesToAdd; i++) {
			promises.push(
				this._findBestStep()
					.then(step => this._optimizeStep(step))
					.then(step => {
						this._steps++;
						if (step.distance < this.state.distance) {
							this.state = step.apply(this.state);

							// Progressive rendering: batch updates
							this._pendingBatch.push(step);
							if (this._pendingBatch.length >= this._batchSize) {
								this.onBatch(this._pendingBatch.slice());
								this._pendingBatch = [];
							}

							this.onStep(step);
							return step;
						} else {
							console.log("we made an awful %s", step.shape.type);
							this.onStep(null);
							return null;
						}
					})
			);
		}

		Promise.all(promises).then(() => this._continue());
	}

	_continue() {
		if (this._paused) {
			return; // Don't continue if paused
		}

		// Update performance metrics
		let now = Date.now();
		if (now - this._lastMetricsUpdate >= this._metricsInterval) {
			let elapsed = (now - this._ts) / 1000; // seconds
			this._shapesPerSecond = this._steps / elapsed;
			let remaining = this.cfg.steps - this._steps;
			let estimatedTimeRemaining = remaining / this._shapesPerSecond;

			this.onMetrics({
				shapesPerSecond: this._shapesPerSecond.toFixed(1),
				timeRemaining: estimatedTimeRemaining.toFixed(1),
				progress: (this._steps / this.cfg.steps * 100).toFixed(1)
			});

			this._lastMetricsUpdate = now;
		}

		if (this._steps < this.cfg.steps) {
			// Use setImmediate-like behavior for faster iteration
			Promise.resolve().then(() => this._addShape());
		} else {
			// Flush any remaining batched steps
			if (this._pendingBatch.length > 0) {
				this.onBatch(this._pendingBatch.slice());
				this._pendingBatch = [];
			}

			let time = Date.now() - this._ts;
			console.log("finished in %s", time);
			const event = new Event('beast');
			this.cfg.nodes.output.dispatchEvent(event);
		}
	}

	_findBestStep() {
		const LIMIT = this.cfg.shapes;

		let bestStep = null;
		let promises = [];

		for (let i=0;i<LIMIT;i++) {
			let shape = Shape.create(this.cfg);

			let promise = new Step(shape, this.cfg).compute(this.state).then(step => {
				if (!bestStep || step.distance < bestStep.distance) {
					bestStep = step;
				}
			});
			promises.push(promise);
		}

		return Promise.all(promises).then(() => bestStep);
	}

	_optimizeStep(step) {
		const LIMIT = this.cfg.mutations;
		const PARALLEL_MUTATIONS = 16; // Increased from 8 for faster convergence

		let totalAttempts = 0;
		let successAttempts = 0;
		let failedAttempts = 0;
		let bestStep = step;

		let tryMutationBatch = () => {
			if (failedAttempts >= LIMIT) {
				// console.log("mutation optimized distance from %s to %s in (%s good, %s total) attempts", step.distance, bestStep.distance, successAttempts, totalAttempts);
				return Promise.resolve(bestStep);
			}

			// Try multiple mutations in parallel
			let batchSize = Math.min(PARALLEL_MUTATIONS, LIMIT - failedAttempts);
			let promises = [];

			for (let i = 0; i < batchSize; i++) {
				totalAttempts++;
				promises.push(bestStep.mutate().compute(this.state));
			}

			return Promise.all(promises).then(mutatedSteps => {
				let foundBetter = false;
				for (let mutatedStep of mutatedSteps) {
					if (mutatedStep.distance < bestStep.distance) {
						successAttempts++;
						failedAttempts = 0;
						bestStep = mutatedStep;
						foundBetter = true;
					}
				}

				if (!foundBetter) {
					failedAttempts += batchSize;
				}

				return tryMutationBatch();
			});
		}

		return tryMutationBatch();
	}
}
