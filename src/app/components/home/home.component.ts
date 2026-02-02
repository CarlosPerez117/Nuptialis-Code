import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../hero/hero.component';
import { AnimateOnScrollDirective } from '../../directives/animate-on-scroll.directive';

@Component({
    selector: 'app-home',
    imports: [HeroComponent, RouterLink, AnimateOnScrollDirective],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {

}
