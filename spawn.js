'use strict';

let util = require('util');
let body = require('body');

// default protocol, no special behavior
const PROTOCOL_DEFAULT = 0;
// base got attacked, stop upgrading controller, supply towers and extensions, produce defend creeps.
// If storage has enough energy, stop harvesting.
const PROTOCOL_DEFENSE = 1;
// extension supply is dead, all creeps supply the extensions (harvesting or if enough storage energy, carrying)
const PROTOCOL_EMERGENCY = 2;
// fast upgrade protocol, produce more creeps for upgrading
const PROTOCOL_UPGRADE = 3;
// fast storage fill protocol, reduce upgrading controller and fill storage
const PROTOCOL_LOAD = 4;
// attack enemy base!
const PROTOCOL_ATTACK = 5;

class Overlord extends util.Mod {
    constructor(roomPlan) {
        super(["overlord2"], 0);
    }

    run(balancer) {
        let hiveMods = balancer.getMods((mod) => { return mod instanceof Hive; });
        _.each(hiveMods, (hive) => {

        })
    }

    static priority() {
        return 1;
    }
}

/*
    It controls each room
 */
class Hive extends util.Mod {

    constructor(room) {
        super(["hive", room instanceof Room ? room.name : Game.rooms[room]]);

        this.room = room;

        // Behavior of the hive
        this.memory.protocol = this._get('protocol', PROTOCOL_DEFAULT);
    }

    /*
        Return all creeps of this hive
     */
    getCreeps() {
        let creeps = [];
        _.each(Game.creeps, (creep) => {
            if (creep.my && _.get(creep, ['memory', 'home', 'name'], false) === this.room.name) {
                creeps.push(creep);
            }
        });
        return creeps;
    }

    /*
        Return all creeps of this hive, related by their roles
     */
    getCreepsByRoles() {
        let creeps = {};
        _.each(this.getCreeps(), (creep) => {
            let role = _.get(creep, ['memory', 'role'], 'default');
            _.set(creeps, [role], _.get(creeps, [role], []).concat([creep]));
        });
        return creeps;
    }

    run(balancer) {
        let protocol = this.memory.protocol;
        let spawnMod = _.get(balancer.getMods((mod) => { return mod instanceof SpawnMod && mod.room === this.room; }), [0]);

        if (!spawnMod)
            throw new Error("No SpawnMod at Hive " + this.room.name);

        let harvester = new CreepEgg('harvester', {
            name: 'H' + Game.time,
        });

        spawnMod.setAutoProduction({
            h1: [harvester, 3]
        })
    }

    static priority() {
        return 10;
    }
}

class CreepEgg {
    constructor(role, options) {
        if (!util.isString(role))
            throw new Error("Invalid Argument! role has to be an String");

        let defaultOptions = {
            name: null,
            level: null,
            body: null,
            home: null,
            maxEnergy: null,
            memory: {},
            group: 'none',
            priority: 100
        };
        this.role = role;
        Object.assign(this, defaultOptions, options);
    }

    static spawn(spawn, creepEgg) {
        let body = creepEgg.body;

        if (!body) {
            let maxEnergy = _get(creepEgg, ['maxEnergy'], spawn.room.energyCapacityAvailable * 0.8);
            body = Body.maxBody(Body.getByRole(creepEgg.role), maxEnergy);
        }

        let name = creepEgg.name;

        spawn.spawnCreep(body, name, {memory: Object.assign({
                role: creepEgg.role,
                home: _.get(creepEgg, ['home'], spawn.room),
                group: creepEgg.group
            }, creepEgg.memory)});
    }
}

/*
    Spawning Creeps according to an priority list
 */
class SpawnMod extends util.Mod {
    constructor(room, options) {
        room = room instanceof Room ? room : Game.rooms[room];

        super(["spawn", room.name], {
            sleep: 2
        });

        this.options = util.assignOptions(options, {
            noSpawningThreshold: 30
        });

        this.room = room;
        this.spawns = room.find(FIND_MY_SPAWNS);
        this.memory.spawnlist = this._get('spawnlist', []);
        this.memory.noSpawning = this._get('noSpawning', 0);
        this.memory.autoProduction = this._get('autoProduction', {});
    }

    clearMemory() {
        if (_.has(Memory, [this.memoryLocation[0], this.room.name]))
            delete Memory[this.memoryLocation[0]][this.room.name];
    }

    clearSpawnList() {
        this.memory.spawnlist = [];
    }

    getSpawnList() {
        return this.memory.spawnlist;
    }

    getSpawnListByRoles() {
        let creeps = {};
        _.each(this.getSpawnList(), (creepEgg) => {
            let role = _.get(creepEgg, ['role'], 'default');
            _.set(creeps, [role], _.get(creeps, [role], []).push(creepEgg));
        });
        return creeps;
    }

    setAutoProduction(plan) {
        this.memory.autoProduction = plan;
    }

    spawnCreep(creepEgg) {
        if (!(creepEgg instanceof CreepEgg)) {
            throw new Error("Invalid Argument! CreepEgg parameter isn't a CreepEgg!");
        }
        let l = [], r = [];
        for (let i = 0; i < this.memory.spawnlist.length; i++) {
            let egg = this.memory.spawnlist[i];
            if (egg.priority && egg.priority < creepEgg.priority)
                l.push(egg);
            else if (!egg.priority || egg.priority >= creepEgg.priority)
                r.push(egg);
        }
        this.memory.spawnlist = l.concat([creepEgg]).concat(r);
    }

    run(balancer) {
        let spawnList = this.memory.spawnlist;
        let spawn = this.spawns[0];

        let hiveMod = _.get(balancer.getMods((mod) => { return mod instanceof Hive && mod.room.name === spawn.room.name; }), [0]);
        let creeps = hiveMod.getCreeps();
        let creepsByGroups = {};

        _.each(creeps, (creep) => {
            let group = _.get(creep, ['memory', 'group'], 'none');
            _.set(creepsByGroups, [group], _.get(creepsByGroups, [group], 0) + 1 );
        });

        _.each(spawnList, (creepEgg) => {
            _.set(creepsByGroups, [creepEgg.group], _.get(creepsByGroups, [creepEgg.group], 0) + 1 );
        });

        _.each(this.memory.autoProduction, (v, k) => {
            if (v instanceof CreepEgg)
                v = [v];

            let group = k;
            let creepEgg = v[0];
            let number = _.get(v, [1], 1);
            let toProduce = number - _.get(creepsByGroups, [group], 0);

            _.set(creepEgg, ['group'], group);

            if (toProduce > 0)
                for (let i = 0; i < toProduce; i++)
                    this.spawnCreep(creepEgg);
        });


        if (spawn.name === 'Spawn1') {
            console.log(spawn.name);
            _.each(creepsByGroups, (k, e) => {
                console.log(k + ": " + e);
            });
        }

        if (!spawn.spawning && spawnList.length > 0) {

            let creepEgg = spawnList[0];

            // if (Body.cost(creepEgg.body) <= this.spawn.room.energyAvailable) {
            //     CreepEgg.spawn(spawn, creepEgg);
            //     spawnList.shift();
            //     this.memory.noSpawning = 0;
            // } else {
            //     this.memory.noSpawning += 1;
            //     if (this.memory.noSpawning >= this.options.noSpawningThreshold) { // shift first element to last
            //         spawnList.concat([spawnList.shift()]);
            //     }
            // }

        }
    }

    static priority() {
        return 99;
    }

}

module.exports = {SpawnMod, CreepEgg, Hive, Overlord};