let roles = require('roles');
let body = require('body');

let Overlord = {
    clearDeadMemory: function() {
        if (_.has(Memory, ["creeps"]))
            _.each(Object.keys(Memory.creeps), (creep) => {
                if (!_.has(Game, ["creeps", creep]))
                    delete Memory.creeps[creep];
            });

        if (_.has(Memory, ["rooms"]))
            _.each(Object.keys(Memory.rooms), (room) => {
                if (!_.has(Game, ["rooms", room]))
                    delete Memory.rooms[room];
            });
    },

    setTimer(key, ticks) {
        let lastTick = _.get(Memory, ["overlord", "timer", key, "lastTick"]);

        if (lastTick == null || Game.time >= (lastTick + ticks)) {
            _.set(Memory, ["overlord", "timer", key, "lastTick"], Game.time);
            _.set(Memory, ["overlord", "timer", key, "active"], true);
        } else {
            _.set(Memory, ["overlord", "timer", key, "active"], false);
        }
    },

    isTimer(key) {
        return _.has(Memory, ["overlord", "timer", key]) ? _.get(Memory, ["overlord", "timer", key, "active"]) : false;
    },

    setCounter(key, reset) {
        let lastCount = _.get(Memory, ["overlord", "counter", key, "c"]);

        if (lastCount == null || reset() === true) {
            _.set(Memory, ["overlord", "counter", key, "c"], 0);
        } else {
            _.set(Memory, ["overlord", "counter", key, "c"], ++lastCount);
        }
    },

    spawnCreeps(spawn, creeps) {
        let count = {'harvester': 0, 'upgrader': 0, 'builder': 0, 'carrier': 0, 'none': 0, 'longrange_harvester': 0};
        for (let c in creeps) {
            count[_.has(creeps[c], ["memory", "role"]) ? creeps[c].memory.role : 'none']++;
        }

        if (count.harvester < 3 && (count.carrier < 1 || count.upgrader < 1)) {
            _.set(Memory, ["overlord", "emergency", spawn.room.name], true);
        } else {
            delete Memory.overlord.emergency[spawn.room.name];
        }

        if (Memory.overlord.emergency[spawn.room.name] && count.upgrader < 1) {
            let newName = 'U' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: 'upgrader', home: spawn.room}});
        }

        if (count.harvester < 3) {
            let newName = 'H' + Game.time;
            // 1800
            spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName, {memory: {role: 'harvester', home: spawn.room}});

            if (count.harvester <= 1) {
                if (spawn.room.storage && spawn.room.storage.storeCapacity[RESOURCE_ENERGY] > 4000) {
                    let newName = 'C' + Game.time;
                    spawn.spawnCreep([WORK, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName, {memory: {role: 'carrier', home: spawn.room}});
                } else
                    spawn.spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: 'harvester', home: spawn.room}});
            }

        } else {
            if (count.carrier < 2) {
                let newName = 'C' + Game.time;
                spawn.spawnCreep([WORK, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName, {memory: {role: 'carrier', home: spawn.room}});
            } else {
                if (count.upgrader < 3) {
                    let newName = 'U' + Game.time;
                    spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName, {memory: {role: 'upgrader', home: spawn.room}});
                }

                if (count.builder < 1) {
                    let newName = 'B' + Game.time;
                    spawn.spawnCreep([WORK, WORK, MOVE, CARRY, CARRY, CARRY, MOVE], newName, {memory: {role: 'builder', home: spawn.room}});
                }

                if (count.longrange_harvester < 0) {
                    let newName = 'LH' + Game.time;
                    spawn.spawnCreep([WORK, CARRY, CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName, {memory: {role: 'longrange_harvester', home: spawn.room}});
                }
            }
        }


    },

    commandCreeps() {
        //console.log(body.costs(body.harvester(4)));

        this.setCounter("spawn", () => {
            return Game.spawns['Spawn1'].room.energyAvailable < Game.spawns['Spawn1'].room.energyCapacityAvailable;
        });

        this.setTimer("spawn", 10);

        for (let name in Game.spawns) {

            let spawn = Game.spawns[name];

            let minerals = spawn.room.find(FIND_SOURCES, {
                filter: (source) => { return source.energy > 0; }
            });
            let creeps = spawn.room.find(FIND_CREEPS);
            let creeps_harvester = spawn.room.find(FIND_CREEPS, {
                filter: (creep) => { return _.has(creep, ["memory", "role"]) && creep.memory.role === 'harvester'; }
            });

            for (let id in creeps_harvester) {
                let creep = creeps_harvester[id];
                if (minerals.length > 0 && (!_.has(creep, ["memory", "source"]) || _.get(creep, ["memory", "source"]) === false)) {
                    creep.memory.source = minerals[Math.floor(minerals.length / creeps_harvester.length * id)];
                }
            }

            if (this.isTimer("spawn")) {
                this.spawnCreeps(spawn, creeps);
            }

            //console.log(spawn.room.energyCapacityAvailable);

            /*console.log(this.buildBody({
                WORK: 0.8,
                CARRY: 0.1,
                MOVE: 0.1
            }, 450));*/

        }

        for (let id in Memory.creeps) {
            let creep = Game.creeps[id];
            roles.run(creep);
        }

    },

    buildBody(parts, energy) {
        let BODY_PART_COSTS = {
            MOVE: 50,
            WORK: 100,
            CARRY: 50,
            ATTACK: 80,
            RANGED_ATTACK: 150,
            HEAL: 250,
            TOUGH: 10,
            CLAIM: 600
        };
        let r_total = 0;
        let body = [];
        let unused = 0;


        _.each(parts, (r, part) => {
            r_total += r;
            if (r_total <= 1) {
                let free = energy * r;
                while (free >= BODY_PART_COSTS[part]) {
                    body.push(part);
                    free -= BODY_PART_COSTS[part];
                }
                unused += free;
            }
        });

        return body;
    }
};

module.exports = Overlord;