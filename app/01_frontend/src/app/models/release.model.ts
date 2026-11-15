
import { IgdbPlatform } from './platform.model';

export interface IgdbReleaseDate {
    id: number;
    date?: number;
    human?: string;
    platform?: IgdbPlatform;
    y?: number;
    m?: number;
}