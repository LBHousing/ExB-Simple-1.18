/** @jsx jsx */
import {
  React,
  jsx,
  css,
  type AllWidgetProps,
  DataSourceComponent,
  type FeatureLayerDataSource,
  hooks
} from 'jimu-core'
import {
  Button,
  Select,
  Option,
  TextInput,
  Alert,
  Loading,
  LoadingType,
  Paper,
  WidgetPlaceholder
} from 'jimu-ui'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { type IMConfig } from '../config'
import { versionManager } from '../version-manager'
import defaultMessages from './translations/default'

// ─── Constants ────────────────────────────────────────────────────────────────

const DISTRICT = '2'
const GRAPHICS_LAYER_ID = 'pmquery-route-line'

// ─── Styles ───────────────────────────────────────────────────────────────────

const widgetStyle = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .pmq-header {
    padding: 6px 16px;
    border-bottom: 1px solid var(--sys-color-divider-secondary);
    background-color: var(--sys-color-surface);
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--sys-color-text-primary);
    }
  }

  .pmq-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: var(--sys-color-surface-paper);
  }

  .pmq-field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--sys-color-text-primary);
    }
  }

  .pmq-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .pmq-district-badge {
    display: inline-flex;
    align-items: center;
    background-color: var(--sys-color-action-selected, rgba(0,121,193,0.08));
    border: 1px solid var(--sys-color-primary-main, #0079c1);
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
    color: var(--sys-color-primary-main, #0079c1);
    font-weight: 600;
  }

  .pmq-actions {
    display: flex;
    gap: 8px;
    padding: 8px 16px 12px;
    background-color: var(--sys-color-surface-paper);
    border-top: 1px solid var(--sys-color-divider-secondary);
    flex-shrink: 0;
  }

  .pmq-result {
    border: 1px solid var(--sys-color-divider-secondary);
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--sys-color-surface-paper);

    .pmq-result-header {
      background-color: var(--sys-color-primary-main, #0079c1);
      color: #fff;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
    }

    .pmq-result-body {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
    }

    .pmq-result-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      border-bottom: 1px solid var(--sys-color-divider-secondary);
      padding: 5px 0;

      &:last-child {
        border-bottom: none;
      }

      .pmq-field-label {
        color: var(--sys-color-surface-paper-hint, #666);
        font-weight: 500;
        flex: 0 0 40%;
      }

      .pmq-field-value {
        color: var(--sys-color-surface-paper-text, #333);
        text-align: right;
        flex: 1;
        word-break: break-word;
      }
    }

    .pmq-point-count {
      margin-top: 8px;
      font-size: 11px;
      color: var(--sys-color-text-tertiary);
      text-align: right;
    }
  }

  .pmq-footer {
    padding: 4px 12px;
    border-top: 1px solid var(--sys-color-divider-secondary);
    background-color: var(--sys-color-surface-paper);
    flex-shrink: 0;
    text-align: center;

    span {
      font-size: 0.75rem;
      color: var(--sys-color-text-tertiary);
      font-weight: 400;
      letter-spacing: 0.025em;
    }
  }
`

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultCard {
  fields: Array<{ label: string; value: string }>
  pointCount: number
  route: string
  county: string
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const { config, id, label, intl } = props
  const getI18nMessage = hooks.useTranslation(defaultMessages)

  const widgetLabel = intl.formatMessage({
    id: '_widgetLabel',
    defaultMessage: defaultMessages._widgetLabel
  })

  // ── Data source — stored when DataSourceComponent signals it is ready ──────
  const dsRef = React.useRef<FeatureLayerDataSource | null>(null)

  // Form state
  const [county, setCounty] = React.useState('')
  const [route, setRoute] = React.useState('')
  const [beginPM, setBeginPM] = React.useState('')
  const [endPM, setEndPM] = React.useState('')

  // County dropdown
  const [countyOptions, setCountyOptions] = React.useState<string[]>([])
  const [loadingCounties, setLoadingCounties] = React.useState(false)

  // Query state
  const [searching, setSearching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<ResultCard | null>(null)

  // Map view ref
  const jimuMapViewRef = React.useRef<JimuMapView | null>(null)
  const graphicsLayerRef = React.useRef<__esri.GraphicsLayer | null>(null)

  // ── DataSourceComponent callback — fires when DS is ready ──────────────────
  // This is the correct pattern from query-simple: never call ds.load() manually.
  const handleDataSourceCreated = React.useCallback(async (ds: FeatureLayerDataSource) => {
    dsRef.current = ds

    // Get the real FeatureLayer using query-simple's proven pattern:
    // getOriginDataSources()[0] → createJSAPILayerByDataSource() → load()
    try {
      const originDS = ds.getOriginDataSources()[0] as FeatureLayerDataSource
      if (!originDS) return

      const featureLayer = await originDS.createJSAPILayerByDataSource() as __esri.FeatureLayer
      await featureLayer.load()

      setLoadingCounties(true)
      const qResult = await featureLayer.queryFeatures({
        where: `DISTRICT = '${DISTRICT}'`,
        outFields: ['COUNTY'],
        returnDistinctValues: true,
        orderByFields: ['COUNTY ASC']
      })

      const counties = qResult.features
        .map(f => f.attributes.COUNTY as string)
        .filter(Boolean)
        .sort()
      setCountyOptions(counties)
    } catch (e) {
      console.error('[PMQuery] county load failed', e)
    } finally {
      setLoadingCounties(false)
    }
  }, [])

  // ── Map view handler ───────────────────────────────────────────────────────
  const handleActiveViewChange = React.useCallback((jimuMapView: JimuMapView) => {
    jimuMapViewRef.current = jimuMapView
  }, [])

  // ── Ensure graphics layer on map ───────────────────────────────────────────
  const ensureGraphicsLayer = React.useCallback(async (): Promise<__esri.GraphicsLayer | null> => {
    const mapView = jimuMapViewRef.current?.view
    if (!mapView) return null

    const existing = mapView.map.findLayerById(GRAPHICS_LAYER_ID) as __esri.GraphicsLayer
    if (existing) {
      graphicsLayerRef.current = existing
      return existing
    }

    const [GraphicsLayer] = await loadArcGISJSAPIModules(['esri/layers/GraphicsLayer'])
    const layer = new GraphicsLayer({ id: GRAPHICS_LAYER_ID, title: 'PMQuery Route', listMode: 'hide' })
    mapView.map.add(layer)
    graphicsLayerRef.current = layer
    return layer
  }, [])

  // ── Clear graphics ─────────────────────────────────────────────────────────
  const clearLine = React.useCallback(() => {
    graphicsLayerRef.current?.removeAll()
  }, [])

  // ── Draw polyline through PM-sorted points ─────────────────────────────────
  const drawLine = React.useCallback(async (features: __esri.Graphic[]) => {
    if (!jimuMapViewRef.current?.view || features.length < 2) return

    const [Graphic, Polyline] = await loadArcGISJSAPIModules(['esri/Graphic', 'esri/geometry/Polyline'])
    const layer = await ensureGraphicsLayer()
    if (!layer) return

    layer.removeAll()

    const path = features.map(f => {
      const pt = f.geometry as __esri.Point
      return [pt.x, pt.y]
    })

    const polyline = new Polyline({ paths: [path], spatialReference: features[0].geometry.spatialReference })

    layer.addMany([
      new Graphic({
        geometry: polyline,
        symbol: { type: 'simple-line', color: config.lineColor || '#FF6B00', width: config.lineWidth ?? 5, style: 'solid', cap: 'round', join: 'round' }
      }),
      new Graphic({
        geometry: features[0].geometry,
        symbol: { type: 'simple-marker', color: '#34d399', size: 10, outline: { color: 'white', width: 1.5 } }
      }),
      new Graphic({
        geometry: features[features.length - 1].geometry,
        symbol: { type: 'simple-marker', color: '#D2333F', size: 10, outline: { color: 'white', width: 1.5 } }
      })
    ])

    await jimuMapViewRef.current.view.goTo({ target: polyline }, { animate: true, duration: 800 })
  }, [config.lineColor, config.lineWidth, ensureGraphicsLayer])

  // ── Execute query ──────────────────────────────────────────────────────────
  // Uses query-simple's proven pattern: getOriginDataSources()[0] →
  // createJSAPILayerByDataSource() → queryFeatures() directly. No ds.load().
  const handleSearch = React.useCallback(async () => {
    setError(null)
    setResult(null)
    clearLine()

    if (!dsRef.current) {
      setError(getI18nMessage('errorNoLayer'))
      return
    }
    if (!jimuMapViewRef.current) {
      setError(getI18nMessage('errorNoMap'))
      return
    }
    if (!county || !route || !beginPM || !endPM) {
      setError('Please fill in all fields.')
      return
    }
    const bPM = parseFloat(beginPM)
    const ePM = parseFloat(endPM)
    if (isNaN(bPM) || isNaN(ePM) || bPM >= ePM) {
      setError(getI18nMessage('errorFields'))
      return
    }

    setSearching(true)

    try {
      const originDS = dsRef.current.getOriginDataSources()[0] as FeatureLayerDataSource
      const featureLayer = await originDS.createJSAPILayerByDataSource() as __esri.FeatureLayer
      await featureLayer.load()

      const where = [
        `DISTRICT = '${DISTRICT}'`,
        `COUNTY = '${county.replace(/'/g, "''")}'`,
        `ROUTE = '${route.replace(/'/g, "''")}'`,
        `PM >= ${bPM}`,
        `PM <= ${ePM}`
      ].join(' AND ')

      const queryResult = await featureLayer.queryFeatures({
        where,
        outFields: ['*'],
        returnGeometry: true,
        orderByFields: ['PM ASC']
      })

      if (!queryResult.features?.length) {
        setError(getI18nMessage('noResults'))
        setSearching(false)
        return
      }

      const features = queryResult.features
      const first = features[0].attributes
      const last = features[features.length - 1].attributes

      const fieldEntries = Object.entries(first)
        .filter(([key]) => key !== 'PM' && key !== 'OBJECTID' && key !== 'FID')
        .map(([key, value]) => ({ label: key, value: value != null ? String(value) : '—' }))

      setResult({
        fields: [{ label: 'PM', value: `${first.PM} – ${last.PM}` }, ...fieldEntries],
        pointCount: features.length,
        route: String(first.ROUTE ?? route),
        county: String(first.COUNTY ?? county)
      })

      await drawLine(features)
    } catch (err) {
      setError(getI18nMessage('errorQuery'))
      console.error('[PMQuery]', err)
    }

    setSearching(false)
  }, [county, route, beginPM, endPM, clearLine, drawLine, getI18nMessage])

  // ── Clear ──────────────────────────────────────────────────────────────────
  const handleClear = React.useCallback(() => {
    setCounty('')
    setRoute('')
    setBeginPM('')
    setEndPM('')
    setError(null)
    setResult(null)
    clearLine()
  }, [clearLine])

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!config.useDataSource?.dataSourceId) {
    return <WidgetPlaceholder widgetId={id} name={widgetLabel} />
  }

  return (
    <Paper variant='flat' className='jimu-widget runtime-pmquery' css={widgetStyle}>
      {/* DataSourceComponent manages the DS lifecycle — same pattern as query-simple.
          Never call ds.load() manually; wait for onDataSourceCreated. */}
      <DataSourceComponent
        useDataSource={config.useDataSource}
        onDataSourceCreated={handleDataSourceCreated}
      />

      {/* Map view connector */}
      {config.mapWidgetId && (
        <JimuMapViewComponent
          useMapWidgetId={config.mapWidgetId}
          onActiveViewChange={handleActiveViewChange}
        />
      )}

      {/* Header — matches query-simple widget-header */}
      <div className='pmq-header'>
        <h3>{label || widgetLabel}</h3>
      </div>

      {/* Scrollable body */}
      <div className='pmq-body'>
        {/* District — fixed */}
        <div className='pmq-field'>
          <label>{getI18nMessage('district')}</label>
          <div className='pmq-district-badge'>District {DISTRICT} — Fixed</div>
        </div>

        {/* County */}
        <div className='pmq-field'>
          <label>{getI18nMessage('county')}</label>
          <Select
            value={county}
            onChange={e => setCounty(e.target.value)}
            disabled={loadingCounties || searching}
            size='sm'
          >
            <Option value=''>
              {loadingCounties ? getI18nMessage('loadingCounties') : '— Select County —'}
            </Option>
            {countyOptions.map(c => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        </div>

        {/* Route */}
        <div className='pmq-field'>
          <label>{getI18nMessage('route')}</label>
          <TextInput
            size='sm'
            value={route}
            onChange={e => setRoute(e.target.value)}
            placeholder='e.g. 1, 101, 405'
            disabled={searching}
            onKeyDown={e => { if (e.key === 'Enter') void handleSearch() }}
          />
        </div>

        {/* Begin / End PM */}
        <div className='pmq-row'>
          <div className='pmq-field'>
            <label>{getI18nMessage('beginPM')}</label>
            <TextInput
              size='sm'
              type='number'
              value={beginPM}
              onChange={e => setBeginPM(e.target.value)}
              placeholder='0.00'
              disabled={searching}
              onKeyDown={e => { if (e.key === 'Enter') void handleSearch() }}
            />
          </div>
          <div className='pmq-field'>
            <label>{getI18nMessage('endPM')}</label>
            <TextInput
              size='sm'
              type='number'
              value={endPM}
              onChange={e => setEndPM(e.target.value)}
              placeholder='0.00'
              disabled={searching}
              onKeyDown={e => { if (e.key === 'Enter') void handleSearch() }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert
            type='warning'
            closable
            onClose={() => setError(null)}
            text={error}
            css={css`width: 100%;`}
          />
        )}

        {/* Result card */}
        {result && (
          <div className='pmq-result'>
            <div className='pmq-result-header'>
              {getI18nMessage('resultTitle')
                .replace('{ROUTE}', result.route)
                .replace('{COUNTY}', result.county)}
            </div>
            <div className='pmq-result-body'>
              {result.fields.map((f, i) => (
                <div key={i} className='pmq-result-row'>
                  <span className='pmq-field-label'>{f.label}</span>
                  <span className='pmq-field-value'>{f.value}</span>
                </div>
              ))}
              <div className='pmq-point-count'>
                {getI18nMessage('pointCount').replace('{count}', String(result.pointCount))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions — pinned above footer */}
      <div className='pmq-actions'>
        <Button
          type='primary'
          size='sm'
          onClick={() => void handleSearch()}
          disabled={searching || !county || !route || !beginPM || !endPM}
          css={css`flex: 1;`}
        >
          {searching
            ? <><Loading type={LoadingType.Donut} width={14} css={css`margin-right: 6px;`} />{getI18nMessage('searching')}</>
            : getI18nMessage('search')
          }
        </Button>
        <Button
          type='secondary'
          size='sm'
          onClick={handleClear}
          disabled={searching}
        >
          {getI18nMessage('clear')}
        </Button>
      </div>

      {/* Footer — matches query-simple stationary footer */}
      <div className='pmq-footer'>
        <span>PMQuery — District {DISTRICT}</span>
      </div>
    </Paper>
  )
}

Widget.versionManager = versionManager
