export type AdminDashboardCardDTO = {
  title: string
  value: number | string
  description?: string
  accent: 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'slate'
}

export type AdminDashboardSectionDTO = {
  title: string
  label: string
  value: number | string
  description?: string
}

export type AdminDashboardDTO = {
  summaryCards: AdminDashboardCardDTO[]
  sections: {
    overview: AdminDashboardSectionDTO[]
    learning: AdminDashboardSectionDTO[]
    students: AdminDashboardSectionDTO[]
    content: AdminDashboardSectionDTO[]
    system: AdminDashboardSectionDTO[]
    quickActions: AdminDashboardSectionDTO[]
  }
  health: {
    status: string
    version: string
    database: string
    cache: string
    application: string
  }
}
