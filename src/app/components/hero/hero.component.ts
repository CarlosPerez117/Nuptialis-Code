import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AnimateOnScrollDirective } from '../../directives/animate-on-scroll.directive';

@Component({
    selector: 'app-hero',
    imports: [AnimateOnScrollDirective],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.css'
})
export class HeroComponent implements AfterViewInit {
  @ViewChild('heroVideo') videoElement!: ElementRef<HTMLVideoElement>;

  ngAfterViewInit() {
    if (this.videoElement) {
      this.videoElement.nativeElement.muted = true;
      this.videoElement.nativeElement.play().catch(err => {
        console.log('Video autoplay failed:', err);
      });
    }
  }
}
