import type P5 from "p5";
import { Edge, type Path, type Tile, type TileGrid, TileType, tileTypeFromPaths } from "./tile";
import { DEFAULT_TILE_SIZE } from "./constants";

const REQUIRES_TOP = [
  TileType.TOP_BOTTOM,
  TileType.BOTTOM_RIGHT,
  TileType.BOTTOM_LEFT,
  TileType.TOPRIGHT_BOTTOMLEFT,
  TileType.TOPBOTTOM_LEFTRIGHT,
  TileType.TOPLEFT_BOTTOMRIGHT,
];

const REQUIRES_RIGHT = [
  TileType.TOP_LEFT,
  TileType.LEFT_RIGHT,
  TileType.BOTTOM_LEFT,
  TileType.TOPBOTTOM_LEFTRIGHT,
  TileType.TOPRIGHT_BOTTOMLEFT,
  TileType.TOPLEFT_BOTTOMRIGHT,
];

const REQUIRES_BOTTOM = [
  TileType.TOP_RIGHT,
  TileType.TOP_BOTTOM,
  TileType.TOP_LEFT,
  TileType.TOPBOTTOM_LEFTRIGHT,
  TileType.TOPRIGHT_BOTTOMLEFT,
  TileType.TOPLEFT_BOTTOMRIGHT,
];

const REQUIRES_LEFT = [
  TileType.TOP_RIGHT,
  TileType.BOTTOM_RIGHT,
  TileType.LEFT_RIGHT,
  TileType.TOPBOTTOM_LEFTRIGHT,
  TileType.TOPRIGHT_BOTTOMLEFT,
  TileType.TOPLEFT_BOTTOMRIGHT,
];

function pathsFromEdges(
  p5: P5,
  requiredEdges: Set<Edge>,
  optionalEdges: Set<Edge>
): Array<Path> {
  const paths: Array<Path> = [];

  if (requiredEdges.size == 0 && optionalEdges.size == 0) {
    // No paths
    return paths;
  }

  if (requiredEdges.size == 2) {
    // One path
    const [first, second] = Array.from(requiredEdges);
    const start = p5.random([first, second]);
    const end = start === first ? second : first;
    paths.push({ start, end });
    return paths
  }

  const allEdges = requiredEdges.union(optionalEdges);
  for (const edges of [requiredEdges, optionalEdges]) {
    while (edges.size > 0) {
      // Required edges first
      const arr = Array.from(
        requiredEdges.size ? requiredEdges : optionalEdges
      );
      const start = p5.random(arr);
      allEdges.delete(start);
      requiredEdges.delete(start);
      optionalEdges.delete(start);

      if (allEdges.size == 0) break;

      const end = p5.random(Array.from(allEdges));
      allEdges.delete(end);
      requiredEdges.delete(end);
      optionalEdges.delete(end);

      paths.push({ start, end });
    }
  }

  return paths;
}

