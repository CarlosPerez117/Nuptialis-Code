
import { Directive, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LiquidGlassService } from '../services/liquid-glass.service';

@Directive({
    selector: '[appLiquidGlass]',
    standalone: true
})
export class LiquidGlassDirective implements AfterViewInit, OnDestroy {
    @Input() bezelWidth: number = 10;
    @Input() refractionScale: number = 20;
    @Input() borderRadius: number = 20;

    private filterId: string;
    private svgElement: SVGElement | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor(
        private el: ElementRef,
        private liquidGlassService: LiquidGlassService,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.filterId = `liquid-glass-${Math.random().toString(36).substr(2, 9)}`;
    }

    ngAfterViewInit(): void {
        this.applyEffect();
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                this.applyEffect();
            });
            this.resizeObserver.observe(this.el.nativeElement);
        }
    }

    ngOnDestroy(): void {
        if (this.svgElement) {
            this.renderer.removeChild(this.document.body, this.svgElement);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    private applyEffect(): void {
        const rect = this.el.nativeElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        if (width === 0 || height === 0) return;

        // Ensure host is relative
        const computedStyle = window.getComputedStyle(this.el.nativeElement);
        if (computedStyle.position === 'static') {
            this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
        }

        const mapUrl = this.liquidGlassService.generateDisplacementMap(width, height, this.borderRadius, this.bezelWidth);

        if (this.svgElement) {
            this.renderer.removeChild(this.document.body, this.svgElement);
        }

        this.svgElement = this.createSvgFilter(width, height, mapUrl);
        this.renderer.appendChild(this.document.body, this.svgElement);

        let glassLayer = this.el.nativeElement.querySelector('.liquid-glass-layer');
        if (!glassLayer) {
            glassLayer = this.renderer.createElement('div');
            this.renderer.addClass(glassLayer, 'liquid-glass-layer');
            this.renderer.setStyle(glassLayer, 'position', 'absolute');
            this.renderer.setStyle(glassLayer, 'top', '0');
            this.renderer.setStyle(glassLayer, 'left', '0');
            this.renderer.setStyle(glassLayer, 'width', '100%');
            this.renderer.setStyle(glassLayer, 'height', '100%');
            this.renderer.setStyle(glassLayer, 'z-index', '-1');
            this.renderer.setStyle(glassLayer, 'border-radius', `${this.borderRadius}px`);
            this.renderer.setStyle(glassLayer, 'pointer-events', 'none');

            this.renderer.appendChild(this.el.nativeElement, glassLayer);
        }

        // --- Critical Visual Fix ---
        // Copy Styles from Host to Layer to be the "Liquid Body"
        // This makes sure the layer is visible and has the color/border the user expects.
        // It also ensures `filter: url(...)` works because the layer is not transparent.

        // We only copy if the host actually has styles.
        // If the host is using a class (e.g. .btn-glass-hero), computedStyle picks it up.
        this.renderer.setStyle(glassLayer, 'background', computedStyle.background);
        this.renderer.setStyle(glassLayer, 'backgroundColor', computedStyle.backgroundColor);
        this.renderer.setStyle(glassLayer, 'border', computedStyle.border);
        this.renderer.setStyle(glassLayer, 'borderRadius', computedStyle.borderRadius !== '0px' ? computedStyle.borderRadius : `${this.borderRadius}px`);
        this.renderer.setStyle(glassLayer, 'boxShadow', computedStyle.boxShadow);

        const existingBackdrop = computedStyle.backdropFilter !== 'none' ? computedStyle.backdropFilter : '';
        const blurAmount = 'blur(5px)';

        this.renderer.setStyle(glassLayer, 'filter', `url(#${this.filterId})`);
        this.renderer.setStyle(glassLayer, 'backdrop-filter', existingBackdrop || blurAmount);

        // Make host transparent so layer shows through, BUT keep text/content visible
        this.renderer.setStyle(this.el.nativeElement, 'background', 'transparent');
        this.renderer.setStyle(this.el.nativeElement, 'border-color', 'transparent');
        this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
        this.renderer.setStyle(this.el.nativeElement, 'backdrop-filter', 'none');

        // Ensure layer isn't clipped if filter expands it? 
        // SVG filters often get clipped. We set filter region to 100% and map to 100%. 
        // Usually fine for internal warping.
    }

    private createSvgFilter(width: number, height: number, mapUrl: string): SVGElement {
        const svgNs = 'http://www.w3.org/2000/svg';
        const svg = this.document.createElementNS(svgNs, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.setAttribute('style', 'position: absolute; top: -9999px; left: -9999px;');

        const filter = this.document.createElementNS(svgNs, 'filter');
        filter.setAttribute('id', this.filterId);
        filter.setAttribute('x', '0%');
        filter.setAttribute('y', '0%');
        filter.setAttribute('width', '100%');
        filter.setAttribute('height', '100%');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        const feImage = this.document.createElementNS(svgNs, 'feImage');
        feImage.setAttribute('href', mapUrl);
        feImage.setAttribute('result', 'displacement_map');

        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', `${width}`);
        filter.setAttribute('height', `${height}`);

        const feDisplace = this.document.createElementNS(svgNs, 'feDisplacementMap');
        feDisplace.setAttribute('in', 'SourceGraphic');
        feDisplace.setAttribute('in2', 'displacement_map');
        feDisplace.setAttribute('scale', this.refractionScale.toString());
        feDisplace.setAttribute('xChannelSelector', 'R');
        feDisplace.setAttribute('yChannelSelector', 'G');

        filter.appendChild(feImage);
        filter.appendChild(feDisplace);
        svg.appendChild(filter);

        return svg;
    }
}
