export interface NetPhaserConfig
{
    maxPlayersInSession: number
}

let configuration: NetPhaserConfig;

function setConfig(config: NetPhaserConfig) {
    configuration = config;
}

export {
    setConfig,
    configuration as config,
}