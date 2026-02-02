
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LiquidGlassService {

  constructor() { }

  /**
   * Generates a displacement map for a rounded rectangle.
   * R channel: X displacement
   * G channel: Y displacement
   * 128 = 0 displacement.
   */
  generateDisplacementMap(width: number, height: number, borderRadius: number, bezelWidth: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Center of the rectangle
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Half extents for SDF
    // The SDF for a rounded box of generic size (w, h) centered at 0
    // b = (w/2, h/2) - r
    // dist = length(max(abs(p) - b, 0.0)) - r
    const rw = (width / 2) - borderRadius;
    const rh = (height / 2) - borderRadius;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;

        // Local coordinates relative to center
        const px = x - centerX;
        const py = y - centerY;

        // --- SDF Calculation for Rounded Box ---
        // q = abs(p) - b + r
        // But simplified:
        // We calculate distance from the "bone" of the rectangle.
        
        const qx = Math.abs(px) - rw;
        const qy = Math.abs(py) - rh;

        // currDist is the signed distance to the shape edge.
        // Negative = inside, Positive = outside.
        // For rounded corner: length(max(q, 0)) + min(max(q.x, q.y), 0) - r
        const distOutside = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2);
        const distInside = Math.min(Math.max(qx, qy), 0);
        const dist = distOutside + distInside - borderRadius;

        // We only care about the "bezel" area, which is from edge (dist=0) inwards to dist = -bezelWidth
        // Or if we want an outer bezel too, say from -bezelWidth to +bezelWidth.
        // The blog post says "glass surface is described by a function that defines how thick the glass is... from its edge to the end of the bezel".
        // Let's assume the bezel is "inside" the button shape primarily for the liquid look.
        
        // Let's define normalized position on the bezel.
        // d goes from 0 (edge) to -bezelWidth (flat surface start).
        // if dist > 0 -> outside. if dist < -bezelWidth -> flat top.
        
        let normalX = 0;
        let normalY = 0;

        if (dist > 0) {
            // Outside the shape completely. No displacement (or edge behavior).
            // Usually we want 0 displacement outside.
            normalX = 0;
            normalY = 0;
        } else if (dist < -bezelWidth) {
            // Flat surface on top. Normal is pointing straight up (Z). X/Y component is 0.
            normalX = 0;
            normalY = 0;
        } else {
             // We are on the bezel curve.
             // We need the gradient of the distance field here to get the direction to the nearest edge.
             // The normal of the SDF is the direction *away* from the shape center (mostly).
             // Actually, we want the surface normal.
             // Simple hack: finite difference or analytical gradient.
             // Analytical gradient of SDF is approximately the direction vector to the closest point on the skeleton.
             
             // Let's use finite difference for simplicity and robustness.
             const delta = 1.0;
             const d1x = this.sdf(px + delta, py, rw, rh, borderRadius);
             const d2x = this.sdf(px - delta, py, rw, rh, borderRadius);
             const d1y = this.sdf(px, py + delta, rw, rh, borderRadius);
             const d2y = this.sdf(px, py - delta, rw, rh, borderRadius);
             
             const nx = (d1x - d2x) / (2 * delta);
             const ny = (d1y - d2y) / (2 * delta);
             
             // Now we have the direction pointing "outwards" (implied by dist increasing outwards).
             // But we also need to modulate the magnitude based on the "slope" of the glass profile.
             // Profile: h(d).
             // normal_surface = (-dh/dx, -dh/dy, 1).
             // We just really want to map the slope to color.
             // Let's assume a convex profile: sin or parabola over the bezel range.
             
             // Normalized distance across bezel: 0 (edge) to 1 (flat start)
             // d goes 0 -> -bezelWidth.
             // t = -dist / bezelWidth. (0 at edge, 1 at flat start).
             const t = -dist / bezelWidth;
             
             // Height profile h(t). Let's say quarter circle.
             // h(t) = sqrt(1 - (1-t)^2) ? No, that's convex edge.
             // Let's stick to the blog: "Simple circular arc".
             // We want the derivative of the height.
             // Let's just model the "slope" magnitude.
             // At edge (t=0), slope is steep. At flat (t=1), slope is 0.
             // Let's say slope magnitude propto cos(t * pi/2).
             
             const slopeFactor = Math.cos(t * Math.PI / 2); // 1 at edge, 0 at flat.
             
             // The displacement vector is along the SDF gradient (nx, ny).
             // Magnitude depends on slope and IOR (refraction index), but simplified -> slopeFactor.
             
             normalX = nx * slopeFactor;
             normalY = ny * slopeFactor;
        }

        // Map [-1, 1] to [0, 255]. 0 -> 128.
        data[index] = 128 + (normalX * 127);     // R
        data[index + 1] = 128 + (normalY * 127); // G
        data[index + 2] = 128;                   // B
        data[index + 3] = 255;                   // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
  
  // Helper for SDF of rounded box.
  // p: point, b: box half-size (rw, rh), r: corner radius
  private sdf(px: number, py: number, rw: number, rh: number, r: number) {
      const qx = Math.abs(px) - rw;
      const qy = Math.abs(py) - rh;
      const distOutside = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2);
      const distInside = Math.min(Math.max(qx, qy), 0);
      return distOutside + distInside - r;
  }
}
