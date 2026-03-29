export interface ScoreBreakdown {
    headline: number;
    about: number;
    experience: number;
    completeness: number;
    overall: number;
}
export declare function calculateScore(profile: any, ai: any): ScoreBreakdown;
export declare function capAfterScore(beforeScore: number, rawAfterScore: number): number;
