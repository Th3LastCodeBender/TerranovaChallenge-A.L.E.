
import { IgdbImage } from './image.model';

export interface IgdbCompany {
    id: number;
    name: string;
    slug?: string;
    logo?: IgdbImage;
}

export interface IgdbInvolvedCompany {
    id: number;
    company: IgdbCompany;
    developer: boolean;
    publisher: boolean;
    porting: boolean;
    supporting: boolean;
}