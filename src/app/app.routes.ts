import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ServicesComponent } from './components/services/services.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';

import { LegalComponent } from './components/legal/legal.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'servicios', component: ServicesComponent },
    { path: 'nosotros', component: AboutComponent },
    { path: 'contacto', component: ContactComponent },
    { path: 'aviso-legal', component: LegalComponent },
    { path: 'privacidad', component: LegalComponent },
    { path: 'cookies', component: LegalComponent },
    { path: '**', redirectTo: '' }
];
