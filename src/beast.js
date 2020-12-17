import Canvas from "./canvas.js";
import Optimizer from "./optimizer.js";
import {Triangle, Rectangle, Ellipse, RandomPolygon} from "./shape.js";

class Beast {

	constructor(config) {
		this.cfg = config;
		this.cfg.shapeTypes = [];
		switch (this.cfg.mode) {
			case 0:
				this.cfg.shapeTypes.push(Triangle);
				this.cfg.shapeTypes.push(Rectangle);
				this.cfg.shapeTypes.push(Ellipse);
				break;
			case 1:
				this.cfg.shapeTypes.push(Rectangle);
				break;
			case 2:
				this.cfg.shapeTypes.push(Triangle);
				break;
			case 3:
				this.cfg.shapeTypes.push(Ellipse);
				break;
			case 4:
				this.cfg.shapeTypes.push(RandomPolygon);
				break;
			case 5:
				this.cfg.shapeTypes.push(Triangle);
				this.cfg.shapeTypes.push(Rectangle);
				break;
		}
	}

	load(url) {
		return Canvas.original(url, this.cfg);
	}

	async begin(original) {
		this.cfg.nodes.status.innerHTML = "";
		this.cfg.nodes.output.innerHTML = "";
		this.cfg.nodes.vectorText.value = "";

		let optimizer = new Optimizer(original, this.cfg);
		let steps = 0;

		let cfg2 = Object.assign({}, this.cfg, {width:this.cfg.scale*this.cfg.width, height:this.cfg.scale*this.cfg.height});
		let result = Canvas.empty(cfg2, false);
		result.ctx.scale(this.cfg.scale, this.cfg.scale);

		let svg = Canvas.empty(this.cfg, true);
		svg.setAttribute("width", cfg2.width);
		svg.setAttribute("height", cfg2.height);
		this.cfg.nodes.output.appendChild(svg);

		let serializer = new XMLSerializer();

		optimizer.onStep = (step) => {
			if (step) {
				result.drawStep(step);
				svg.appendChild(step.toSVG());
				let percent = (100*(1-step.distance)).toFixed(2);
				this.cfg.nodes.vectorText.value = serializer.serializeToString(svg);
				this.cfg.nodes.status.innerHTML = `(${++steps} of ${this.cfg.steps}, ${percent}% similar)`;
			}
		}
		await optimizer.start();
		console.log("foo");
	}

}

export default Beast;
