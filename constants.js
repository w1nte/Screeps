Object.assign(global, {
    // default protocol, no special behavior
    PROTOCOL_DEFAULT: 0,
    // base got attacked, stop upgrading controller, supply towers and extensions, produce defend creeps.
    // If storage has enough energy, stop harvesting.
    PROTOCOL_DEFENSE: 1,
    // extension supply is dead, all creeps supply the extensions (harvesting or if enough storage energy, carrying)
    PROTOCOL_EMERGENCY: 2,
    // fast upgrade protocol, produce more creeps for upgrading
    PROTOCOL_UPGRADE: 3,
    // fast storage fill protocol, reduce upgrading controller and fill storage
    PROTOCOL_LOAD: 4,
    // attack enemy base!
    PROTOCOL_ATTACK: 5
});