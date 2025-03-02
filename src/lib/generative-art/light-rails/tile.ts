import P5 from 'p5';
import { DEFAULT_TILE_SIZE, DEFAULT_HSB_COLOR } from './constants';

export interface Point {
  x: number;
  y: number;
}

export interface Path {
  start: Edge;
  end: Edge;
}

export enum Edge {
  TOP = 1,
  RIGHT,
  BOTTOM,
  LEFT,
}

export enum TileType {
  UNKNOWN = 0,
  BLANK,
  TOP_RIGHT,
  TOP_BOTTOM,
  TOP_LEFT,
  BOTTOM_RIGHT,
  BOTTOM_LEFT,
  LEFT_RIGHT,
  TOPRIGHT_BOTTOMLEFT,
  TOPBOTTOM_LEFTRIGHT,
  TOPLEFT_BOTTOMRIGHT,
}

export interface Tile {
  type: TileType;
  paths: Array<Path>;
  position: Point;
  row: number;
  col: number;
  size: number;
}

export type Grid<T> = Array<Array<T>>;
export type TileGrid = Grid<Tile>;

export function tileTypeFromPaths(paths: Array<Path>): TileType {
  const tileTypes = new Set<TileType>();
  for (const path of paths) {
    if (
      // TOP_POINT and BOTTOM_POINT
      (path.start === Edge.TOP && path.end === Edge.BOTTOM) ||
      (path.start === Edge.BOTTOM && path.end === Edge.TOP)
    ) {
      tileTypes.add(TileType.TOP_BOTTOM);
    } else if (
      // TOP_POINT and RIGHT_POINT
      (path.start === Edge.TOP && path.end === Edge.RIGHT) ||
      (path.start === Edge.RIGHT && path.end === Edge.TOP)
    ) {
      tileTypes.add(TileType.TOP_RIGHT);
    } else if (
      // TOP_POINT and LEFT_POINT
      (path.start === Edge.TOP && path.end === Edge.LEFT) ||
      (path.start === Edge.LEFT && path.end === Edge.TOP)
    ) {
      tileTypes.add(TileType.TOP_LEFT);
    } else if (
      // BOTTOM_POINT and RIGHT_POINT
      (path.start === Edge.BOTTOM && path.end === Edge.RIGHT) ||
      (path.start === Edge.RIGHT && path.end === Edge.BOTTOM)
    ) {
      tileTypes.add(TileType.BOTTOM_RIGHT);
    } else if (
      // BOTTOM_POINT and LEFT_POINT
      (path.start === Edge.BOTTOM && path.end === Edge.LEFT) ||
      (path.start === Edge.LEFT && path.end === Edge.BOTTOM)
    ) {
      tileTypes.add(TileType.BOTTOM_LEFT);
    } else if (
      // LEFT_POINT and RIGHT_POINT
      (path.start === Edge.LEFT && path.end === Edge.RIGHT) ||
      (path.start === Edge.RIGHT && path.end === Edge.LEFT)
    ) {
      tileTypes.add(TileType.LEFT_RIGHT);
    }
  }

  const pathTypes: Array<TileType> = Array.from(tileTypes);

  if (pathTypes.length === 0) return TileType.BLANK;

  if (pathTypes.length === 1) return pathTypes[0]

  const [first, second] = pathTypes;
  if (
    // TOP_POINT and BOTTOM_POINT
    (first === TileType.TOP_BOTTOM || second === TileType.TOP_BOTTOM) &&
    // LEFT_POINT and RIGHT_POINT
    (first === TileType.LEFT_RIGHT || second === TileType.LEFT_RIGHT)
  ) {
    return TileType.TOPBOTTOM_LEFTRIGHT;
  } else if (
    // TOP_POINT and RIGHT_POINT
    (first === TileType.TOP_RIGHT || second === TileType.TOP_RIGHT) &&
    // BOTTOM_POINT and LEFT_POINT
    (first === TileType.BOTTOM_LEFT || second === TileType.BOTTOM_LEFT)
  ) {
    return TileType.TOPRIGHT_BOTTOMLEFT;
  } else if (
    // TOP_POINT and LEFT_POINT
    (first === TileType.TOP_LEFT || second === TileType.TOP_LEFT) &&
    // BOTTOM_POINT and RIGHT_POINT
    (first === TileType.BOTTOM_RIGHT || second === TileType.BOTTOM_RIGHT)
  ) {
    return TileType.TOPLEFT_BOTTOMRIGHT;
  }

  return TileType.BLANK;
}


