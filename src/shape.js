import Canvas from "./canvas.js";
import * as util from "./util.js";

/* Shape: a geometric primitive with a bbox */
export class Shape {
	static randomPoint(width, height) {
		return [~~(Math.random()*width), ~~(Math.random()*height)];
	}

	static create(cfg) {
		let ctors = cfg.shapeTypes;
		let index = Math.floor(Math.random() * ctors.length);
		let ctor = ctors[index];
		return new ctor(cfg, cfg.width, cfg.height);
	}

	constructor(cfg, w, h) {
		this.cfg = cfg;
		this.bbox = {};
		this.type = "Shape";
		this.color = "#fff"; // gets calculated during Step.compute()
		this.alpha = this.cfg.alpha;
	}

	mutate(cfg) { return this; }

	toSVG() {}

	/* get a new smaller canvas with this shape */
	rasterize(alpha) { 
		let canvas = new Canvas(this.bbox.width, this.bbox.height);
		let ctx = canvas.ctx;
		ctx.fillStyle = "#000";
		ctx.globalAlpha = alpha;
		ctx.translate(-this.bbox.left, -this.bbox.top);
		this.render(ctx);
		return canvas;
	}

	addBlur(element) {
		switch (this.cfg.blur) {
			case 0:
				break;
			case 1:
				if (Math.floor(Math.random() * 2) == 1) {
					switch (Math.floor(Math.random()*3)) {
						case 0:
							element.setAttribute("filter", "url(#g0.6)");
							break;
						case 1:
							element.setAttribute("filter", "url(#g0.2)");
							break;
						case 2:
							element.setAttribute("filter", "url(#g1)");
							break;
					}	
				}
				break;
			case 2:
				switch (Math.floor(Math.random()*3)) {
					case 0:
						element.setAttribute("filter", "url(#g0.6)");
						break;
					case 1:
						element.setAttribute("filter", "url(#g0.2)");
						break;
					case 2:
						element.setAttribute("filter", "url(#g1)");
						break;
				}	
				break;
		}
	}

	render(ctx) {}
}

export class Line extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Line";
		this.points = this._createPoints(w, h);
		this.linewidth = (Math.random() * (this.cfg.maxlinewidth - this.cfg.minlinewidth)) + this.cfg.minlinewidth;
		this.computeBbox();
	}

	_createPoints(w, h) {
		let first = Shape.randomPoint(w, h);
		let points = [first];
		let angle = Math.random() * 2 * Math.PI;
		let radius = (Math.random() * 15) + 5;
		points.push([
			first[0] + ~~(radius * Math.cos(angle)),
			first[1] + ~~(radius * Math.sin(angle))
		]);
		return points;
	}

	render(ctx) {
		ctx.beginPath();
		ctx.lineCap = 'round';
		this.points.forEach(([x, y], index) => {
			if (index) {
				ctx.lineTo(x, y);
			} else {
				ctx.moveTo(x, y);
			}
		});
		ctx.stroke();
	}

	toSVG() {
		let path = document.createElementNS(util.SVGNS, "path");
		let d = this.points.map((point, index) => {
			let cmd = (index ? "L" : "M");
			return `${cmd}${point.join(",")}`;
		}).join("");
		path.setAttribute("d", d);
		path.setAttribute("stroke", this.color);
		path.setAttribute("stroke-width", this.linewidth);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke-linecap", "round");
		this.addBlur(path);
		return path;
	}
	
	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.points = this.points.map(point => point.slice());

		let index = Math.floor(Math.random() * this.points.length);
		let point = clone.points[index];

		let angle = Math.random() * 2 * Math.PI;
		let radius = Math.random() * 9;
		point[0] += ~~(radius * Math.cos(angle));
		point[1] += ~~(radius * Math.sin(angle));

		return clone.computeBbox();
	}

	computeBbox() {
		let min = [
			this.points.reduce((v, p) => Math.min(v, p[0]), Infinity),
			this.points.reduce((v, p) => Math.min(v, p[1]), Infinity)
		];
		let max = [
			this.points.reduce((v, p) => Math.max(v, p[0]), -Infinity),
			this.points.reduce((v, p) => Math.max(v, p[1]), -Infinity)
		];

		this.bbox = {
			left: min[0],
			top: min[1],
			width: (max[0]-min[0]),
			height: (max[1]-min[1])
		};

		if (this.bbox.width < 1) { this.bbox.width = 1;}
		if (this.bbox.height < 1) { this.bbox.height = 1;}

		return this;
	}
}

