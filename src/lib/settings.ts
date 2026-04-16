export type ViewMode = 'markers' | 'heatmap' | 'both';

/**
 * Admin-boundary overlay selector.
 *   - 'off'       no admin overlay (basemap province lines only — controlled by `showProvinces`)
 *   - 'regions'   7 geographic regions of Türkiye (Akdeniz, Ege, …)
 *   - 'provinces' 81 provinces (iller)
 *   - 'districts' 973 districts (ilçeler)
 *
 * Data derived from ttezer/turkiye-harita-verisi → HDX COD-AB Türkiye (CC BY-IGO).
 */
export type AdminLevel = 'off' | 'regions' | 'provinces' | 'districts';

export interface Settings {
  viewMode: ViewMode;
  minMagnitude: number; // 0 = all
  showLabels: boolean;
  showHighways: boolean;
  showProvinces: boolean;
  showFaults: boolean;
  adminLevel: AdminLevel;
}

export const DEFAULT_SETTINGS: Settings = {
  viewMode: 'markers',
  minMagnitude: 0,
  showLabels: true,
  showHighways: true,
  showProvinces: true,
  showFaults: false,
  adminLevel: 'off',
};
