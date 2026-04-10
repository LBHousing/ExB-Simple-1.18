import type { ImmutableObject, UseDataSource } from 'jimu-core'

export interface Config {
  useDataSource?: UseDataSource
  mapWidgetId?: string
  lineColor: string
  lineWidth: number
}

export type IMConfig = ImmutableObject<Config>