export class BentLine extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "BentLine";
		this.points = this._createPoints(w, h, 6);
		this.linewidth = (Math.random() * (this.cfg.maxlinewidth - this.cfg.minlinewidth)) + this.cfg.minlinewidth;
		this.computeBbox();
	}

	_createPoints(w, h, count) {
            let first = Shape.randomPoint(w, h);
            let points = [first];

            let direction = Math.random() * 3.6;
            let radius = (Math.random() * 70) + 15; // between 15 and 115

            points.push([
                    first[0] + ~~(radius * Math.cos(direction)),
                    first[1] + ~~(radius * Math.sin(direction))
            ]);

            let turns = [(Math.random() * 1.7) - 0.85]; // between -85 and 85 degrees
            radius = (Math.random() * 70) + 15; // between 15 and 90

            points.push([
                    points[1][0] + ~~(radius * Math.cos(direction + turns[0])),
                    points[1][1] + ~~(radius * Math.sin(direction + turns[0]))
            ]);

            for (let i=1;i<=count-2;i++) {
                turns[i] = (Math.random() * 0.85) + 0.05; // between 5 and 85 degrees
                
                if (turns[i-1] < 0) {
                    turns[i] = Math.abs(turns[i])
                } else {
                    turns[i] = -Math.abs(turns[i])
                }

                radius = (Math.random() * 70) + 15; // between 15 and 115
                let angle = turns.reduce((a, b) => { return a + b; });

                points.push([
                        points[i+1][0] + ~~(radius * Math.cos(direction + angle)),
                        points[i+1][1] + ~~(radius * Math.sin(direction + angle))
                ]);
            }
            return points;
	}

	render(ctx) {
		ctx.beginPath();
		ctx.lineCap = 'round';
		this.points.forEach(([x, y], index) => {
			if (index) {
				ctx.lineTo(x, y);
			} else {
				ctx.moveTo(x, y);
			}
		});
		ctx.stroke();
	}

	toSVG() {
		let path = document.createElementNS(util.SVGNS, "path");
		let d = this.points.map((point, index) => {
			let cmd = (index ? "L" : "M");
			return `${cmd}${point.join(",")}`;
		}).join("");
		path.setAttribute("d", d);
		path.setAttribute("stroke", this.color);
		path.setAttribute("stroke-width", this.linewidth);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke-linecap", "round");
		this.addBlur(path);
		return path;
	}
	
	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.points = this.points.map(point => point.slice());

		let index = Math.floor(Math.random() * this.points.length);
		let point = clone.points[index];

		let angle = Math.random() * 2 * Math.PI;
		let radius = Math.random() * 9;
		point[0] += ~~(radius * Math.cos(angle));
		point[1] += ~~(radius * Math.sin(angle));

		return clone.computeBbox();
	}

	computeBbox() {
		let min = [
			this.points.reduce((v, p) => Math.min(v, p[0]), Infinity),
			this.points.reduce((v, p) => Math.min(v, p[1]), Infinity)
		];
		let max = [
			this.points.reduce((v, p) => Math.max(v, p[0]), -Infinity),
			this.points.reduce((v, p) => Math.max(v, p[1]), -Infinity)
		];

		this.bbox = {
			left: min[0],
			top: min[1],
			width: (max[0]-min[0]),
			height: (max[1]-min[1])
		};

		if (this.bbox.width < 1) { this.bbox.width = 1;}
		if (this.bbox.height < 1) { this.bbox.height = 1;}

		return this;
	}
}

export class Scribble extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Scribble";
		this.points = this._createPoints(w, h);
		this.linewidth = (Math.random() * (this.cfg.maxlinewidth - this.cfg.minlinewidth)) + this.cfg.minlinewidth;
		this.computeBbox();
	}

	_createPoints(w, h) {
		let first = Shape.randomPoint(w, h);
		let points = [first];

		for (let i=1;i<5;i++) {
			let angle = Math.random() * 2 * Math.PI;
			let radius = (Math.random() * 17) + 1;
			points.push([
				first[0] + ~~(radius * Math.cos(angle)),
				first[1] + ~~(radius * Math.sin(angle))
			]);
		}

		return points;
	}

	render(ctx) {
		ctx.beginPath();
		ctx.lineCap = 'round';
		this.points.forEach(([x, y], index) => {
			if (index) {
				ctx.lineTo(x, y);
			} else {
				ctx.moveTo(x, y);
			}
		});
		ctx.stroke();
	}

	toSVG() {
		let path = document.createElementNS(util.SVGNS, "path");
		let d = this.points.map((point, index) => {
			let cmd = (index ? "L" : "M");
			return `${cmd}${point.join(",")}`;
		}).join("");
		path.setAttribute("d", d);
		path.setAttribute("stroke", this.color);
		path.setAttribute("stroke-width", this.linewidth);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke-linecap", "round");
		this.addBlur(path);
		return path;
	}
	
	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.points = this.points.map(point => point.slice());

		let index = Math.floor(Math.random() * this.points.length);
		let point = clone.points[index];

		let angle = Math.random() * 2 * Math.PI;
		let radius = Math.random() * 9;
		point[0] += ~~(radius * Math.cos(angle));
		point[1] += ~~(radius * Math.sin(angle));

		return clone.computeBbox();
	}

	computeBbox() {
		let min = [
			this.points.reduce((v, p) => Math.min(v, p[0]), Infinity),
			this.points.reduce((v, p) => Math.min(v, p[1]), Infinity)
		];
		let max = [
			this.points.reduce((v, p) => Math.max(v, p[0]), -Infinity),
			this.points.reduce((v, p) => Math.max(v, p[1]), -Infinity)
		];

		this.bbox = {
			left: min[0],
			top: min[1],
			width: (max[0]-min[0]),
			height: (max[1]-min[1])
		};

		if (this.bbox.width < 1) { this.bbox.width = 1;}
		if (this.bbox.height < 1) { this.bbox.height = 1;}

		return this;
	}
}

