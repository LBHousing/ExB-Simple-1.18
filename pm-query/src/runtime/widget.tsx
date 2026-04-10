/** @jsx jsx */
import {
  React,
  jsx,
  css,
  type AllWidgetProps,
  DataSourceManager,
  type FeatureLayerDataSource,
  hooks
} from 'jimu-core'
import {
  Button,
  Select,
  Option,
  TextInput,
  Label,
  Alert,
  Loading,
  LoadingType
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
  background: var(--ref-palette-white);
  overflow: hidden;

  .pmq-header {
    background: #0a0e1a;
    color: #f1f5f9;
    padding: 14px 16px 10px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .pmq-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
      color: var(--ref-palette-neutral-1000);
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
    gap: 6px;
    background: rgba(39,106,219,0.1);
    border: 1px solid rgba(39,106,219,0.25);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    color: #276ADB;
    font-weight: 600;
  }

  .pmq-actions {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px;
    flex-shrink: 0;
  }

  .pmq-result {
    margin: 0 16px 16px;
    border: 1px solid var(--ref-palette-neutral-300);
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;

    .pmq-result-header {
      background: #276ADB;
      color: white;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 600;
    }

    .pmq-result-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .pmq-result-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      border-bottom: 1px solid var(--ref-palette-neutral-200);
      padding-bottom: 5px;

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .pmq-field-label {
        color: var(--ref-palette-neutral-700);
        font-weight: 500;
        flex: 0 0 40%;
      }

      .pmq-field-value {
        color: var(--ref-palette-neutral-1100);
        text-align: right;
        flex: 1;
        word-break: break-word;
      }
    }

    .pmq-point-count {
      margin-top: 8px;
      font-size: 11px;
      color: var(--ref-palette-neutral-600);
      text-align: right;
    }
  }

  .pmq-alert {
    margin: 0 16px 12px;
    flex-shrink: 0;
  }