export class LightRailTile implements Tile {
  get type(): TileType {
    return tileTypeFromPaths(this.paths);
  }

  get position(): Point {
    const half = this.size / 2;
    const x = (this.col * this.size) + (half);
    const y = (this.row * this.size) + (half);
    return { x, y };
  }

  static fromTile(
    tile: Tile,
    size: number = DEFAULT_TILE_SIZE,
    color = DEFAULT_HSB_COLOR
  ): LightRailTile {
    const { paths, row, col } = tile;
    return new LightRailTile(paths, row, col, size, color);
  }

  constructor(
    public readonly paths: Array<Path>,
    public readonly row: number = 0,
    public readonly col: number = 0,
    public readonly size: number = DEFAULT_TILE_SIZE,
    public color: Array<number> = DEFAULT_HSB_COLOR
  ) { }


  draw(p5: P5) {
    p5.strokeWeight(2);
    p5.stroke("#3e4b59");
    p5.noFill();
    const half = this.size / 2;
    p5.rect(
      this.position.x - half,
      this.position.y - half,
      this.size,
      this.size
    );

    p5.strokeWeight(4);
    p5.stroke(this.color);
    // p5.point(this.position.x, this.position.y);

    for (const path of this.paths) {
      const { start, end } = path;
      if (
        // TOP_POINT and RIGHT_POINT
        (start === Edge.TOP && end === Edge.RIGHT) ||
        (start === Edge.RIGHT && end === Edge.TOP)
      ) {
        const x = this.position.x + half;
        const y = this.position.y - half;
        const startAngle = p5.HALF_PI;
        const stopAngle = p5.PI;
        p5.arc(x, y, this.size, this.size, startAngle, stopAngle);
      } else if (
        // TOP_POINT and BOTTOM_POINT
        (start === Edge.TOP && end === Edge.BOTTOM) ||
        (start === Edge.BOTTOM && end === Edge.TOP)
      ) {
        const startX = this.position.x;
        const startY = this.position.y - half;
        const endX = this.position.x;
        const endY = this.position.y + half;
        p5.line(startX, startY, endX, endY);
      } else if (
        // TOP_POINT and LEFT_POINT
        (start === Edge.TOP && end === Edge.LEFT) ||
        (start === Edge.LEFT && end === Edge.TOP)
      ) {
        const x = this.position.x - half;
        const y = this.position.y - half;
        const startAngle = 0;
        const stopAngle = p5.HALF_PI;
        p5.arc(x, y, this.size, this.size, startAngle, stopAngle);
      } else if (
        // BOTTOM_POINT and RIGHT_POINT
        (start === Edge.BOTTOM && end === Edge.RIGHT) ||
        (start === Edge.RIGHT && end === Edge.BOTTOM)
      ) {
        const x = this.position.x + half;
        const y = this.position.y + half;
        const startAngle = p5.PI;
        const stopAngle = p5.PI + p5.HALF_PI;
        p5.arc(x, y, this.size, this.size, startAngle, stopAngle);
      } else if (
        // BOTTOM_POINT and LEFT_POINT
        (start === Edge.BOTTOM && end === Edge.LEFT) ||
        (start === Edge.LEFT && end === Edge.BOTTOM)
      ) {
        const x = this.position.x - half;
        const y = this.position.y + half;
        const startAngle = p5.PI + p5.HALF_PI;
        const stopAngle = p5.TWO_PI;
        p5.arc(x, y, this.size, this.size, startAngle, stopAngle);
      } else if (
        // LEFT_POINT and RIGHT_POINT
        (start === Edge.LEFT && end === Edge.RIGHT) ||
        (start === Edge.RIGHT && end === Edge.LEFT)
      ) {
        const startX = this.position.x - half;
        const startY = this.position.y;
        const endX = this.position.x + half;
        const endY = this.position.y;
        p5.line(startX, startY, endX, endY);
      }
    }
  }

  setColor(color: Array<number>) {
    this.color = color;
  }
}
