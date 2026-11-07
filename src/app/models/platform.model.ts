import { IgdbImage } from './image.model';

export interface IgdbPlatform {
    id: number;
    name: string;
    abbreviation?: string;
    slug?: string;
    platform_logo?: IgdbImage;
    platform_family?: number;
}

export type PlatformFamily = 'PlayStation' | 'Xbox' | 'PC' | 'Nintendo';

/** Raggruppa una piattaforma specifica ("PlayStation 5", "Xbox Series X|S"...) nella sua famiglia */
export function platformFamily(p: IgdbPlatform): PlatformFamily | null {
    if (p.name.startsWith('PlayStation')) return 'PlayStation';
    if (p.name.startsWith('Xbox')) return 'Xbox';
    if (p.name.startsWith('Nintendo')) return 'Nintendo';
    if (p.abbreviation === 'PC' || p.name.startsWith('PC')) return 'PC';
    return null;
}
