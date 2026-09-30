import { describe, expect, test } from "bun:test";
import {
  buildGeometry, mat4RotateY, mat4LookAt,
  mat4Perspective, mat4TetrahedronProjection,
  DRAW_HEIGHT_FRACTION, DRAW_TOP_FRACTION,
} from "./tetrahedron-webgl.js";

describe("tetrahedron geometry", () => {
  test("the bevel forms a closed surface with outward normals", () => {
    const { positions, normals, count } = buildGeometry();
    expect(count).toBe(60);
    expect(positions.length).toBe(count * 3);
    expect(normals.length).toBe(positions.length);

    const edges = new Map();
    for (let offset = 0; offset < positions.length; offset += 9) {
      const vertices = [0, 3, 6].map((index) =>
        Array.from(positions.slice(offset + index, offset + index + 3)));
      const a = vertices[1].map((value, axis) => value - vertices[0][axis]);
      const b = vertices[2].map((value, axis) => value - vertices[0][axis]);
      const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const center = vertices[0].map((_, axis) =>
        (vertices[0][axis] + vertices[1][axis] + vertices[2][axis]) / 3 - (axis === 1 ? 1 / 3 : 0));
      expect(cross.reduce((sum, value, axis) => sum + value * center[axis], 0)).toBeGreaterThan(0);
      for (let vertex = 0; vertex < 3; vertex++) {
        const normal = Array.from(normals.slice(offset + vertex * 3, offset + vertex * 3 + 3));
        expect(Math.hypot(...normal)).toBeCloseTo(1, 6);
        // Every face, including its chamfer and cap, has a perpendicular normal.
        const alignment = normal.reduce((sum, value, axis) => sum + value * cross[axis], 0) / Math.hypot(...cross);
        expect(alignment).toBeCloseTo(1, 6);
        const from = JSON.stringify(vertices[vertex]);
        const to = JSON.stringify(vertices[(vertex + 1) % 3]);
        const edge = [from, to].sort().join("|");
        const direction = from < to ? 1 : -1;
        const previous = edges.get(edge) || { count: 0, direction: 0 };
        edges.set(edge, { count: previous.count + 1, direction: previous.direction + direction });
      }
    }
    expect(edges.size).toBe(30);
    for (const edge of edges.values()) expect(edge).toEqual({ count: 2, direction: 0 });
  });

  test("rotation updates a caller-owned matrix without retaining stale values", () => {
    const target = new Float32Array(16).fill(99);
    expect(mat4RotateY(Math.PI / 2, target)).toBe(target);
    expect(target[2]).toBeCloseTo(-1);
    expect(target[8]).toBeCloseTo(1);
    expect(target[5]).toBe(1);
    expect(target[15]).toBe(1);
    expect(Array.from(target)).not.toContain(99);
  });
});

function transform(matrix, vector) {
  return [0, 1, 2, 3].map((row) =>
    vector.reduce((sum, value, column) => sum + matrix[column * 4 + row] * value, 0));
}

test("cropping preserves the original screen position and contains every rotation", () => {
  const geometry = buildGeometry();
  const view = mat4LookAt(0, 0.5, 5.2, 0, 0, 0);
  for (const sceneHeight of [250, 400]) {
    const width = 256;
    const height = sceneHeight * DRAW_HEIGHT_FRACTION;
    const original = mat4Perspective(35, width / sceneHeight, 0.1, 1000);
    const cropped = mat4TetrahedronProjection(width, height);
    const top = sceneHeight * DRAW_TOP_FRACTION;
    let maxPositionError = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let step = 0; step < 360; step++) {
      const model = mat4RotateY(step * Math.PI / 180);
      // Four primary triangles contain all 12 unique bevel vertices.
      for (let offset = 0; offset < 36; offset += 3) {
        const point = [...geometry.positions.slice(offset, offset + 3), 1];
        const camera = transform(view, transform(model, point));
        const before = transform(original, camera);
        const after = transform(cropped, camera);
        const beforeX = (before[0] / before[3] + 1) * width / 2;
        const beforeY = (1 - before[1] / before[3]) * sceneHeight / 2;
        const afterX = (after[0] / after[3] + 1) * width / 2;
        const afterY = (1 - after[1] / after[3]) * height / 2;
        maxPositionError = Math.max(maxPositionError, Math.abs(afterX - beforeX), Math.abs(afterY + top - beforeY));
        minX = Math.min(minX, afterX); maxX = Math.max(maxX, afterX);
        minY = Math.min(minY, afterY); maxY = Math.max(maxY, afterY);
      }
    }
    expect(maxPositionError).toBeLessThan(0.0001);
    expect(minX).toBeGreaterThan(0);
    expect(maxX).toBeLessThan(width);
    expect(minY).toBeGreaterThan(0);
    expect(maxY).toBeLessThan(height);
  }
});