export class WaveFunctionCollapseGridGenerator {
  public readonly grid: Array<Array<Tile>> = [];
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
        const tile: Tile = {
          type: TileType.UNKNOWN,
          paths: [],
          position: { x, y },
          row,
          col,
          size: this.tileSize,
        };
        this.grid[row].push(tile);
      }
    }
  }

  collapse(p5: P5) {
    // Do corners first
    const firstRow = this.grid[0];
    const lastRow = this.grid[this.grid.length - 1];
    const topLeft = this.grid[0][0];
    this.collapseTile(p5, topLeft);
    const topRight = this.grid[0][firstRow.length - 1];
    this.collapseTile(p5, topRight);
    const bottomRight = this.grid[this.grid.length - 1][lastRow.length - 1];
    this.collapseTile(p5, bottomRight);
    const bottomLeft = this.grid[this.grid.length - 1][0];
    this.collapseTile(p5, bottomLeft);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.grid[row][col];
        if (tile.type === TileType.UNKNOWN) {
          this.collapseTile(p5, tile);
        }
      }
    }
  }

  private collapseTile(p5: P5, tile: Tile): Tile {
    const paths = this.chooseValidPaths(p5, tile);
    for (const path of paths) {
      tile.paths.push(path);
    }
    tile.type = tileTypeFromPaths(paths);
    return tile;
  }

  private chooseValidPaths(p5: P5, tile: Tile): Array<Path> {
    const paths: Array<Path> = [];
    const { row, col } = tile;

    // Get neighbors
    const top = (this.grid[row - 1] ?? [])[col];
    const right = this.grid[row][col + 1];
    const bottom = (this.grid[row + 1] ?? [])[col];
    const left = this.grid[row][col - 1];

    const choices = new Set<TileType>();

    // Check corners
    if (!top && !left) {
      // Top-left corner
      choices.add(TileType.TOP_RIGHT);
      choices.add(TileType.TOP_BOTTOM);
      choices.add(TileType.BOTTOM_LEFT);
      choices.add(TileType.LEFT_RIGHT);
      choices.add(TileType.TOPBOTTOM_LEFTRIGHT);
      choices.add(TileType.BLANK);
    } else if (!top && !right) {
      // Top-right corner
      choices.add(TileType.TOP_LEFT);
      choices.add(TileType.TOP_BOTTOM);
      choices.add(TileType.LEFT_RIGHT);
      choices.add(TileType.BOTTOM_RIGHT);
      choices.add(TileType.TOPBOTTOM_LEFTRIGHT);
      choices.add(TileType.BLANK);
    } else if (!bottom && !right) {
      // Bottom-right corner
      choices.add(TileType.TOP_RIGHT);
      choices.add(TileType.TOP_BOTTOM);
      choices.add(TileType.BOTTOM_LEFT);
      choices.add(TileType.LEFT_RIGHT);
      choices.add(TileType.TOPBOTTOM_LEFTRIGHT);
      choices.add(TileType.BLANK);
    } else if (!bottom && !left) {
      // Bottom-left corner
      choices.add(TileType.TOP_LEFT);
      choices.add(TileType.TOP_BOTTOM);
      choices.add(TileType.LEFT_RIGHT);
      choices.add(TileType.BOTTOM_RIGHT);
      choices.add(TileType.TOPBOTTOM_LEFTRIGHT);
      choices.add(TileType.BLANK);
    }

    if (choices.size > 0) {
      const choice = p5.random(Array.from(choices));
      return this.pathsFromTileType(p5, choice);
    }

    // Check neighbors
    const requiredEdges = new Set<Edge>();
    const optionalEdges = new Set<Edge>();
    // First pass - add edges
    if (!top || top.type === TileType.UNKNOWN) {
      optionalEdges.add(Edge.TOP);
    } else if (REQUIRES_TOP.includes(top.type)) {
      requiredEdges.add(Edge.TOP);
    }
    if (!right || right.type === TileType.UNKNOWN) {
      optionalEdges.add(Edge.RIGHT);
    } else if (REQUIRES_RIGHT.includes(right.type)) {
      requiredEdges.add(Edge.RIGHT);
    }
    if (!left || left.type === TileType.UNKNOWN) {
      optionalEdges.add(Edge.LEFT);
    } else if (REQUIRES_LEFT.includes(left.type)) {
      requiredEdges.add(Edge.LEFT);
    }
    if (!bottom || bottom.type === TileType.UNKNOWN) {
      optionalEdges.add(Edge.BOTTOM);
    } else if (REQUIRES_BOTTOM.includes(bottom.type)) {
      requiredEdges.add(Edge.BOTTOM);
    }

    // Second pass - remove edges
    if (top && top.type !== TileType.UNKNOWN) {
      // If top neighbor does not have a bottom edge, remove
      // top edges as options
      if (!REQUIRES_TOP.includes(top.type)) {
        optionalEdges.delete(Edge.TOP);
      }
    }
    if (right && right.type !== TileType.UNKNOWN) {
      if (!REQUIRES_RIGHT.includes(right.type)) {
        optionalEdges.delete(Edge.RIGHT);
      }
    }
    if (left && left.type !== TileType.UNKNOWN) {
      if (!REQUIRES_LEFT.includes(left.type)) {
        optionalEdges.delete(Edge.LEFT);
      }
    }
    if (bottom && bottom.type !== TileType.UNKNOWN) {
      if (!REQUIRES_BOTTOM.includes(bottom.type)) {
        optionalEdges.delete(Edge.BOTTOM);
      }
    }


    const p = pathsFromEdges(p5, requiredEdges, optionalEdges);

    paths.push(...p);
    if (!paths.length) {
      console.warn("Unsolvable!");
      return paths;
    }
    return paths;
  }

  private pathsFromTileType(p5: P5, tile: TileType): Array<Path> {
    const paths: Array<Path> = [];
    switch (tile) {
      case TileType.TOP_RIGHT:
        paths.push({ start: Edge.TOP, end: Edge.RIGHT });
        break;
      case TileType.TOP_BOTTOM:
        paths.push({ start: Edge.TOP, end: Edge.BOTTOM });
        break;
      case TileType.TOP_LEFT:
        paths.push({ start: Edge.TOP, end: Edge.LEFT });
        break;
      case TileType.BOTTOM_RIGHT:
        paths.push({ start: Edge.BOTTOM, end: Edge.RIGHT });
        break;
      case TileType.BOTTOM_LEFT:
        paths.push({ start: Edge.BOTTOM, end: Edge.LEFT });
        break;
      case TileType.LEFT_RIGHT:
        paths.push({ start: Edge.LEFT, end: Edge.RIGHT });
        break;
      case TileType.TOPRIGHT_BOTTOMLEFT:
        paths.push({ start: Edge.TOP, end: Edge.RIGHT });
        paths.push({ start: Edge.BOTTOM, end: Edge.LEFT });
        break;
      case TileType.TOPBOTTOM_LEFTRIGHT:
        paths.push({ start: Edge.TOP, end: Edge.BOTTOM });
        paths.push({ start: Edge.LEFT, end: Edge.RIGHT });
        break;
      case TileType.TOPLEFT_BOTTOMRIGHT:
        paths.push({ start: Edge.TOP, end: Edge.LEFT });
        paths.push({ start: Edge.BOTTOM, end: Edge.RIGHT });
        break;
      default:
        break;
    }
    return paths;
  }
}