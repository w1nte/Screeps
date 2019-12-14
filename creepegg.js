let _body = require('body');
let _util = require('util');

class CreepEgg {
    constructor(role, options) {
        if (!_util.isString(role))
            throw new Error("Invalid Argument! role has to be an String");

        let defaultOptions = {
            name: Game.time,
            level: null,
            body: null,
            home: null,
            maxEnergy: null, // 0-1 percent of room energy capacity; > 1 energy
            memory: {},
            group: 'none',
            priority: 100
        };
        this.role = role;
        Object.assign(this, defaultOptions, options);
    }

    static cost(spawn, creepEgg) {
        let body = creepEgg.body;
        if (!body) {
            let maxEnergy = creepEgg.maxEnergy || spawn.room.energyCapacityAvailable * 0.8;
            if (maxEnergy <= 1)
                maxEnergy = spawn.room.energyCapacityAvailable * maxEnergy;
            body = _body.Body.maxBody(_body.Body.bodiesByRole(creepEgg.role), maxEnergy);
        }
        return _body.Body.cost(body);
    }

    static spawn(spawn, creepEgg) {
        let body = creepEgg.body;

        if (!body) {
            let maxEnergy = creepEgg.maxEnergy || spawn.room.energyCapacityAvailable * 0.8;
            if (maxEnergy <= 1)
                maxEnergy = spawn.room.energyCapacityAvailable * maxEnergy;
            body = _body.Body.maxBody(_body.Body.bodiesByRole(creepEgg.role), maxEnergy);
        }

        let name = creepEgg.name;

        return spawn.spawnCreep(body.parts, name, {memory: Object.assign({
                role: creepEgg.role,
                home: creepEgg.home || spawn.room,
                group: creepEgg.group,
                hive: spawn.room.name
            }, creepEgg.memory)});
    }
}

module.exports = {CreepEgg};