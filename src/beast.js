import Canvas from "./canvas.js";
import Optimizer from "./optimizer.js";
import {Triangle, Rectangle, RotatedRectangle, Ellipse, Rhombus, Squiggle, Scribble, Line, BentLine} from "./shape.js";

class Beast {
	configure(config) {
		this.cfg = {...this.cfg, ...config};
		this.cfg.shapeTypes = [];

		this.cfg.minlinewidth = 1; // defaults
		this.cfg.maxlinewidth = 2; // defaults

		switch (this.cfg.mode) {
			case 0:
				this.cfg.shapeTypes.push(Triangle);
				this.cfg.shapeTypes.push(RotatedRectangle);
				this.cfg.shapeTypes.push(Rectangle);
				this.cfg.shapeTypes.push(Ellipse);
				this.cfg.shapeTypes.push(Rhombus);
				break;
			case 1:
				this.cfg.shapeTypes.push(RotatedRectangle);
				break;
			case 2:
				this.cfg.shapeTypes.push(Triangle);
				break;
			case 3:
				this.cfg.shapeTypes.push(Rhombus);
				break;
			case 4:
				this.cfg.shapeTypes.push(Ellipse);
                break;
            case 5:
                this.cfg.shapeTypes.push(Scribble);
                this.cfg.shapeTypes.push(Squiggle);
                this.cfg.shapeTypes.push(Line);
                this.cfg.shapeTypes.push(BentLine);
                this.cfg.minlinewidth = 0.1;
                this.cfg.maxlinewidth = 2;
                break;
			case 6:
				this.cfg.shapeTypes.push(Squiggle);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 2;
				break;
			case 7:
				this.cfg.shapeTypes.push(Scribble);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 2;
				break;
			case 8:
				this.cfg.shapeTypes.push(Line);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 2;
				break;
			case 9:
				this.cfg.shapeTypes.push(BentLine);
				this.cfg.minlinewidth = 0.1;
				this.cfg.maxlinewidth = 2;
				break;
		}
	}

	load(url) {
		return Canvas.original(url, this.cfg);
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
                this.cfg.nodes.svgsrc.value = serializer.serializeToString(this.svg);
                this.cfg.nodes.output.innerHTML = "";
                this.cfg.nodes.output.appendChild(this.svg);
			}

			let stepsremaining = this.cfg.steps - ++steps;
			var event = new CustomEvent("shape", {'detail': {
				stepsremaining: stepsremaining
			}});
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
                this.cfg.nodes.svgsrc.value = serializer.serializeToString(this.svg);
                this.cfg.nodes.output.innerHTML = "";
                this.cfg.nodes.output.appendChild(this.svg);
			}

			let stepsremaining = this.cfg.steps - ++steps;
			var event = new CustomEvent("shape", {'detail': {
				stepsremaining: stepsremaining
			}});
			this.cfg.nodes.output.dispatchEvent(event);
		}
        this.optimizer.start();
    }
}

export default Beast;