`

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultCard {
  fields: Array<{ label: string; value: string }>
  pointCount: number
  route: string
  county: string
  beginPM: string
  endPM: string
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const { config, id } = props
  const getI18nMessage = hooks.useTranslation(defaultMessages)

  // Form state
  const [county, setCounty] = React.useState('')
  const [route, setRoute] = React.useState('')
  const [beginPM, setBeginPM] = React.useState('')
  const [endPM, setEndPM] = React.useState('')

  // County dropdown options
  const [countyOptions, setCountyOptions] = React.useState<string[]>([])
  const [loadingCounties, setLoadingCounties] = React.useState(false)

  // Query state
  const [searching, setSearching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<ResultCard | null>(null)

  // Map view ref
  const jimuMapViewRef = React.useRef<JimuMapView | null>(null)
  const graphicsLayerRef = React.useRef<__esri.GraphicsLayer | null>(null)

  // ── Load county options from layer on mount ────────────────────────────────
  React.useEffect(() => {
    if (!config.useDataSource?.dataSourceId) return
    const ds = DataSourceManager.getInstance().getDataSource(
      config.useDataSource.dataSourceId
    ) as FeatureLayerDataSource
    if (!ds) return

    setLoadingCounties(true)
    ds.load().then(() => {
      const layer = (ds as any).layer as __esri.FeatureLayer
      if (!layer) { setLoadingCounties(false); return }

      layer.queryFeatures({
        where: `DISTRICT = '${DISTRICT}'`,
        outFields: ['COUNTY'],
        returnDistinctValues: true,
        orderByFields: ['COUNTY ASC']
      }).then((result) => {
        const counties = result.features
          .map(f => f.attributes.COUNTY as string)
          .filter(Boolean)
          .sort()
        setCountyOptions(counties)
        setLoadingCounties(false)
      }).catch(() => setLoadingCounties(false))
    }).catch(() => setLoadingCounties(false))
  }, [config.useDataSource?.dataSourceId])

  // ── Map view handler ───────────────────────────────────────────────────────
  const handleActiveViewChange = React.useCallback((jimuMapView: JimuMapView) => {
    jimuMapViewRef.current = jimuMapView
  }, [])

  // ── Ensure graphics layer exists on map ────────────────────────────────────
  const ensureGraphicsLayer = React.useCallback(async (): Promise<__esri.GraphicsLayer> => {
    const mapView = jimuMapViewRef.current?.view
    if (!mapView) return null

    if (graphicsLayerRef.current) return graphicsLayerRef.current

    const [GraphicsLayer] = await loadArcGISJSAPIModules(['esri/layers/GraphicsLayer'])
    const layer = new GraphicsLayer({
      id: GRAPHICS_LAYER_ID,
      title: 'PMQuery Route',
      listMode: 'hide'
    })
    mapView.map.add(layer)
    graphicsLayerRef.current = layer
    return layer
  }, [])

  // ── Clear previous line from map ───────────────────────────────────────────
  const clearLine = React.useCallback(() => {
    if (graphicsLayerRef.current) {
      graphicsLayerRef.current.removeAll()
    }
  }, [])

  // ── Draw polyline through sorted points ────────────────────────────────────
  const drawLine = React.useCallback(async (features: __esri.Graphic[]) => {
    const mapView = jimuMapViewRef.current?.view
    if (!mapView || features.length < 2) return

    const [Graphic, Polyline] = await loadArcGISJSAPIModules([
      'esri/Graphic',
      'esri/geometry/Polyline'
    ])

    const layer = await ensureGraphicsLayer()
    if (!layer) return

    layer.removeAll()

    // Build path from point geometries sorted by PM
    const path = features.map(f => {
      const pt = f.geometry as __esri.Point
      return [pt.x, pt.y]
    })

    const polyline = new Polyline({
      paths: [path],
      spatialReference: features[0].geometry.spatialReference
    })

    const lineGraphic = new Graphic({
      geometry: polyline,
      symbol: {
        type: 'simple-line',
        color: config.lineColor || '#FF6B00',
        width: config.lineWidth || 5,
        style: 'solid',
        cap: 'round',
        join: 'round'
      }
    })

    // Start point marker
    const startGraphic = new Graphic({
      geometry: features[0].geometry,
      symbol: {
        type: 'simple-marker',
        color: '#34d399',
        size: 10,
        outline: { color: 'white', width: 1.5 }
      }
    })

    // End point marker
    const endGraphic = new Graphic({
      geometry: features[features.length - 1].geometry,
      symbol: {
        type: 'simple-marker',
        color: '#D2333F',
        size: 10,
        outline: { color: 'white', width: 1.5 }
      }
    })

    layer.addMany([lineGraphic, startGraphic, endGraphic])

    // Zoom to the line extent with padding
    await mapView.goTo({
      target: polyline,
      zoom: undefined
    }, { animate: true, duration: 800 })
  }, [config.lineColor, config.lineWidth, ensureGraphicsLayer])

  // ── Execute query ──────────────────────────────────────────────────────────
  const handleSearch = React.useCallback(async () => {
    setError(null)
    setResult(null)
    clearLine()

    if (!config.useDataSource?.dataSourceId) {
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
      const ds = DataSourceManager.getInstance().getDataSource(
        config.useDataSource.dataSourceId
      ) as FeatureLayerDataSource

      await ds.load()
      const layer = (ds as any).layer as __esri.FeatureLayer
      if (!layer) throw new Error('Layer not available')

      const where = [
        `DISTRICT = '${DISTRICT}'`,
        `COUNTY = '${county.replace(/'/g, "''")}'`,
        `ROUTE = '${route.replace(/'/g, "''")}'`,
        `PM >= ${bPM}`,
        `PM <= ${ePM}`
      ].join(' AND ')

      const queryResult = await layer.queryFeatures({
        where,
        outFields: ['*'],
        returnGeometry: true,
        orderByFields: ['PM ASC']
      })

      if (!queryResult.features || queryResult.features.length === 0) {
        setError(getI18nMessage('noResults'))
        setSearching(false)
        return
      }

      const features = queryResult.features
      const first = features[0].attributes
      const last = features[features.length - 1].attributes

      // Build result card — all fields from first feature except PM
      // PM becomes "beginPM - endPM"
      const fieldEntries = Object.entries(first)
        .filter(([key]) => key !== 'PM' && key !== 'OBJECTID' && key !== 'FID')
        .map(([key, value]) => ({
          label: key,
          value: value != null ? String(value) : '—'
        }))

      // Insert merged PM row at top
      const pmEntry = {
        label: 'PM',
        value: `${first.PM} – ${last.PM}`
      }

      setResult({
        fields: [pmEntry, ...fieldEntries],
        pointCount: features.length,
        route: String(first.ROUTE ?? route),
        county: String(first.COUNTY ?? county),
        beginPM: String(first.PM),
        endPM: String(last.PM)
      })

      await drawLine(features)
    } catch (err) {
      setError(getI18nMessage('errorQuery'))
      console.error('[PMQuery]', err)
    }

    setSearching(false)
  }, [config.useDataSource, county, route, beginPM, endPM, clearLine, drawLine, getI18nMessage])

  // ── Clear handler ──────────────────────────────────────────────────────────
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
  return (
    <div css={widgetStyle}>
      {/* Hidden map view connector */}
      {config.mapWidgetId && (
        <JimuMapViewComponent
          useMapWidgetId={config.mapWidgetId}
          onActiveViewChange={handleActiveViewChange}
        />
      )}

      <div className='pmq-header'>PMQuery — District {DISTRICT}</div>

      <div className='pmq-body'>
        {/* District badge */}
        <div className='pmq-field'>
          <label>{getI18nMessage('district')}</label>
          <div className='pmq-district-badge'>
            District {DISTRICT} — Fixed
          </div>
        </div>

        {/* County dropdown */}
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
            onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
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
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
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
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='pmq-actions'>
        <Button
          type='primary'
          size='sm'
          onClick={handleSearch}
          disabled={searching || !county || !route || !beginPM || !endPM}
          css={css`flex: 1;`}
        >
          {searching
            ? <><Loading type={LoadingType.Donut} width={14} css={css`margin-right:6px;`} />{getI18nMessage('searching')}</>
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

      {/* Error */}
      {error && (
        <div className='pmq-alert'>
          <Alert
            type='warning'
            closable
            onClose={() => setError(null)}
            text={error}
          />
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className='pmq-result'>
          <div className='pmq-result-header'>
            Route {result.route} — {result.county} County
          </div>
          <div className='pmq-result-body'>
            {result.fields.map((f, i) => (
              <div key={i} className='pmq-result-row'>
                <span className='pmq-field-label'>{f.label}</span>
                <span className='pmq-field-value'>{f.value}</span>
              </div>
            ))}
            <div className='pmq-point-count'>
              {result.pointCount} postmile points connected
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

Widget.versionManager = versionManager
