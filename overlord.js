let roles = require('roles');
let Body = require('body');


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
        let nextTick = _.get(Memory, ["overlord", "timer", key, "nextTick"]);

        if (nextTick == null || Game.time > nextTick) {
            _.set(Memory, ["overlord", "timer", key, "nextTick"], Game.time + ticks);
        }
    },

    getTimer(key) {
        return _.get(Memory, ["overlord", "timer", key, "nextTick"], 0) - Game.time;
    },

    isTimer(key) {
        return this.getTimer(key) === 0;
    },

    setCounter(key, reset) {
        let lastCount = _.get(Memory, ["overlord", "counter", key, "c"]);

        if (lastCount == null || reset() === true) {
            _.set(Memory, ["overlord", "counter", key, "c"], 0);
        } else {
            _.set(Memory, ["overlord", "counter", key, "c"], ++lastCount);
        }
    },

    getCounter(key) {
        return _.get(Memory, ["overlord", "counter", key, "c"], 0);
    },

    spawnCreeps(spawn, creeps) {

        let request = [
            ['harvester', 3],
            ['upgrader', 1],
            ['builder', 1]
        ];

        if (spawn.room.controller.level <= 4 && !spawn.room.storage && !Memory.overlord.emergency[spawn.room.name]) {
            request = [
                ['harvester', 3],
                ['upgrader', 6],
                ['builder', 1]
            ];

            if (spawn.room.controller.level === 4)
                request[2][1] += 2;
        }

        if (spawn.room.storage) {
            request = [
                ['carrier', 2, 0.5],
                ['harvester', 3],
                ['upgrader', 2, 0.5],
                ['builder', 1, 1]
            ];

            if ((spawn.room.storage.store[RESOURCE_ENERGY] || 0) >= 100000) {
                let constructionSites = spawn.room.find(FIND_CONSTRUCTION_SITES);
                if (constructionSites.length > 0) {
                    let progressRest = 0;
                    _.each(constructionSites, (c) => {
                        if (c.my)
                            progressRest += c.progressTotal - c.progress;
                    });

                    if (progressRest >= 5000)
                        request[3][1]++;

                    if (progressRest >= 25000)
                        request[3][1]++;

                }
            }

            if (spawn.room.controller.level >= 7) {
                request[0][1]++;
            }

            if (spawn.room.name === 'W7N3') {
                request.push({
                    'role': 'longrange_harvester',
                    'number': 2,
                    'memory': {
                        'toHarvest': 'W7N4'
                    },
                    'consumption': 0.9
                });
                request[0][1]++;
            }

        }


        let stock = {};
        _.each(Game.creeps, (creep) => {
            if (creep.my && _.get(creep, ['memory', 'home', 'name'], false) === spawn.room.name) {
                let role = _.get(creep, ['memory', 'role'], 'none');
                _.set(stock, [role], _.get(stock, [role], 0) + 1);
            }
        });

        if ( (!spawn.room.storage && (stock.harvester || 0) < 3 && spawn.room.energyAvailable <= 300) ||
            (spawn.room.storage && (stock.harvester || 0) <= 1 || (stock.carrier || 0) === 0) ) {
            _.set(Memory, ["overlord", "emergency", spawn.room.name], true);
        } else {
            delete Memory.overlord.emergency[spawn.room.name];
        }

        if (!spawn.spawning) {
            let prevSpawningCosts = 0;
            _.each(request, (r) => {
                let _role, n, _home, _consumption, _level, _body, _custom_memory = {};

                if (Array.isArray(r)) { // see arguments here
                    _role = r[0];
                    n = _.get(r, [1], 1);
                    _consumption = _.get(r, [2], 0.8);
                    _level = _.get(r, [3], -1);
                    _home = spawn.room;
                } else if (r && typeof r === 'object' && r.constructor === Object) {
                    _role = r.role;
                    n = _.get(r, ['number'], 1);
                    _home = _.get(r, ['home'], spawn.room);
                    _body = _.get(r, ['bodyList'], null);
                    _level = _.get(r, ['level'], -1);
                    _consumption = _.get(r, ['consumption'], 0.8);
                    _custom_memory = _.get(r, ['memory'], {});
                }

                if (Memory.overlord.emergency[spawn.room.name]) {
                    _level = 0;
                }

                if (!_body) {
                    let capacityEnergy = spawn.room.energyCapacityAvailable;
                    let bodyFunc = _.get(Body, [_role], Body.default);

                    if (_level !== -1) {
                        _body = bodyFunc(_level);
                    } else {
                        let nextBody;

                        for (let i = 0; i < 20; i++) {
                            nextBody = bodyFunc(i);
                            if (nextBody && Body.costs(nextBody) <= capacityEnergy * _consumption) {
                                _body = nextBody;
                            } else {
                                break;
                            }
                        }
                    }
                }

                if (_.get(stock, [_role], 0) < n) {
                    let _name = _role.charAt(0).toUpperCase() + Game.time;
                    let _memory = Object.assign({
                        role: _role,
                        home: _home
                        }, _custom_memory);

                    //console.log("spawn " + role + " in room " + spawn.room.name);

                    let costs = Body.costs(_body);
                    if ((costs + prevSpawningCosts) <= spawn.room.energyAvailable)
                        spawn.spawnCreep(_body, _name, {memory: _memory});
                    else
                        prevSpawningCosts += costs;
                }
            });
        }

    },

    commandCreeps() {

        this.setCounter("spawn", () => {
            return Game.spawns['Spawn1'].room.energyAvailable < Game.spawns['Spawn1'].room.energyCapacityAvailable;
        });


        // let spawn = Game.spawns['Spawn1'];
        // let stock = {};
        // _.each(Game.creeps, (creep) => {
        //     if (creep.my && _.get(creep, ['memory', 'home', 'name'], false) === spawn.room.name) {
        //         let role = _.get(creep, ['memory', 'role'], 'none');
        //         _.set(stock, [role], _.get(stock, [role], 0) + 1);
        //     }
        // });
        //
        // if ((stock.carrier || 0) >= 3)
        //     spawn.spawnCreep([ATTACK, ATTACK, ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,TOUGH, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], 'attacker' + Game.time, {memory: {role: 'attacker', toAttack: 'W5N3', waitUntil: 8, home:  Game.spawns['Spawn1'].room}});

        this.setTimer("spawn", 10);

        for (let name in Game.spawns) {

            let spawn = Game.spawns[name];
            let creeps = spawn.room.find(FIND_MY_CREEPS);

            let towers = spawn.room.find(FIND_STRUCTURES, {
                filter: (struct) => { return struct.structureType === STRUCTURE_TOWER }
            });

            _.each(towers, (tower) => {
                let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => !(structure.structureType === STRUCTURE_WALL && structure.hits > 10000) && !(structure.structureType === STRUCTURE_RAMPART && structure.hits > 10000) && structure.hits < structure.hitsMax
                });

                let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

                if (closestHostile) {
                    tower.attack(closestHostile);
                } else {
                    if(closestDamagedStructure) {
                        tower.repair(closestDamagedStructure);
                    }
                }
            });

            if (this.isTimer("spawn")) {
                this.spawnCreeps(spawn, creeps);
            }

        }

        for (let id in Game.creeps) {
            let creep = Game.creeps[id];
            if (creep.my)
                roles.run(creep);
        }

    }
};

module.exports = Overlord;