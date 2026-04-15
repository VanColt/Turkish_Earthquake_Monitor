export type ViewMode = 'markers' | 'heatmap' | 'both';

export interface Settings {
  viewMode: ViewMode;
  minMagnitude: number; // 0 = all
  showLabels: boolean;
  showHighways: boolean;
  showProvinces: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  viewMode: 'markers',
  minMagnitude: 0,
  showLabels: true,
  showHighways: true,
  showProvinces: true,
};
