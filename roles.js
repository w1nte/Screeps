let Roles = {

    run(creep) {
        let roles = {
            'harvester': this.harvester,
            'longrange_harvester': this.longrange_harvester,
            'colonizer': this.colonizer,
            'builder': this.builder,
            'upgrader': this.upgrader,
            'carrier': this.carrier,
            'attacker': this.attacker
        };

        if(creep !== undefined && !creep.spawning && _.has(creep, ["memory", "role"])) {
            let role = _.get(creep, ["memory", "role"]);
            if (role in roles) {
                roles[role](creep);
            } else Roles.harvester(creep);
        } else if (_.has(creep, ["memory"])) Roles.harvester(creep);
    },

    _room(creep, room) {
        if (room !== undefined) {

            let next_room = (room.name || room);

            if (creep.room.name !== next_room) {

                creep.moveTo(
                    creep.pos.findClosestByRange(
                        creep.room.findExitTo(next_room)
                    )
                , {maxRooms: 1});

                return false;
            }

        }

        return true;
    },

    _findSource(creep, room) {
        if (typeof room === "string")
            room = _.get(Game.rooms, [room], undefined);

        if (room === undefined)
            room = creep.room;

        let sources = room.find(FIND_SOURCES, {
            filter: (source) => { return source.energy > 0; }
        });
        return sources[Math.floor(Math.random() * sources.length)];
    },

    harvester(creep, room, ressource) {

        // -- switch state -------------------------------------
        if (creep.memory.harvesting === true && creep.carry.energy === creep.carryCapacity) {
            creep.memory.target = false;
            creep.memory.harvesting = false;
        }

        if (creep.memory.harvesting === false && creep.carry.energy === 0) {
            creep.memory.source = false;
            creep.memory.harvesting = true;
        }
        // -----------------------------------------------------

        if(creep.memory.harvesting) {

            if (!Roles._room(creep, room))
                return;

            if (!creep.memory.source) {
                creep.memory.source = Roles._findSource(creep, room, ressource);
            }

            if (_.has(creep.memory.source, ["id"])) {
                let source = Game.getObjectById(creep.memory.source.id);

                let harvest = creep.harvest(source);

                if (harvest === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}, maxRooms: 1});
                } else if (harvest === ERR_NOT_ENOUGH_RESOURCES) {
                    creep.memory.source = false;
                }
            }

        } else {

            // default value
            creep.memory.harvesting = false;

            if (!Roles._room(creep, creep.memory.home || creep.room))
                return;

            if (creep.room.storage && !_.has(Memory, ["overlord", "emergency", creep.room.name])) {

                if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}, maxRooms: 1});
                }

            } else {

                if (!creep.memory.target) {
                    let targets = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType === STRUCTURE_EXTENSION ||
                                structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                        }
                    });
                    creep.memory.target = targets[0];
                }

                if (creep.memory.target) {
                    let target = Game.getObjectById(creep.memory.target.id);

                    let transfer = creep.transfer(target, RESOURCE_ENERGY);
                    if (transfer === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}, maxRooms: 1});
                    } else if (transfer === ERR_FULL) {
                        creep.memory.target = false;
                    }

                    creep.memory.standby = 0;
                } else {
                    // if 10 ticks does nothing, then start upgrading
                    creep.memory.standby = (creep.memory.standby || 0) + 1;
                    if (creep.memory.standby > 10) {
                        creep.memory.target = false;
                        creep.memory.source = false;
                        //return this.upgrader(creep, room);
                    }
                }

            }

        }
    },

    longrange_harvester(creep, room) {
        room = _.get(creep, ['memory', 'toHarvest'], room);

        return Roles.harvester(creep, room);
    },

    colonizer(creep, room) {
        room = _.get(creep, ['memory', 'toColonize'], room);

        if (!Roles._room(creep, room))
            return;

        if (creep.room.controller && !creep.room.controller.my) {
            if(creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
            return;
        }

        let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length > 0)
            Roles.builder(creep, room);
        else
            Roles.upgrader(creep, room);
    },

    attacker(creep, room) {
        room = _.get(creep, ['memory', 'toAttack'], room);

        if (creep.room.name === _.get(creep, ['memory', 'home', 'name']) && _.has(creep, ['memory', 'waitUntil'])) {
            let i = 0;
            _.each(creep.room.find(FIND_MY_CREEPS), (c) => {
                if (_.get(c, ['memory', 'role']) === 'attacker' && _.get(c, ['memory', 'toAttack']) === (room || room.name))
                    i++;
            });
            if (i <= creep.memory.waitUntil && creep.ticksToLive > 300) {
                let flag = creep.room.find(FIND_FLAGS, {filter: (flag) => { return flag.color === COLOR_RED; }});
                if (flag.length > 0)
                    creep.moveTo(flag[0]);
                return;
            }
            creep.memory.waitUntil = 0;
        }

        let closestStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: (struct) => { return struct.structureType === STRUCTURE_SPAWN || struct.structureType === STRUCTURE_TOWER; }});
        let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if(closestStructure && closestStructure.room.name === room) {
            if (creep.attack(closestStructure) === ERR_NOT_IN_RANGE)
                if (creep.moveTo(closestStructure, {maxRooms: 1}) === ERR_NO_PATH) {
                    let wall = creep.pos.findClosestByRange(FIND_STRUCTURES);
                    if (wall) {
                        if (creep.attack(wall) === ERR_NOT_IN_RANGE)
                            creep.moveTo(wall, {maxRooms: 1});
                    }
                }
            return;
        }

        if (closestHostile) {
            if (creep.attack(closestHostile) === ERR_NOT_IN_RANGE)
                creep.moveTo(closestHostile, {maxRooms: 1});
            else if(closestStructure) {
                if (creep.attack(closestStructure) === ERR_NOT_IN_RANGE)
                    creep.moveTo(closestStructure, {maxRooms: 1});
            }
            return;
        }

        if (!Roles._room(creep, room)) {
            if (creep.hits <= creep.hitsMax)
                creep.heal(creep);
        }

    },

    builder(creep, room) {
        if(creep.memory.building && creep.carry.energy === 0) {
            creep.memory.building = false;
        }
        if(!creep.memory.building && creep.carry.energy === creep.carryCapacity) {
            creep.memory.building = true;
        }

        if (!Roles._room(creep, room))
            return;

        if(creep.memory.building) {
            creep.memory.source = false;
            let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            let repair_targets = creep.room.find(FIND_STRUCTURES, {
                filter: struct => struct.hits < struct.hitsMax
            });
            repair_targets = _.sortBy(repair_targets,(i) => {
                return i.hits;
            });

            if(targets.length) {
                if(creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else if (creep.room.storage) {
                if (repair_targets)
                    if(creep.repair(repair_targets[0]) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(repair_targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                else
                    if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
            } else {

                return Roles.carrier(creep, room);
            }
        }
        else {
            let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => { return ( structure.structureType === STRUCTURE_CONTAINER ||
                    structure.structureType === STRUCTURE_STORAGE)
                    && structure.store[RESOURCE_ENERGY] > creep.carryCapacity; }
            });

            if (container) {
                if(creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if (!creep.memory.source) {
                    creep.memory.source = Roles._findSource(creep, room);
                }

                if (_.has(creep.memory.source, ["id"])) {
                    let source = Game.getObjectById(creep.memory.source.id);

                    let harvest = creep.harvest(source);

                    if (harvest === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    } else if (harvest === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.source = false;
                    }
                }
            }
        }
    },

    upgrader(creep, room) {
        if (_.has(Memory, ["overlord", "emergency", creep.room.name]))
            return Roles.harvester(creep, room);

        if(creep.memory.upgrading && creep.carry.energy === 0) {
            creep.memory.upgrading = false;
        }

        if(!creep.memory.upgrading && creep.carry.energy === creep.carryCapacity) {
            creep.memory.upgrading = true;
        }

        if(creep.memory.upgrading) {
            creep.memory.source = false;
            if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => { return structure.structureType === STRUCTURE_CONTAINER
                     && structure.store[RESOURCE_ENERGY] > creep.carryCapacity; }
            });

            if (container) {
                if(creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {

                if (!creep.memory.source) {
                    creep.memory.source = Roles._findSource(creep, room);
                }

                if (_.has(creep.memory.source, ["id"])) {
                    let source = Game.getObjectById(creep.memory.source.id);

                    let harvest = creep.harvest(source);

                    if (harvest === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    } else if (harvest === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.source = false;
                    }
                }

            }

        }
    },

    carrier2(creep, room) {

        // -- switch state -------------------------------------
        if (creep.memory.fetching === true && creep.carry.energy === creep.carryCapacity) {
            creep.memory.target = false;
            creep.memory.fetching = false;
        }

        if (creep.memory.fetching === false && creep.carry.energy === 0) {
            creep.memory.source = false;
            creep.memory.fetching = true;
        }
        // -----------------------------------------------------

        if(creep.memory.fetching) {

            if (!Roles._room(creep, room))
                return;

            if (!creep.memory.source) {
                creep.memory.source = Roles._findSource(creep, room);
            }

            let source = Game.getObjectById(creep.memory.source.id);

            let harvest = creep.harvest(source);

            if (harvest === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            } else if (harvest === ERR_NOT_ENOUGH_RESOURCES) {
                creep.memory.source = false;
            }

        } else {

            if (!Roles._room(creep, creep.memory.home || Game.spawns[Object.keys(Game.spawns)[0]].room))
                return;

            if (creep.room.storage && !_.has(Memory, ["overlord", "emergency", creep.room.name])) {

                if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
                }

            } else {

                if (!creep.memory.target) {
                    let targets = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType === STRUCTURE_EXTENSION ||
                                structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                        }
                    });
                    creep.memory.target = targets[0];
                }

                let target = Game.getObjectById(creep.memory.target.id);

                if (target) {
                    let transfer = creep.transfer(target, RESOURCE_ENERGY);
                    if (transfer === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    } else if (transfer === ERR_FULL) {
                        creep.memory.target = false;
                    }
                }

            }

        }
    },

    carrier(creep) {

        let storage = creep.room.storage;

        if (!storage)
            return Roles.harvester(creep);

        let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => { return ((
                    structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_TOWER ||
                    structure.structureType === STRUCTURE_LINK
                ) && structure.energy < structure.energyCapacity) ||
                (structure.structureType === STRUCTURE_CONTAINER
                ) && structure.store[RESOURCE_ENERGY] < structure.storeCapacity; }
        });

        if (storage.store[RESOURCE_ENERGY] < 2000 - creep.carry.energy + 154 || !target) {

            if (creep.carry.energy <= creep.carryCapacity * 0.1) {

                creep.memory.target = null;

                let targets = creep.room.find(FIND_SOURCES);
                if (creep.harvest(targets[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                }

            } else {

                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(storage);
                }

            }

        } else {

            if (creep.carry.energy <= creep.carryCapacity * 0.1) {

                creep.memory.target = null;

                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                }

            } else {

                if (!creep.memory.target) {
                    creep.memory.target = target.id;
                }

                let t = Game.getObjectById(creep.memory.target);
                let transfer = creep.transfer(t, RESOURCE_ENERGY);
                if (transfer === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(t);
                }

                if (transfer === ERR_FULL) {
                    creep.memory.target = null;
                }

            }

        }

    },

};

module.exports = Roles;