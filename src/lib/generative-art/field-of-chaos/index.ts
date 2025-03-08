import P5 from "p5";

import { ColorPalette } from "./colors";
import { FlowerTile } from "./tile";

export class FieldOfChaosElement extends HTMLElement {
  static STEP = 0.01;
  private sketch?: P5;
  private tile?: FlowerTile;

  connectedCallback() {
    this.sketch = new P5(this.createSketch.bind(this));
    this.tile = new FlowerTile(this.sketch);
  }

  private createSketch(p5: P5) {
    p5.setup = () => {
      const { offsetWidth, offsetHeight } = this;
      const canvas = p5.createCanvas(offsetWidth, offsetHeight);
      canvas.parent(this);
      canvas.style("margin: auto");
      p5.background(ColorPalette.BRUNSWICK_GREEN);
    };

    p5.draw = () => {
      this.tile?.draw(p5);
      p5.noLoop();
    };
  }
}