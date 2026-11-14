import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

// Forma delle specifiche salvate in WG_User.pcSpecs
export interface PcSpecs {
	cpu: string;
	gpu: string;
	ramGb: number;
	vramGb?: number;
	os: string;
}

// Risposta di POST /api/specs/add-specs: indica se CPU/GPU sono nel database dei benchmark
export interface SaveSpecsResponse {
	specs: PcSpecs;
	recognized: { cpu: boolean; gpu: boolean };
}

@Injectable({
	providedIn: 'root'
})
export class SpecsService {
	private http = inject(HttpClient);
	private baseUrl = '/api/specs';

	getSpecs(): Observable<PcSpecs | null> {
		return this.http.get<{ specs: PcSpecs | null }>(`${this.baseUrl}/get-specs`)
			.pipe(map(res => res.specs));
	}

	// add-specs sovrascrive le specifiche esistenti: vale sia per creare che per modificare
	saveSpecs(specs: PcSpecs): Observable<SaveSpecsResponse> {
		return this.http.post<SaveSpecsResponse>(`${this.baseUrl}/add-specs`, specs);
	}

	deleteSpecs(): Observable<{ success: boolean }> {
		return this.http.delete<{ success: boolean }>(`${this.baseUrl}/delete-specs`);
	}
}
