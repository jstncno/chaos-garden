import type P5 from "p5";

import { Edge, type Path, type Point, type Tile, type TileGrid, TileType } from "./tile";
import { HSB_COLOR_MAX } from "./constants";

const MAX_ITERATIONS = 100;

interface AngleDirection {
  start: number;
  end: number;
}

export interface PathItemState {
  tile: Tile;
  lineStart: Point;
  scale: Point;
  reverseScale: Point;
  lineEnd?: Point;
  angle?: AngleDirection;
  reverseAngle?: AngleDirection;
}

interface PathTraversal {
  start?: PathItemState;
  nextTile?: Tile;
}

export class LightPathGenerator {
  public readonly grid: TileGrid;

  constructor(
    grid: TileGrid
  ) {
    this.grid = this.deepCopyGrid(grid);
  }

  generate(p5: P5): LightPath | undefined {
    const path: Array<PathItemState> = [];
    const edgeTiles = this.getEdgeTiles(this.grid);
    const speed = p5.random(LightPath.MIN_STEP, LightPath.MAX_STEP);

    if (!edgeTiles.length) {
      return new LightPath(p5, path, speed);
    }

    // 1. Get starting point based on edge tile
    const startingTile: Tile = p5.random(edgeTiles);
    let prevTile: Tile | undefined;
    let currTile: Tile | undefined = { ...startingTile };

    let iterations = 0;
    while (currTile && iterations < MAX_ITERATIONS) {
      iterations++;
      // 2. Determine direction of patah to next point
      const { start, nextTile } = this.nextPathTile(p5, currTile, prevTile);
      if (!start) {
        console.error("Failed generating LightPath");
        p5.noLoop();
        return;
      }
      // 3. Follow path to connected neighbor
      path.push(start);
      prevTile = currTile;
      currTile = nextTile;
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn("Max iterations when generating a LightPath");
      p5.noLoop();
    }

    return new LightPath(p5, path, speed);
  }

  private deepCopyGrid(grid: TileGrid): TileGrid {
    const copy: TileGrid = [];
    for (let row = 0; row < grid.length; row++) {
      const col: Array<Tile> = grid[row];
      copy.push(col.map((item) => ({
        ...item,
        type: item.type,
        position: item.position,
      })))
    }
    return copy;
  }

  private flattenGrid(grid: TileGrid): Array<Tile> {
    const flattened: Array<Tile> = [];
    for (const row of grid) {
      for (const item of row) {
        flattened.push(item);
      }
    }
    return flattened;
  }

  private getEdgeTiles(grid: TileGrid): Array<Tile> {
    return this.flattenGrid(grid).filter((tile: Tile) => {
      if (tile.type === TileType.UNKNOWN) return false;

      const { row, col } = tile;
      const lastCol = grid[0].length - 1;
      // Corners
      if (row === 0 && col === 0) {
        // Top-left corner
        return (
          this.tileHasEdge(tile, Edge.TOP) ||
          this.tileHasEdge(tile, Edge.LEFT)
        );
      }
      if (row === 0 && col === lastCol) {
        // Top-right corner
        return (
          this.tileHasEdge(tile, Edge.TOP) ||
          this.tileHasEdge(tile, Edge.RIGHT)
        );
      }
      if (row === grid.length - 1 && col === lastCol) {
        // Bottom-right corner
        return (
          this.tileHasEdge(tile, Edge.BOTTOM) ||
          this.tileHasEdge(tile, Edge.RIGHT)
        );
      }
      if (row === grid.length - 1 && col === 0) {
        // Bottom-left corner
        return (
          this.tileHasEdge(tile, Edge.BOTTOM) ||
          this.tileHasEdge(tile, Edge.LEFT)
        );
      }

      // Edges
      if (row === 0) {
        // Top edge
        return this.tileHasEdge(tile, Edge.TOP);
      }
      if (col === lastCol) {
        // Right edge
        return this.tileHasEdge(tile, Edge.RIGHT);
      }
      if (row === grid.length - 1) {
        // Bottom edge
        return this.tileHasEdge(tile, Edge.BOTTOM);
      }
      if (col === 0) {
        // Left edge
        return this.tileHasEdge(tile, Edge.LEFT);
      }

      return false;
    });
  }