export class Squiggle extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Squiggle";
		this.points = this._createPoints(w, h);
		this.linewidth = (Math.random() * (this.cfg.maxlinewidth - this.cfg.minlinewidth)) + this.cfg.minlinewidth;
		this.computeBbox();
	}

	_createPoints(w, h) {
		let first = Shape.randomPoint(w, h);
		let points = [first];

		let scale = Math.random();
		let sw = ~~(w * scale);
		let sh = ~~(h * scale);
		let xoffset = ~~(points[0][0] - (sw / 2));
		let yoffset = ~~(points[0][1] - (sh / 2));
	
		for (let i=0;i<3;i++) {
			let point = Shape.randomPoint(sw,sh);
			points.push([point[0]+xoffset, point[1]+yoffset]);
		}
		return points;
	}

	render(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.points[0][0],this.points[0][1]);
		ctx.lineCap = 'round';
		ctx.strokeStyle = this.color;
		ctx.bezierCurveTo(
			this.points[1][0],this.points[1][1],
			this.points[2][0],this.points[2][1],
			this.points[3][0],this.points[3][1]
		);
		ctx.stroke();
	}

	toSVG() {
		let path = document.createElementNS(util.SVGNS, "path");
		let d = "M "+this.points[0][0]+" "+this.points[0][1]+" "+
			"C "+this.points[1][0]+" "+this.points[1][1]+", "+
			this.points[2][0]+" "+this.points[2][1]+", "+
			this.points[3][0]+" "+this.points[3][1];
		path.setAttribute("d", d);
		path.setAttribute("stroke", this.color);
		path.setAttribute("stroke-width", this.linewidth);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke-linecap", "round");
		this.addBlur(path);
		return path;
	}
	
	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.points = this.points.map(point => point.slice());

		let index = Math.floor(Math.random() * this.points.length);
		let point = clone.points[index];

		let angle = Math.random() * 2 * Math.PI;
		let radius = Math.random() * 20;
		point[0] += ~~(radius * Math.cos(angle));
		point[1] += ~~(radius * Math.sin(angle));

		return clone.computeBbox();
	}

	computeBbox() {
		let min = [
			this.points.reduce((v, p) => Math.min(v, p[0]), Infinity),
			this.points.reduce((v, p) => Math.min(v, p[1]), Infinity)
		];
		let max = [
			this.points.reduce((v, p) => Math.max(v, p[0]), -Infinity),
			this.points.reduce((v, p) => Math.max(v, p[1]), -Infinity)
		];

		this.bbox = {
			left: min[0],
			top: min[1],
			width: (max[0]-min[0]),
			height: (max[1]-min[1])
		};

		if (this.bbox.width < 1) { this.bbox.width = 1;}
		if (this.bbox.height < 1) { this.bbox.height = 1;}

		return this;
	}

}

class Polygon extends Shape {
	constructor(cfg, w, h, count) {
		super(cfg, w, h);
		this.type = "Polygon";
		this.points = this._createPoints(w, h, count);
		this.computeBbox();
	}

	render(ctx) {
		ctx.beginPath();
		this.points.forEach(([x, y], index) => {
			if (index) {
				ctx.lineTo(x, y);
			} else {
				ctx.moveTo(x, y);
			}
		});
		ctx.fillStyle = this.color;
		ctx.closePath();
		ctx.fill();
	}

	toSVG() {
		let path = document.createElementNS(util.SVGNS, "path");
		let d = this.points.map((point, index) => {
			let cmd = (index ? "L" : "M");
			return `${cmd}${point.join(",")}`;
		}).join("");
		path.setAttribute("d", `${d}Z`);
		path.setAttribute("fill", this.color);
		path.setAttribute("fill-opacity", this.alpha);
		this.addBlur(path);
		return path;
	}

	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.points = this.points.map(point => point.slice());

		let index = Math.floor(Math.random() * this.points.length);
		let point = clone.points[index];

