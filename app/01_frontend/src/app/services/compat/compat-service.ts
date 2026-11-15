import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Resolution = '1080p' | '1440p' | '4k';
export const RESOLUTIONS: Resolution[] = ['1080p', '1440p', '4k'];

export interface HardwareModel {
	original: string;
	model: string;
	estimated: boolean;
}

export interface RequirementTier {
	os: string | null;
	cpuModels: HardwareModel[];
	cpuGhz: number | null;
	cpuCores: number | null;
	gpuModels: HardwareModel[];
	vramGb: number | null;
	ramGb: number | null;
	directx: number | null;
}

export interface GameRequirements {
	minimum: RequirementTier | null;
	recommended: RequirementTier | null;
}

export type CheckStatus = 'pass' | 'fail' | 'unknown';

export interface ComponentCheck {
	status: CheckStatus;
	have: number | null;
	need: number | null;
	estimated: boolean;
}

export interface TierCheck {
	status: CheckStatus;
	cpu: ComponentCheck;
	gpu: ComponentCheck;
	ramGb: ComponentCheck;
	vramGb: ComponentCheck;
}

export type Verdict = 'recommended' | 'minimum' | 'cannot-run' | 'unknown';

export interface CompatResult {
	verdict: Verdict;
	minimum: TierCheck | null;
	recommended: TierCheck | null;
	osWarning: { have: string; need: string } | null;
}

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface FpsCell {
	preset: QualityPreset;
	resolution: Resolution;
	fps: number;
	band: string;
	limitedBy: 'gpu' | 'cpu' | 'cap';
}

export interface FpsEstimate {
	basedOn: 'recommended' | 'minimum';
	cells: FpsCell[];
	summary: { preset: QualityPreset; resolution: Resolution; fps: number; band: string } | null;
}

export interface CanIRunResponse {
	steamAppId: number;
	requirements: GameRequirements;
	compat: CompatResult;
	fps: FpsEstimate | null;
}

@Injectable({
	providedIn: 'root'
})
export class CompatService {
	private http = inject(HttpClient);

	canIRun(gameId: number, resolution: Resolution): Observable<CanIRunResponse> {
		const params = new HttpParams()
			.set('gameId', gameId)
			.set('resolution', resolution);
		return this.http.get<CanIRunResponse>('/api/compat/can-i-run', { params });
	}
}
