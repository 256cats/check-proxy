import { IGetOptions, IGetResolve } from './interfaces.d';
export default function (): {
    abortAllRequests: () => void;
    get: (url: string, options: IGetOptions) => Promise<IGetResolve>;
};
