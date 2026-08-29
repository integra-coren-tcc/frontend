export interface InspectorGoal {
    id: string
    month: number
    year: number
    targetCount: number
}

export interface MonthProgress {
    month: number
    targetCount: number
    completedCount: number
}

export interface GoalProgressResponse {
    year: number
    months: MonthProgress[]
}
