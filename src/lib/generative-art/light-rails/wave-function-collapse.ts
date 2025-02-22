import type P5 from "p5";
import { Edge, type Tile, TileType } from "./tile";
import { DEFAULT_TILE_SIZE } from "./constants";

interface TileSuperposition extends Tile {
  collapsed?: boolean;
}

export class WaveFunctionCollapseGridGenerator {
  public readonly grid: Array<Array<TileSuperposition>> = [];
  constructor(
    public readonly cols: number,
    public readonly rows: number,
    public readonly tileSize: number = DEFAULT_TILE_SIZE
  ) { }

  initialize() {
    this.grid.length = 0; // Reset grid;
    for (let row = 0; row < this.rows; row++) {
      this.grid.push([]);
      for (let col = 0; col < this.cols; col++) {
        const half = this.tileSize / 2;
        const x = (col * this.tileSize) + half;
        const y = (row * this.tileSize) + half;
        const tile: TileSuperposition = {
          type: TileType.UNKNOWN,
          paths: [],
          position: { x, y },
          row,
          col,
        };
        this.grid[row].push(tile);
      }
    }
  }

  collapse(p5: P5) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.grid[row][col];
        const numPaths = p5.random([0, 1, 2]);
        const edges = new Set<Edge>([
          Edge.TOP,
          Edge.RIGHT,
          Edge.BOTTOM,
          Edge.LEFT,
        ]);
        for (let i = 0; i < numPaths; i++) {
          // Generate tile
          const start = p5.random(Array.from(edges));
          edges.delete(start);
          const end = p5.random(Array.from(edges));
          edges.delete(end);
          const path = { start, end };
          tile.paths.push(path);
          tile.collapsed = true;
        }
      }
    }
  }
}