import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-legal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './legal.component.html',
    styleUrl: './legal.component.css'
})
export class LegalComponent implements OnInit {
    pageType: string = '';

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.route.url.subscribe(url => {
            this.pageType = url[0].path;
        });
    }
}
