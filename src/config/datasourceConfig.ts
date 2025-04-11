// src/config/datasourceConfig.ts
export const DEFAULT_DATASOURCE = 'polygon';

export interface DatasourceConfig {
  id: string;
  displayName: string;
  folderSuffix: string; // What to append to symbol for folder names
}

export const datasources: Record<string, DatasourceConfig> = {
  polygon: {
    id: 'polygon',
    displayName: 'Polygon',
    folderSuffix: '_polygon_min'
  }
  // Add more datasources in the future
};

// Helper functions
export function getDataSourceById(id: string = DEFAULT_DATASOURCE): DatasourceConfig {
  return datasources[id] || datasources[DEFAULT_DATASOURCE];
}

// Helper to construct folder prefix for a symbol with the given datasource
export function getSymbolFolderName(symbol: string, datasourceId: string = DEFAULT_DATASOURCE): string {
  const datasource = getDataSourceById(datasourceId);
  return `${symbol}${datasource.folderSuffix}`;
}

// Helper to construct file prefix for a symbol with the given datasource
export function getSymbolFilePrefix(symbol: string, datasourceId: string = DEFAULT_DATASOURCE): string {
  const datasource = getDataSourceById(datasourceId);
  return `${symbol}${datasource.folderSuffix}`;
}