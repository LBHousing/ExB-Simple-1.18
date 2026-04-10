import { BaseVersionManager } from 'jimu-core'

class VersionManager extends BaseVersionManager {
  versions = [{
    version: '1.0.0',
    description: 'Initial version.',
    upgrader: (oldConfig) => oldConfig
  }]
}

export const versionManager = new VersionManager()
