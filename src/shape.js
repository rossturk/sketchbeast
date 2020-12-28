import Canvas from "./canvas.js";
import * as util from "./util.js";

export class Shape {
	static randomPoint(width, height) {
		return [~~(Math.random()*width), ~~(Math.random()*height)];
	}

	static create(cfg) { // this is where we can program sequences, gotta figure out how to determune step number in this scope
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

	rasterize(alpha) { 
		let canvas = new Canvas(this.bbox.width, this.bbox.height);
		let ctx = canvas.ctx;
		ctx.fillStyle = "#000";
		ctx.globalAlpha = alpha;
		ctx.translate(-this.bbox.left, -this.bbox.top);
		this.render(ctx);
		return canvas;
	}

	getBlur(blur) {
		switch (blur) {
			case 1:
				if (Math.floor(Math.random() * 2) == 1) { // pleasing
					switch (Math.floor(Math.random()*3)) {
						case 0:
							return "url(#g0.6)";
						case 1:
							return "";
						case 2:
							return "url(#g1)";
					}	
				}
				return;
			case 2:
				switch (Math.floor(Math.random()*3)) { // dreamy
					case 0:
						return "";
					case 1:
						return "url(#g1)";
					case 2:
						return "url(#g10)";
				}	
		}
		return;
	}

	render(ctx) {}
}

class PointShape extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.points = this._createPoints(w, h);
		this.linewidth = (Math.random() * (this.cfg.maxlinewidth - this.cfg.minlinewidth)) + this.cfg.minlinewidth;
		this.computeBbox();
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

	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.points = this.points.map(point => point.slice());

		let index = Math.floor(Math.random() * this.points.length);
		let point = clone.points[index];

		let angle = Math.random() * 2 * Math.PI;
		let radius = Math.random() * 10;
		point[0] += ~~(radius * Math.cos(angle));
		point[1] += ~~(radius * Math.sin(angle));

		return clone.computeBbox();
	}
}

export class Line extends PointShape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Line";
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
		
		let blur = this.getBlur(this.cfg.blur);

		if (blur) {
			path.setAttribute("filter", blur);
		}

		return path;
	}
}

export class BentLine extends PointShape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "BentLine";
	}

	_createPoints(w, h, count) {
		let first = Shape.randomPoint(w, h);
		let points = [first];

		let direction = Math.random() * 2 * Math.PI;
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

		let blur = this.getBlur(this.cfg.blur);

		if (blur) {
			path.setAttribute("filter", blur);
		}

		return path;
	}
}

export class Scribble extends PointShape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Scribble";
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

		let blur = this.getBlur(this.cfg.blur);

		if (blur) {
			path.setAttribute("filter", blur);
		}
		
		return path;
	}
}

export class Squiggle extends PointShape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Squiggle";
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

		let blur = this.getBlur(this.cfg.blur);

		if (blur) {
			path.setAttribute("filter", blur);
		}

		return path;
	}
}

class Polygon extends PointShape {
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

		let blur = this.getBlur(this.cfg.blur);

		if (blur) {
			path.setAttribute("filter", blur);
		}

		return path;
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
		let clone = new this.constructor(cfg, 0, 0);
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

export class RotatedRectangle extends Polygon {
	constructor(cfg, w, h) {
		super(cfg, w, h, 4);
		this.type = "RotatedRectangle";
	}

	_createPoints(w, h) {
		this.center = Shape.randomPoint(w, h);
		this.sizex = 1 + Math.random() * 300;
		this.sizey = 1 + Math.random() * 300;
		this.angle = Math.random() * Math.PI;
		let points = this._createRectPoints(this.center,this.sizex,this.sizey,this.angle);	
		return points;
	}

	_createRectPoints(center,w,h,angle) {
		let sinAng = Math.sin(angle)	
		let cosAng = Math.cos(angle)

		let upDiff = sinAng * w;
		let sideDiff = cosAng * w;
	
		let points = [center];

		// todo: determine correct x/y from the center
		points.push([~~(center[0] + sideDiff), ~~(center[1] + upDiff)]);
	
		upDiff = cosAng * h;
		sideDiff = sinAng * h;
	
		points.push([~~(points[1][0] + sideDiff), ~~(points[1][1] - upDiff)]);
		points.push([~~(center[0] + sideDiff), ~~(center[1] - upDiff)]);

		return points;
	}

	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
		clone.angle = this.angle;
		clone.sizex = this.sizex;
		clone.sizey = this.sizey;
		clone.center = this.center;

		switch (Math.floor(Math.random()*3)) {
			case 0: /* rotate */
				clone.angle += (Math.random() * 0.60) - 0.30; // -0.3 to 0.3
				break;
			case 1: /* scale x */
				clone.sizex *= (Math.random() * 0.4) + 0.8; // 0.8 to 1.2
				break;
			case 2: /* scale y */
				clone.sizey *= (Math.random() * 0.4) + 0.8; // 0.8 to 1.2
				break;
		}

		clone.points = this._createRectPoints(this.center,clone.sizex,clone.sizey,clone.angle);
		return clone.computeBbox();
	}
}

export class Quadrilateral extends Polygon {
	constructor(cfg, w, h) {
		super(cfg, w, h, 4);
		this.type = "Rhombus";
	}

	_createPoints(w, h, count) {
		let center = Shape.randomPoint(w, h);
		let l1 = 1 + (Math.random() * 75);
		let l2 = l1 + (l1 * ((Math.random() * 0.4) - 0.8));
		let angle = Math.random() * Math.PI;
		
		let points = [];

		points.push([
			center[0] + ~~(l1 * Math.cos(angle)),
			center[1] + ~~(l1 * Math.sin(angle))
		]);

		points.push([
			center[0] + ~~(l2 * Math.cos(angle + Math.PI / 2)),
			center[1] + ~~(l2 * Math.sin(angle + Math.PI / 2))
		]);

		points.push([
			center[0] + ~~(l1 * Math.cos(angle + Math.PI)),
			center[1] + ~~(l1 * Math.sin(angle + Math.PI))
		]);

		points.push([
			center[0] + ~~(l2 * Math.cos(angle + Math.PI * 1.5)),
			center[1] + ~~(l2 * Math.sin(angle + Math.PI * 1.5))
		]);

		return points;
	}
}

export class Ellipse extends Shape {
	constructor(cfg, w, h) {
		super(cfg, w, h);
		this.type = "Ellipse";
		this.center = Shape.randomPoint(w, h);
		this.rx = 1 + ~~(Math.random() * 20);
		this.ry = 1 + ~~(Math.random() * 20);
		this.rot = (Math.random() * Math.PI / 2);
		this.computeBbox();
	}

	render(ctx) {
		ctx.beginPath();
		ctx.ellipse(this.center[0], this.center[1], this.rx, this.ry, this.rot, 0, 2*Math.PI, false);
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
		node.setAttribute("transform", "rotate("+ (this.rot * (180/Math.PI)) +","+ this.center[0] +","+ this.center[1]+ ")");

		let blur = this.getBlur(this.cfg.blur);

		if (blur) {
			node.setAttribute("filter", blur);
		}

		return node;
	}

	mutate(cfg) {
		let clone = new this.constructor(cfg, 0, 0);
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
		let rmax = Math.max(this.rx, this.ry);
		this.bbox = {
			left: this.center[0] - rmax,
			top: this.center[1] - rmax,
			width: 2*rmax,
			height: 2*rmax
		}
		return this;
	}
}
