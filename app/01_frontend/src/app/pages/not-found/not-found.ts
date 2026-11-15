import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
	imports: [Navbar, RouterLink],
	selector: 'app-not-found',
	styleUrl: './not-found.scss',
	templateUrl: './not-found.html',
})
export class NotFound {}
