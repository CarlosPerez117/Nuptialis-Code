import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    imports: [CommonModule],
    templateUrl: './loader.component.html',
    styleUrl: './loader.component.css'
})
export class LoaderComponent implements OnInit {
  isLoading = true;

  ngOnInit() {
    // Simulate loading time (e.g., 2.5 seconds to match animation)
    setTimeout(() => {
      this.isLoading = false;
    }, 2800);
  }
}
