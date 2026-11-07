
import { IgdbGame } from './game.model';

export interface IgdbMultiqueryResult<T = IgdbGame> {
    name: string;
    result: T[];
}