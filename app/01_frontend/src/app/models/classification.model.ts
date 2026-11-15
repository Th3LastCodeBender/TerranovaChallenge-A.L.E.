
export interface IgdbNamedEntity {
    id: number;
    name: string;
    slug?: string;
    url?: string;
}

export type IgdbGenre = IgdbNamedEntity;

export type IgdbTheme = IgdbNamedEntity;

export type IgdbGameMode = IgdbNamedEntity;

export type IgdbPlayerPerspective = IgdbNamedEntity;

export type IgdbKeyword = IgdbNamedEntity;

export type IgdbFranchise = IgdbNamedEntity;

export type IgdbCollection = IgdbNamedEntity;

export interface IgdbGameType {
    id: number;
    type: string;
}