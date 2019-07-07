let roles = require('roles');

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

    getLevel(spawn) {
        let level = 0;


        return level;
    },

    spawnCreeps(spawn, creeps) {
        let count = {'harvester': 0, 'upgrader': 0, 'builder': 0, 'carrier': 0, 'none': 0};
        for (let c in creeps) {
            count[_.has(creeps[c], ["memory", "role"]) ? creeps[c].memory.role : 'none']++;
        }

        if (count.harvester < 5) {
            let newName = 'H' + Game.time;
            spawn.spawnCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE], newName, {memory: {role: 'harvester'}});

            if (count.harvester <= 2) {
                spawn.spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: 'harvester'}});
            }
        }

        if (count.upgrader < 3) {
            let newName = 'U' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: 'upgrader'}});
        }

        if (count.builder < 1) {
            let newName = 'B' + Game.time;
            spawn.spawnCreep([WORK, WORK, MOVE, CARRY, CARRY, CARRY, MOVE], newName, {memory: {role: 'builder'}});
        }

        if (count.carrier < 1) {
            let newName = 'C' + Game.time;
            spawn.spawnCreep([WORK, MOVE, MOVE, CARRY, CARRY, MOVE, MOVE], newName, {memory: {role: 'carrier'}});
        }
    },

    commandCreeps() {
        this.setTimer("spawn", 10);

        for (let name in Game.spawns) {

            let spawn = Game.spawns[name];
            let minerals = spawn.room.find(FIND_SOURCES);
            let creeps = spawn.room.find(FIND_CREEPS);
            let creeps_harvester = spawn.room.find(FIND_CREEPS, {
                filter: (creep) => { return _.has(creep, ["memory", "role"]) && creep.memory.role === 'harvester'; }
            });

            for (let id in creeps_harvester) {
                let creep = creeps_harvester[id];
                if (!_.has(creep, ["memory", "source"]) || _.get(creep, ["memory", "source"]) === false) {
                    creep.memory.source = minerals[Math.floor(minerals.length / creeps_harvester.length * id)];
                }
            }

            for (let id in creeps) {
                let creep = creeps[id];
                roles.run(creep);
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