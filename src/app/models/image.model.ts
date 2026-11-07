
export interface IgdbImage {
    id: number;
    image_id: string;
    width?: number;
    height?: number;
    alpha_channel?: boolean;
    animated?: boolean;
}

export type IgdbImageSize =
    | 'thumb'
    | 'cover_small'
    | 'cover_big'
    | 'screenshot_med'
    | 'screenshot_big'
    | 'screenshot_huge'
    | 'logo_med'
    | '720p'
    | '1080p';

export function igdbImageUrl(imageId: string, size: IgdbImageSize = 'cover_big'): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export function igdbUrlImage(imageId: string, size: IgdbImageSize = 'cover_big'): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export interface IgdbVideo {
    id: number;
    name?: string;
    video_id: string;
}
