import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateOnScrollDirective } from '../../directives/animate-on-scroll.directive';

@Component({
    selector: 'app-services',
    imports: [AnimateOnScrollDirective, RouterLink],
    templateUrl: './services.component.html',
    styleUrl: './services.component.css'
})
export class ServicesComponent {

}