  private tileHasEdge(tile: Tile, edge: Edge): boolean {
    const edges = new Set<Edge>();
    for (const path of tile.paths) {
      edges.add(path.start);
      edges.add(path.end);
    }
    return edges.has(edge);
  }

  private nextPathTile(p5: P5, tile: Tile, prev?: Tile): PathTraversal {
    const { col, row } = tile;
    const numRows = this.grid.length;
    const numCols = (this.grid[0] || {}).length || 0;
    const top = 0;
    const right = numCols - 1;
    const bottom = numRows - 1;
    const left = 0;
    const path: Path = {
      start: Edge.TOP,
      end: Edge.RIGHT,
    };
    let nextTile: Tile | undefined;

    if (!prev) {
      // Starting tile (from corner or edge)
      switch (tile.type) {
        case TileType.TOP_RIGHT:
          if (row === top) {
            // Top -> right
            path.start = Edge.TOP;
            path.end = Edge.RIGHT;
            nextTile = this.grid[row][col + 1];
          } else if (col === right) {
            // Right -> top
            path.start = Edge.RIGHT;
            path.end = Edge.TOP;
            nextTile = (this.grid[row - 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.TOP_BOTTOM:
          if (row === top) {
            // Top -> bottom
            path.start = Edge.TOP;
            path.end = Edge.BOTTOM;
            nextTile = (this.grid[row + 1] ?? [])[col];
          } else if (row === bottom) {
            // Bottom -> top
            path.start = Edge.BOTTOM;
            path.end = Edge.TOP;
            nextTile = (this.grid[row - 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.TOP_LEFT:
          if (row === top) {
            // Top -> left
            path.start = Edge.TOP;
            path.end = Edge.LEFT;
            nextTile = this.grid[row][col - 1];
          } else if (col === left) {
            // Left -> top
            path.start = Edge.LEFT;
            path.end = Edge.TOP;
            nextTile = (this.grid[row - 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.BOTTOM_RIGHT:
          if (row === bottom) {
            // Bottom -> right
            path.start = Edge.BOTTOM;
            path.end = Edge.RIGHT;
            nextTile = this.grid[row][col + 1];
          } else if (col === right) {
            // Right -> Bottom
            path.start = Edge.RIGHT;
            path.end = Edge.BOTTOM;
            nextTile = (this.grid[row + 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.BOTTOM_LEFT:
          if (row === bottom) {
            // Bottom -> left
            path.start = Edge.BOTTOM;
            path.end = Edge.LEFT;
            nextTile = this.grid[row][col - 1];
          } else if (col === left) {
            // Left -> Bottom
            path.start = Edge.LEFT;
            path.end = Edge.BOTTOM;
            nextTile = (this.grid[row + 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.LEFT_RIGHT:
          if (col === left) {
            // Left -> right
            path.start = Edge.LEFT;
            path.end = Edge.RIGHT;
            nextTile = this.grid[row][col + 1];
          } else if (col === right) {
            // Right -> left
            path.start = Edge.RIGHT;
            path.end = Edge.LEFT;
            nextTile = this.grid[row][col - 1];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.TOPRIGHT_BOTTOMLEFT:
          if (row === top) {
            // Top -> right
            path.start = Edge.TOP;
            path.end = Edge.RIGHT;
            nextTile = this.grid[row][col + 1];
          } else if (col === right) {
            // Right -> top
            path.start = Edge.RIGHT;
            path.end = Edge.TOP;
            nextTile = (this.grid[row - 1] ?? [])[col];
          } else if (row === bottom) {
            // Bottom -> left
            path.start = Edge.BOTTOM;
            path.end = Edge.LEFT;
            nextTile = this.grid[row][col - 1];
          } else if (col === left) {
            // Left -> bottom
            path.start = Edge.LEFT;
            path.end = Edge.BOTTOM;
            nextTile = (this.grid[row + 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.TOPBOTTOM_LEFTRIGHT:
          if (row === top) {
            // Top -> bottom
            path.start = Edge.TOP;
            path.end = Edge.BOTTOM;
            nextTile = (this.grid[row + 1] ?? [])[col];
          } else if (row === bottom) {
            // Bottom -> top
            path.start = Edge.BOTTOM;
            path.end = Edge.TOP;
            nextTile = (this.grid[row - 1] ?? [])[col];
          } else if (col === left) {
            // Left -> right
            path.start = Edge.LEFT;
            path.end = Edge.RIGHT;
            nextTile = this.grid[row][col + 1];
          } else if (col === right) {
            // Right -> left
            path.start = Edge.RIGHT;
            path.end = Edge.LEFT;
            nextTile = this.grid[row][col - 1];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        case TileType.TOPLEFT_BOTTOMRIGHT:
          if (row === top) {
            // Top -> left
            path.start = Edge.TOP;
            path.end = Edge.LEFT;
            nextTile = this.grid[row][col - 1];
          } else if (col === left) {
            // Left -> top
            path.start = Edge.LEFT;
            path.end = Edge.TOP;
            nextTile = (this.grid[row - 1] ?? [])[col];
          } else if (row === bottom) {
            // Bottom -> right
            path.start = Edge.BOTTOM;
            path.end = Edge.RIGHT;
            nextTile = this.grid[row][col + 1];
          } else if (col === right) {
            // Right -> bottom
            path.start = Edge.RIGHT;
            path.end = Edge.BOTTOM;
            nextTile = (this.grid[row + 1] ?? [])[col];
          } else {
            console.warn(col, row, TileType[tile.type]);
          }
          break;
        default:
          console.warn(col, row, tile.type, TileType[tile.type]);
          break;
      }

      const start = this.toItemState(p5, tile, path);
      return { start, nextTile };
    }

    // Pick next tile based on previous neighbor
    const prevCol = prev.col;
    const prevRow = prev.row;
    if (prevRow === row - 1 && prevCol === col) {
      // Top prev neighbor
      path.start = Edge.TOP;
      switch (tile.type) {
        case TileType.TOP_RIGHT:
        case TileType.TOPRIGHT_BOTTOMLEFT:
          // Top -> right
          path.end = Edge.RIGHT;
          nextTile = this.grid[row][col + 1];
          break;
        case TileType.TOP_BOTTOM:
        case TileType.TOPBOTTOM_LEFTRIGHT:
          // Top -> bottom
          path.end = Edge.BOTTOM;
          nextTile = (this.grid[row + 1] ?? [])[col];
          break;
        case TileType.TOP_LEFT:
        case TileType.TOPLEFT_BOTTOMRIGHT:
          // Top -> left
          path.end = Edge.LEFT;
          nextTile = this.grid[row][col - 1];
          break;
        default:
          break;
      }
    } else if (prevCol === col + 1 && prevRow === row) {
      // Right prev neighbor
      path.start = Edge.RIGHT;
      switch (tile.type) {
        case TileType.TOP_RIGHT:
        case TileType.TOPRIGHT_BOTTOMLEFT:
          // Right -> top
          path.end = Edge.TOP;
          nextTile = (this.grid[row - 1] ?? [])[col];
          break;
        case TileType.BOTTOM_RIGHT:
        case TileType.TOPLEFT_BOTTOMRIGHT:
          // Right -> bottom
          path.end = Edge.BOTTOM;
          nextTile = (this.grid[row + 1] ?? [])[col];
          break;
        case TileType.LEFT_RIGHT:
        case TileType.TOPBOTTOM_LEFTRIGHT:
          // Right -> left
          path.end = Edge.LEFT;
          nextTile = this.grid[row][col - 1];
          break;
        default:
          break;
      }
    } else if (prevRow === row + 1 && prevCol === col) {
      // Bottom prev neighbor
      path.start = Edge.BOTTOM;
      switch (tile.type) {
        case TileType.TOP_BOTTOM:
        case TileType.TOPBOTTOM_LEFTRIGHT:
          // Bottom -> top
          path.end = Edge.TOP;
          nextTile = (this.grid[row - 1] ?? [])[col];
          break;
        case TileType.BOTTOM_RIGHT:
        case TileType.TOPLEFT_BOTTOMRIGHT:
          // Bottom -> right
          path.end = Edge.RIGHT;
          nextTile = this.grid[row][col + 1];
          break;
        case TileType.BOTTOM_LEFT:
        case TileType.TOPRIGHT_BOTTOMLEFT:
          // Bottom -> left
          path.end = Edge.LEFT;
          nextTile = this.grid[row][col - 1];
          break;
        default:
          break;
      }
    } else if (prevCol === col - 1 && prevRow === row) {
      // Left prev neighbor
      path.start = Edge.LEFT;
      switch (tile.type) {
        case TileType.TOP_LEFT:
        case TileType.TOPLEFT_BOTTOMRIGHT:
          // Left -> top
          path.end = Edge.TOP;
          nextTile = (this.grid[row - 1] ?? [])[col];
          break;
        case TileType.LEFT_RIGHT:
        case TileType.TOPBOTTOM_LEFTRIGHT:
          // Left -> right
          path.end = Edge.RIGHT;
          nextTile = this.grid[row][col + 1];
          break;
        case TileType.BOTTOM_LEFT:
        case TileType.TOPRIGHT_BOTTOMLEFT:
          // Left -> bottom
          path.end = Edge.BOTTOM;
          nextTile = (this.grid[row + 1] ?? [])[col];
          break;
        default:
          break;
      }
    }
    const start = this.toItemState(p5, tile, path);
    return { start, nextTile };
  }

  private toItemState(p5: P5, tile: Tile, path: Path): PathItemState | undefined {
    const half = tile.size / 2;
    const { x, y } = tile.position;
    const { start, end } = path;

    let startX: number | undefined;
    let startY: number | undefined;
    let endX: number | undefined;
    let endY: number | undefined;
    let startAngle: number | undefined;
    let endAngle: number | undefined;
    let reverseStartAngle: number | undefined;
    let reverseEndAngle: number | undefined;
    let scaleX: number = 1;
    let scaleY: number = 1;
    let reverseScaleX: number = 1;
    let reverseScaleY: number = 1;


    if (start === Edge.TOP && end === Edge.RIGHT) {
      // Top -> right
      startX = x + half;
      startY = y - half;
      startAngle = 0;
      endAngle = p5.HALF_PI;
      scaleX = -1;
      reverseStartAngle = p5.HALF_PI;
      reverseEndAngle = p5.PI;
    } else if (start === Edge.TOP && end === Edge.BOTTOM) {
      // Top -> bottom
      startX = x;
      startY = y - half;
      endX = x;
      endY = y + half;
    } else if (start === Edge.TOP && end === Edge.LEFT) {
      // Top -> left
      startX = x - half;
      startY = y - half;
      startAngle = 0;
      endAngle = p5.HALF_PI;
      reverseStartAngle = p5.HALF_PI;
      reverseEndAngle = p5.PI;
      reverseScaleX = -1;
    } else if (start === Edge.BOTTOM && end === Edge.TOP) {
      // Bottom -> top
      startX = x;
      startY = y + half;
      endX = x;
      endY = y - half;
      scaleY = -1;
      reverseScaleY = -1;
    } else if (start === Edge.BOTTOM && end === Edge.RIGHT) {
      // Bottom -> right
      startX = x + half;
      startY = y + half;
      startAngle = p5.PI;
      endAngle = p5.PI + p5.HALF_PI;
      reverseStartAngle = p5.PI + p5.HALF_PI;
      reverseEndAngle = p5.TWO_PI;
      reverseScaleX = -1;
    } else if (start === Edge.BOTTOM && end === Edge.LEFT) {
      // Bottom -> left
      startX = x - half;
      startY = y + half;
      startAngle = p5.PI;
      endAngle = p5.PI + p5.HALF_PI;
      reverseStartAngle = p5.PI + p5.HALF_PI;
      reverseEndAngle = p5.TWO_PI;
      scaleX = -1;
    } else if (start === Edge.RIGHT && end === Edge.TOP) {
      // Right -> top
      startX = x + half;
      startY = y - half;
      startAngle = p5.HALF_PI;
      endAngle = p5.PI;
      reverseStartAngle = 0;
      reverseEndAngle = p5.HALF_PI;
      reverseScaleX = -1;
    } else if (start === Edge.RIGHT && end === Edge.BOTTOM) {
      // Right -> bottom
      startX = x + half;
      startY = y + half;
      startAngle = p5.PI + p5.HALF_PI;
      endAngle = p5.TWO_PI;
      reverseStartAngle = p5.PI;
      reverseEndAngle = p5.PI + p5.HALF_PI;
      scaleX = -1;
    } else if (start === Edge.RIGHT && end === Edge.LEFT) {
      // Right -> left
      startX = x + half;
      startY = y;
      endX = x - half;
      endY = y;
      scaleX = -1;
    } else if (start === Edge.LEFT && end === Edge.TOP) {
      // Left -> top
      startX = x - half;
      startY = y - half;
      startAngle = p5.HALF_PI;
      endAngle = p5.PI;
      scaleX = -1;
      reverseStartAngle = 0;
      reverseEndAngle = p5.HALF_PI;
    } else if (start === Edge.LEFT && end === Edge.RIGHT) {
      // Left -> right
      startX = x - half;
      startY = y;
      endX = x + half;
      endY = y;
      reverseScaleX = -1;
    } else if (start === Edge.LEFT && end === Edge.BOTTOM) {
      // Left -> bottom
      startX = x - half;
      startY = y + half;
      startAngle = p5.PI + p5.HALF_PI;
      endAngle = p5.TWO_PI;
      reverseStartAngle = p5.PI;
      reverseEndAngle = p5.PI + p5.HALF_PI;
      reverseScaleX = -1;
    } else {
      return;
    }

    const lineEnd =
      endX !== undefined && endY !== undefined
        ? { x: endX, y: endY }
        : undefined;
    const angle =
      startAngle !== undefined && endAngle !== undefined
        ? { start: startAngle, end: endAngle }
        : undefined;
    const reverseAngle =
      reverseStartAngle !== undefined && reverseEndAngle !== undefined
        ? { start: reverseStartAngle, end: reverseEndAngle }
        : undefined;

    return {
      tile,
      lineStart: { x: startX, y: startY },
      scale: { x: scaleX, y: scaleY },
      reverseScale: { x: reverseScaleX, y: reverseScaleY },
      lineEnd,
      angle,
      reverseAngle,
    };
  }
}

export class LightPath {
  static MIN_STEP = 0.5;
  static MAX_STEP = 2.0;

  private hueNoise: number;
  private saturationNoise: number;
  private brightnessNoise: number;
  private currIdx: number = 0;
  private currPct: number = 0;
  private complete: boolean = false;

  get done(): boolean {
    return this.complete;
  }

  constructor(
    p5: P5,
    public readonly path: Array<PathItemState>,
    public speed = LightPath.MIN_STEP,
  ) {
    this.hueNoise = p5.random(0, HSB_COLOR_MAX); // Hue
    this.saturationNoise = p5.random(0, HSB_COLOR_MAX); // Saturation
    this.brightnessNoise = p5.random(HSB_COLOR_MAX / 2, HSB_COLOR_MAX); // Brightness
  }

  draw(p5: P5, speedFactor = 1) {
    const item = this.path[this.currIdx];
    const prev = this.path[this.currIdx - 1];

    const color = [
      p5.map(p5.noise(this.hueNoise), 0, 1, 0, HSB_COLOR_MAX * 2) % HSB_COLOR_MAX, // Hue
      p5.map(p5.noise(this.saturationNoise), 0, 1, 0, HSB_COLOR_MAX * 2) % HSB_COLOR_MAX, // Saturation
      p5.map(p5.noise(this.brightnessNoise), 0, 1, 0, HSB_COLOR_MAX * 2), // Brightness
    ];
    p5.stroke(color);
    p5.strokeWeight(6);
    p5.noFill();

    if (item) {
      const { tile } = item;

      let startX = item.lineStart.x;
      let startY = item.lineStart.y;
      let endX = (item.lineEnd ?? {}).x;
      let endY = (item.lineEnd ?? {}).y;
      let startAngle = (item.angle ?? {}).start;
      let endAngle = (item.angle ?? {}).end;
      let scaleX = item.scale.x;
      let scaleY = item.scale.y;

      // Fill in current tile
      if (startAngle !== undefined && endAngle !== undefined) {
        const dist = Math.abs(endAngle - startAngle);
        const pct = dist * this.currPct;
        const progress = startAngle + pct;
        p5.push();
        p5.translate(startX, startY);
        p5.scale(scaleX, scaleY);
        p5.arc(0, 0, tile.size, tile.size, startAngle, progress);
        p5.pop();
      } else if ((
        startX !== undefined &&
        startY !== undefined &&
        endX !== undefined &&
        endY !== undefined
      )) {
        const distX = Math.abs(startX - endX);
        const distY = Math.abs(startY - endY);
        const pctX = distX * this.currPct;
        const pctY = distY * this.currPct;
        const progressX = startX + pctX * scaleX;
        const progressY = startY + pctY * scaleY;
        p5.line(startX, startY, progressX, progressY);
      }
    }

    // Fill out prev tile
    if (prev && prev.reverseAngle !== undefined) {
      const { lineStart, reverseScale, reverseAngle } = prev;
      const dist = Math.abs(reverseAngle.start - reverseAngle.end);
      const pct = dist * this.currPct;
      const progress = reverseAngle.end - pct;
      p5.push();
      p5.translate(lineStart.x, lineStart.y);
      p5.scale(reverseScale.x, reverseScale.y);
      p5.arc(0, 0, prev.tile.size, prev.tile.size, reverseAngle.start, progress);
      p5.pop();
    } else if (prev && prev.lineEnd !== undefined) {
      const { lineStart, lineEnd, reverseScale } = prev;
      const distX = Math.abs(lineStart.x - lineEnd.x);
      const distY = Math.abs(lineStart.y - lineEnd.y);
      const pctX = distX * this.currPct;
      const pctY = distY * this.currPct;
      const progressX = lineStart.x - pctX * reverseScale.x;
      const progressY = lineStart.y + pctY * reverseScale.y;
      p5.line(lineEnd.x, lineEnd.y, progressX, progressY);
    }

    this.currPct += (this.speed * speedFactor);
    this.hueNoise += (this.speed * speedFactor);
    this.saturationNoise += (this.speed * speedFactor);
    this.brightnessNoise += (this.speed * speedFactor);

    if (this.currPct > 1.0) {
      this.currPct = 0;
      this.currIdx++;
    }
    if (this.currIdx >= this.path.length && !prev) {
      this.complete = true;
    }
  }
}