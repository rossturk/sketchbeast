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
				this.cfg.shapeTypes.push(RandomPolygon);
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
		}
	}

	load(url) {
		return Canvas.original(url, this.cfg);
	}

	begin(original) {
		this.cfg.nodes.output.innerHTML = "";
		this.cfg.nodes.svgsrc.value = "";

		let optimizer = new Optimizer(original, this.cfg);
		let steps = 0;

		let cfg2 = Object.assign({}, this.cfg, {width:this.cfg.naturalWidth, height:this.cfg.naturalHeight});
		let result = Canvas.empty(cfg2, false);
		result.ctx.scale(this.cfg.scale, this.cfg.scale);

		let viewWidth = this.cfg.naturalWidth * this.cfg.viewHeight / this.cfg.naturalHeight;

		let w,h;

		if (this.cfg.naturalWidth > this.cfg.naturalHeight) {
			// landscape
			w = this.cfg.viewWidth;
			h = this.cfg.naturalHeight * this.cfg.viewWidth / this.cfg.naturalWidth;
		} else {
			// portrait
			h = this.cfg.viewHeight;
			w = this.cfg.naturalWidth * this.cfg.viewHeight / this.cfg.naturalHeight;
		}
		
		let svg = Canvas.empty(this.cfg, true);
		svg.setAttribute("width", w);
		svg.setAttribute("height", h);
		this.cfg.nodes.output.appendChild(svg);

		let serializer = new XMLSerializer();

		optimizer.onStep = (step) => {
			if (step) {
				result.drawStep(step);
				svg.appendChild(step.toSVG());
				this.cfg.nodes.svgsrc.value = serializer.serializeToString(svg);
				let stepsremaining = this.cfg.steps - ++steps;
				const event = new CustomEvent('shape',{ detail: stepsremaining } );
				this.cfg.nodes.output.dispatchEvent(event);
			}
		}
		optimizer.start();
	}

}

export default Beast;
