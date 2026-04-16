/**
 * HighlightConfigManager
 * 
 * Centralized manager for widget highlight/graphics configuration.
 * Provides a single source of truth for graphics symbology settings across all QuerySimple widgets.
 * 
 * Features:
 * - Singleton pattern (one instance for entire app)
 * - Per-widget configuration storage (keyed by widgetId)
 * - Fallback defaults for all symbology properties
 * - Type-safe configuration access
 * 
 * Usage:
 * ```typescript
 * import { highlightConfigManager } from 'widgets/shared-code/mapsimple-common'
 * 
 * // Register widget config on mount
 * highlightConfigManager.registerConfig(widgetId, config)
 * 
 * // Get symbology values
 * const fillColor = highlightConfigManager.getFillColor(widgetId)
 * const pointSize = highlightConfigManager.getPointSize(widgetId)
 * 
 * // Unregister on unmount
 * highlightConfigManager.unregisterConfig(widgetId)
 * ```
 */

import { type IMConfig as QuerySimpleConfig } from '../../query-simple/src/config'

class HighlightConfigManager {
  private static instance: HighlightConfigManager
  private configCache: Map<string, QuerySimpleConfig> = new Map()

  private constructor() {
    // Private constructor enforces singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HighlightConfigManager {
    if (!HighlightConfigManager.instance) {
      HighlightConfigManager.instance = new HighlightConfigManager()
    }
    return HighlightConfigManager.instance
  }

  /**
   * Register widget configuration
   * Call this when widget mounts or config changes
   */
  public registerConfig(widgetId: string, config: QuerySimpleConfig): void {
    this.configCache.set(widgetId, config)
  }

  /**
   * Unregister widget configuration
   * Call this when widget unmounts
   */
  public unregisterConfig(widgetId: string): void {
    this.configCache.delete(widgetId)
  }

  /**
   * Get fill color for widget (with fallback)
   */
  public getFillColor(widgetId: string): [number, number, number] {
    const config = this.configCache.get(widgetId)
    const hex = config?.highlightFillColor || '#DF00FF' // Magenta default
    return this.hexToRgb(hex)
  }

  /**
   * Get fill opacity for widget (with fallback)
   */
  public getFillOpacity(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.highlightFillOpacity ?? 0.25
  }

  /**
   * Get outline color for widget (with fallback)
   */
  public getOutlineColor(widgetId: string): [number, number, number] {
    const config = this.configCache.get(widgetId)
    const hex = config?.highlightOutlineColor || '#DF00FF' // Magenta default
    return this.hexToRgb(hex)
  }

  /**
   * Get outline opacity for widget (with fallback)
   */
  public getOutlineOpacity(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.highlightOutlineOpacity ?? 1.0
  }

  /**
   * Get outline width for widget (with fallback)
   */
  public getOutlineWidth(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.highlightOutlineWidth ?? 2
  }

  /**
   * Get point size for widget (with fallback)
   */
  public getPointSize(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.highlightPointSize ?? 12
  }

  /**
   * Get point outline width for widget (with fallback)
   */
  public getPointOutlineWidth(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.highlightPointOutlineWidth ?? 2
  }

  /**
   * Get point style for widget (with fallback)
   */
  public getPointStyle(widgetId: string): string {
    const config = this.configCache.get(widgetId)
    return config?.highlightPointStyle || 'circle'
  }

  /**
   * r024.0: Whether to show results as GroupLayer in LayerList (default: false)
   */
  public getAddResultsAsMapLayer(widgetId: string): boolean {
    const config = this.configCache.get(widgetId)
    return config?.addResultsAsMapLayer === true
  }

  /**
   * r024.0: Custom title for results layer in LayerList (default: 'QuerySimple Results')
   */
  public getResultsLayerTitle(widgetId: string): string {
    const config = this.configCache.get(widgetId)
    const title = config?.resultsLayerTitle
    return (typeof title === 'string' && title.trim() !== '') ? title.trim() : 'QuerySimple Results'
  }

  /**
   * r025.051: Get draw symbol color for Spatial tab (with fallback)
   */
  public getDrawColor(widgetId: string): [number, number, number] {
    const config = this.configCache.get(widgetId)
    const hex = config?.drawColor || '#32FF00' // Lime green default
    return this.hexToRgb(hex)
  }

  /**
   * r025.051: Get buffer preview color for Spatial tab (with fallback)
   */
  public getBufferColor(widgetId: string): [number, number, number] {
    const config = this.configCache.get(widgetId)
    const hex = config?.bufferColor || '#FFA500' // Orange default
    return this.hexToRgb(hex)
  }

  /**
   * r025.059: Get point zoom buffer distance in feet (with fallback)
   * Applied when zooming to single points or overlapping points (zero-area extents).
   */
  public getPointZoomBufferFeet(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.pointZoomBufferFeet ?? 300
  }

  /**
   * r025.068: Get zoom expansion factor (with fallback)
   * Applied when zooming to lines, polygons, and multi-record extents.
   */
  public getZoomExpansionFactor(widgetId: string): number {
    const config = this.configCache.get(widgetId)
    return config?.zoomExpansionFactor ?? 1.2
  }

  /**
   * Convert hex color to RGB array.
   * Handles:
   *   - 6-digit hex:  #DF00FF  → [223, 0, 255]
   *   - 3-digit hex:  #F0F     → [255, 0, 255]
   *   - CSS var:      var(--sys-color-primary-main)  → resolved via getComputedStyle
   *   - rgb/rgba:     rgb(223, 0, 255)               → parsed directly
   * Falls back to magenta [223, 0, 255] on any parse failure.
   * @private
   */
  private hexToRgb(hex: string): [number, number, number] {
    if (!hex) return [223, 0, 255]

    const trimmed = hex.trim()

    // CSS variable — resolve against document root
    if (trimmed.startsWith('var(')) {
      try {
        const varName = trimmed.replace(/^var\(\s*/, '').replace(/\s*\).*$/, '')
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
        if (resolved) return this.hexToRgb(resolved)
      } catch {
        // fall through to magenta
      }
      return [223, 0, 255]
    }

    // rgb(...) or rgba(...)
    const rgbMatch = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(trimmed)
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])]
    }

    // 3-digit hex: #RGB → #RRGGBB
    const shortHex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(trimmed)
    if (shortHex) {
      return [
        parseInt(shortHex[1] + shortHex[1], 16),
        parseInt(shortHex[2] + shortHex[2], 16),
        parseInt(shortHex[3] + shortHex[3], 16)
      ]
    }

    // 6-digit hex: #RRGGBB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(trimmed)
    if (result) {
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    }

    return [223, 0, 255] // Magenta fallback
  }
}

/**
 * Export singleton instance
 */
export const highlightConfigManager = HighlightConfigManager.getInstance()
