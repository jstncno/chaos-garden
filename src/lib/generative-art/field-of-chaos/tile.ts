import P5 from "p5";

import { ColorPalette } from "./colors";

export interface Tile {
  sigma: number;
  rho: number;
  beta: number;
  x: number;
  y: number;
  z: number;
}

export class FlowerTile implements Tile {
  static STEP = 0.01;

  sigma: number;
  rho: number;
  beta: number;
  x: number;
  y: number;
  z: number;

  constructor(p5: P5) {
    this.x = p5.random();
    this.y = p5.random();
    this.z = p5.random();
    this.sigma = p5.random(5, 15);
    this.rho = p5.random(25, 30);
    this.beta = p5.random(7.0, 9.0) / p5.random(2.0, 4.0);
  }

  draw(p5: P5) {
    const half = p5.createVector(p5.width / 2, p5.height / 2);
    const scale = 0.8;
    const angle = p5.random([0, p5.QUARTER_PI, p5.HALF_PI, p5.PI]);
    const [c1, c2, c3] = p5.shuffle([
      ColorPalette.ATOMIC_TANGERINE,
      ColorPalette.GLAUCOUS,
      ColorPalette.ASH_GRAY,
    ]);

    this.drawStem(p5, half);
    this.drawPetals(p5, half);
    p5.noLoop();
  }

  private step() {
    const dt = FlowerTile.STEP;
    const dx = (this.sigma * (this.y - this.x)) * dt;
    const dy = (this.x * (this.rho - this.z) - this.y) * dt;
    const dz = (this.x * this.y - this.beta * this.z) * dt;
    this.x += dx;
    this.y += dy;
    this.z += dz;
  }

  private drawPetals(p5: P5, pos: P5.Vector) {
    const scale = 0.8;
    const angle = p5.random([0, p5.QUARTER_PI, p5.HALF_PI, p5.PI]);
    const [c1, c2, c3] = p5.shuffle([
      ColorPalette.ATOMIC_TANGERINE,
      ColorPalette.GLAUCOUS,
      ColorPalette.ASH_GRAY,
    ]);

    p5.strokeWeight(1.5);
    for (let i = 0; i < 1000; i++) {
      this.step();

      p5.push();
      p5.translate(pos.x, pos.y);
      p5.rotate(angle);

      p5.stroke(ColorPalette.OLIVINE);
      p5.point(this.x * scale, this.y * scale);

      p5.stroke(c1);
      p5.point(this.y * scale, this.x * scale);

      p5.stroke(c2);
      p5.point(this.y * scale, this.z * scale);

      p5.stroke(c3);
      p5.point(this.z * scale, this.x * scale);

      p5.pop();
    }
  }

  private drawStem(p5: P5, pos: P5.Vector) {
    p5.push();
    p5.stroke(ColorPalette.ENGINEERING_ORANGE);
    p5.translate(pos.x, pos.y);
    p5.noFill();
    p5.strokeWeight(2);
    p5.stroke(ColorPalette.CELADON);
    p5.line(0, 0, 0, p5.random(25, 40));
    p5.pop()
  }
}