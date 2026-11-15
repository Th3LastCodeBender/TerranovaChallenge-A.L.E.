import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface PcSpecs {
	cpu: string;
	gpu: string;
	ramGb: number;
	vramGb?: number;
	os: string;
}

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

	saveSpecs(specs: PcSpecs): Observable<SaveSpecsResponse> {
		return this.http.post<SaveSpecsResponse>(`${this.baseUrl}/add-specs`, specs);
	}

	deleteSpecs(): Observable<{ success: boolean }> {
		return this.http.delete<{ success: boolean }>(`${this.baseUrl}/delete-specs`);
	}
}
