/** @jsx jsx */
import {
  React,
  jsx,
  css,
  Immutable,
  type UseDataSource
} from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import {
  DataSourceSelector,
  AllDataSourceTypes
} from 'jimu-ui/advanced/data-source-selector'
import {
  MapWidgetSelector,
  SettingRow,
  SettingSection
} from 'jimu-ui/advanced/setting-components'
import { NumericInput, Label } from 'jimu-ui'
import { ThemeColorPicker } from 'jimu-ui/basic/color-picker'
import { type IMConfig } from '../config'
import defaultMessages from './translations/default'
import { hooks } from 'jimu-core'

// Only FeatureLayer type is relevant for postmile points
const SUPPORTED_DS_TYPES = Immutable([AllDataSourceTypes.FeatureLayer])

export default function Setting (props: AllWidgetSettingProps<IMConfig>) {
  const { config, onSettingChange, id } = props
  const getI18nMessage = hooks.useTranslation(defaultMessages)

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    onSettingChange({
      id,
      config: config.set('useDataSource', useDataSources?.[0] ?? null)
    })
  }

  const onMapWidgetSelected = (ids: string[]) => {
    onSettingChange({
      id,
      config: config.set('mapWidgetId', ids?.[0] ?? null)
    })
  }

  const onLineColorChange = (color: string) => {
    onSettingChange({
      id,
      config: config.set('lineColor', color)
    })
  }

  const onLineWidthChange = (value: number) => {
    onSettingChange({
      id,
      config: config.set('lineWidth', value)
    })
  }

  return (
    <div css={css`height: 100%; overflow-y: auto;`}>
      {/* Data source */}
      <SettingSection
        title={getI18nMessage('dataSource')}
      >
        <SettingRow>
          <div css={css`font-size: 12px; color: var(--ref-palette-neutral-800); margin-bottom: 8px;`}>
            {getI18nMessage('dataSourceHint')}
          </div>
        </SettingRow>
        <SettingRow>
          <DataSourceSelector
            types={SUPPORTED_DS_TYPES}
            useDataSources={config.useDataSource ? Immutable([config.useDataSource]) : Immutable([])}
            onChange={onDataSourceChange}
            widgetId={id}
            mustUseDataSource
          />
        </SettingRow>
      </SettingSection>

      {/* Map widget */}
      <SettingSection
        title={getI18nMessage('mapWidget')}
      >
        <SettingRow>
          <div css={css`font-size: 12px; color: var(--ref-palette-neutral-800); margin-bottom: 8px;`}>
            {getI18nMessage('mapWidgetHint')}
          </div>
        </SettingRow>
        <SettingRow>
          <MapWidgetSelector
            onSelect={onMapWidgetSelected}
            useMapWidgetIds={config.mapWidgetId ? Immutable([config.mapWidgetId]) : Immutable([])}
          />
        </SettingRow>
      </SettingSection>

      {/* Line style */}
      <SettingSection
        title={getI18nMessage('lineStyle')}
      >
        <SettingRow label={getI18nMessage('lineColor')}>
          <ThemeColorPicker
            value={config.lineColor || '#FF6B00'}
            onChange={onLineColorChange}
            specificTheme={null}
          />
        </SettingRow>
        <SettingRow label={getI18nMessage('lineWidth')}>
          <NumericInput
            value={config.lineWidth ?? 5}
            min={1}
            max={20}
            step={1}
            showHandlers
            onChange={onLineWidthChange}
            css={css`width: 80px;`}
          />
        </SettingRow>
      </SettingSection>
    </div>
  )
}
