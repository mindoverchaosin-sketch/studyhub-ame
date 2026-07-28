export type ProgressInsightsDTO = {
  readinessTrend: Array<{
    label: string
    value: number
  }>
  moduleCompletion: Array<{
    label: string
    value: number
  }>
  mockScoreTrend: Array<{
    label: string
    value: number
  }>
  studyActivity: Array<{
    label: string
    value: number
  }>
  topicMastery: Array<{
    label: string
    value: number
  }>
}