		let angle = Math.random() * 2 * Math.PI;
		let radius = Math.random() * 20;
		point[0] += ~~(radius * Math.cos(angle));
		point[1] += ~~(radius * Math.sin(angle));

		return clone.computeBbox();
	}

	computeBbox() {
		let min = [
			this.points.reduce((v, p) => Math.min(v, p[0]), Infinity),
			this.points.reduce((v, p) => Math.min(v, p[1]), Infinity)
		];
		let max = [
			this.points.reduce((v, p) => Math.max(v, p[0]), -Infinity),
			this.points.reduce((v, p) => Math.max(v, p[1]), -Infinity)
		];

		this.bbox = {
			left: min[0],
			top: min[1],
			width: (max[0]-min[0]) || 1, /* fallback for deformed shapes */
			height: (max[1]-min[1]) || 1
		};

		return this;
	}

	_createPoints(w, h, count) {
		let first = Shape.randomPoint(w, h);
		let points = [first];

		for (let i=1;i<count;i++) {
			let angle = Math.random() * 2 * Math.PI; // do something here based on count
			let radius = Math.random() * 20;
			points.push([
				first[0] + ~~(radius * Math.cos(angle)),
				first[1] + ~~(radius * Math.sin(angle))
			]);
		}
		return points;
	}
}

export class RandomPolygon extends Polygon {
	constructor(cfg, w,h) {
		super(cfg, w, h, Math.floor(Math.random()*4)+4);
		this.type = "RandomPolygon";
	}
}

export class Triangle extends Polygon {
	constructor(cfg, w, h) {
		super(cfg, w, h, 3);
		this.type = "Triangle";
	}
}

export class Rectangle extends Polygon {
	constructor(cfg, w, h) {
		super(cfg, w, h, 4);
		this.type = "Rectangle";
	}

	mutate(cfg) {
		let clone = new this.constructor(0, 0);
		clone.points = this.points.map(point => point.slice());

		let amount = ~~((Math.random()-0.5) * 20);

		switch (Math.floor(Math.random()*4)) {
			case 0: /* left */
				clone.points[0][0] += amount;
				clone.points[3][0] += amount;
			break;
			case 1: /* top */
				clone.points[0][1] += amount;
				clone.points[1][1] += amount;
			break;
			case 2: /* right */
				clone.points[1][0] += amount;
				clone.points[2][0] += amount;
			break;
			case 3: /* bottom */
				clone.points[2][1] += amount;
				clone.points[3][1] += amount;
			break;
		}

		return clone.computeBbox();
	}

	_createPoints(w, h, count) {
		let p1 = Shape.randomPoint(w, h);
		let p2 = Shape.randomPoint(w, h);

		let left = Math.min(p1[0], p2[0]);
		let right = Math.max(p1[0], p2[0]);
		let top = Math.min(p1[1], p2[1]);
		let bottom = Math.max(p1[1], p2[1]);

		return [
			[left, top],
			[right, top],
			[right, bottom],
			[left, bottom]
		];
	}
}

export class Ellipse extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Ellipse";

		this.center = Shape.randomPoint(w, h);
		this.rx = 1 + ~~(Math.random() * 20);
		this.ry = 1 + ~~(Math.random() * 20);

		this.computeBbox();
	}

	render(ctx) {
		ctx.beginPath();
		ctx.ellipse(this.center[0], this.center[1], this.rx, this.ry, 0, 0, 2*Math.PI, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	}

	toSVG() {
		let node = document.createElementNS(util.SVGNS, "ellipse");
		node.setAttribute("cx", this.center[0]);
		node.setAttribute("cy", this.center[1]);
		node.setAttribute("rx", this.rx);
		node.setAttribute("ry", this.ry);
		node.setAttribute("fill", this.color);
		node.setAttribute("fill-opacity", this.alpha);
		this.addBlur(node);
		return node;
	}

	mutate(cfg) {
		let clone = new this.constructor(0, 0);
		clone.center = this.center.slice();
		clone.rx = this.rx;
		clone.ry = this.ry;

		switch (Math.floor(Math.random()*3)) {
			case 0:
				let angle = Math.random() * 2 * Math.PI;
				let radius = Math.random() * 20;
				clone.center[0] += ~~(radius * Math.cos(angle));
				clone.center[1] += ~~(radius * Math.sin(angle));
			break;

			case 1:
				clone.rx += (Math.random()-0.5) * 20;
				clone.rx = Math.max(1, ~~clone.rx);
			break;

			case 2:
				clone.ry += (Math.random()-0.5) * 20;
				clone.ry = Math.max(1, ~~clone.ry);
			break;
		}

		return clone.computeBbox();
	}

	computeBbox() {
		this.bbox = {
			left: this.center[0] - this.rx,
			top: this.center[1] - this.ry,
			width: 2*this.rx,
			height: 2*this.ry
		}
		return this;
	}
}
