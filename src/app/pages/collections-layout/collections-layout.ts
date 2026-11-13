import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { COLLECTIONS, CollectionSlug } from '../../services/collections/collections-service';

@Component({
	selector: 'app-collections-layout',
	imports: [Navbar, RouterLink, RouterLinkActive, RouterOutlet],
	templateUrl: './collections-layout.html',
	styleUrl: './collections-layout.scss',
})
export class CollectionsLayout {
	readonly collections = COLLECTIONS;
	readonly slugs = Object.keys(COLLECTIONS) as CollectionSlug[];
}
