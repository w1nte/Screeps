'use strict';

let util = require('util');
let _creepEgg = require('creepegg');

/*
    Spawning Creeps according to an priority list
 */
class SpawnMod extends util.Mod {

    constructor(room, options) {
        room = room instanceof Room ? room : Game.rooms[room];

        super(["spawn", room.name], {
            sleep: 10
        });

        this.options = util.assignOptions(options, {
            noSpawningThreshold: 120,
            emergencyThreshold: 600,
        });

        this.room = room;
    }

    init() {
        this.spawns = this.room.find(FIND_MY_SPAWNS);
        this.memory.spawnlist = this._get('spawnlist', []);
        this.memory.lastSpawn = this._get('lastSpawn', Game.time);
        this.memory.autoProduction = this._get('autoProduction', {});
        this.hiveMod = _.get(this.balancer.getMods((mod) => { return mod.constructor.name === 'Hive' && mod.room.name === this.room.name; }), [0]);
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
        if (!(creepEgg instanceof _creepEgg.CreepEgg)) {
            throw new Error("Invalid Argument! CreepEgg parameter isn't a CreepEgg!");
        }
        let l = [], r = [];
        for (let i = 0; i < this.memory.spawnlist.length; i++) {
            let egg = this.memory.spawnlist[i];
            if (egg.priority && egg.priority <= creepEgg.priority)
                l.push(egg);
            else if (!egg.priority || egg.priority > creepEgg.priority)
                r.push(egg);
        }
        this.memory.spawnlist = l.concat([creepEgg]).concat(r);
    }

    countCreepsByGroup() {
        let creepsAlive = this.hiveMod.getCreeps().filter((creep) => { return creep.spawning || creep.ticksToLive > 100; });
        let countCreeps = {};

        _.each(creepsAlive, (creep) => {
            let group = _.get(creep, ['memory', 'group'], 'none');
            _.set(countCreeps, [group], _.get(countCreeps, [group], 0) + 1);
        });

        _.each(this.memory.spawnlist, (creepEgg) => {
            let group = _.get(creepEgg, ['group'], 'none');
            _.set(countCreeps, [group], _.get(countCreeps, [group], 0) + 1);
        });

        return countCreeps;
    }

    run(balancer) {
        if (this.spawns.length === 0) {

            // build spawn if no there
            let yellowFlags = this.room.find(FIND_FLAGS, {
                filter: (flag) => { return flag.color === COLOR_YELLOW; }
            });

            if (yellowFlags.length === 1) {
                //Generated by BlueScreeps 1.0.0
                let blueprint = (room_, x, y) => _.each([[STRUCTURE_SPAWN, 0, 0], [STRUCTURE_EXTENSION, 2, -2], [STRUCTURE_EXTENSION, 1, -3], [STRUCTURE_EXTENSION, 1, -2], [STRUCTURE_EXTENSION, 2, -3]], (s) => {room_.createConstructionSite(x+s[1], y+s[2], s[0]);});
                blueprint(this.room, yellowFlags[0].pos.x, yellowFlags[0].pos.y);
            }

            return;
        }

        let spawnList = this.memory.spawnlist;
        let countCreeps = this.countCreepsByGroup();

        _.each(this.memory.autoProduction, (v, k) => {
            if (v.constructor.name === 'CreepEgg')
                v = [v];

            let group = k;
            let creepEgg = v[0];
            let number = _.get(v, [1], 1);
            let toProduce = number - _.get(countCreeps, [group], 0);

            _.set(creepEgg, ['group'], group);

            if (toProduce > 0) {
                for (let i = 0; i < toProduce; i++)
                    this.spawnCreep(creepEgg);
            } else if (toProduce < 0) {
                this.memory.spawnlist = this.memory.spawnlist.filter((creepEgg) => {
                    return !(creepEgg.group === group);
                });
            }
        });

        // Debug ------------------
        let c_ = {};
        _.each(this.hiveMod.getCreeps().filter((creep) => { return creep.spawning || creep.ticksToLive > 100; }), (creep) => {
            let group = _.get(creep, ['memory', 'group'], 'none');
            _.set(c_, [group], _.get(c_, [group], 0) + 1 );
        });
        // ------------------------

        let i = 0;
        _.each(this.spawns, (spawn) => {

            // Debug ------------------
            if (spawn.name === 'Spawn1') {
                console.log(spawn.name + " Productionlist ------------------------- ");

                _.each(countCreeps, (k, e) => {
                    console.log(e + ": " + _.get(c_, [e], 0) + "/" + _.get(this.memory.autoProduction, [e, 1], 0));
                });
            }
            // ------------------------

            if (!spawn.spawning && spawnList.length > 0) {

                let creepEgg = spawnList[0];

                if (_creepEgg.CreepEgg.cost(spawn, creepEgg) <= spawn.room.energyAvailable) {
                    creepEgg.name += "S" + i++;
                    if (_creepEgg.CreepEgg.spawn(spawn, creepEgg) === OK) {
                        spawnList.shift();
                        this.memory.lastSpawn = Game.time;
                    }
                } else {
                    let t = Game.time - this.memory.lastSpawn;

                    if (t >= this.options.emergencyThreshold) {
                        if (this.hiveMod.memory.protocol !== PROTOCOL_EMERGENCY)
                            this.clearSpawnList();

                       this.hiveMod.setProtocol(PROTOCOL_EMERGENCY);
                    }

                }

            }
        });
    }

    static priority() {
        return 99;
    }

}



module.exports = {SpawnMod};