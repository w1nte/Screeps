module.exports = {

    run: function(creep) {
        let roles = {
            'harvester': this.harvester,
            'builder': this.builder,
            'upgrader': this.upgrader,
            'carrier': this.carrier
        };

        if(_.has(creep, ["memory", "role"])) {
            var role = creep.memory.role;
            if (role in roles) {
                roles[role](creep);
            }
        } else console.log("creep without role detected!");
    },

    harvester: function(creep) {
        if(creep.carry.energy < creep.carryCapacity) {
            let source;

            if (_.has(creep, ["memory", "source"])) {
                source = Game.getObjectById(creep.memory.source.id);

                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
        else {
            creep.memory.source = false;
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                }
            });

            if(targets.length) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else if (creep.room.storage) {
                if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }

        }
    },

    builder: function(creep) {
        if(creep.memory.building && creep.carry.energy === 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.carry.energy === creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.building) {
            creep.memory.source = false;
            let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            let repair_targets = creep.room.find(FIND_STRUCTURES, {
                filter: struct => struct.hits < struct.hitsMax
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
            }
        }
        else {
            let target = creep.room.find(FIND_SOURCES);
            if (creep.harvest(target[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    },

    upgrader: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy === 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrading && creep.carry.energy === creep.carryCapacity) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
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
                let target = creep.room.find(FIND_SOURCES);
                if (creep.harvest(target[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }

        }
    },

    carrier: function(creep) {

        let storage = creep.room.storage;

        if (!storage)
            return this.harvester();

        let target = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => { return ((
                structure.structureType === STRUCTURE_EXTENSION ||
                structure.structureType === STRUCTURE_SPAWN ||
                structure.structureType === STRUCTURE_TOWER
            ) && structure.energy < structure.energyCapacity) ||
                (structure.structureType === STRUCTURE_CONTAINER
                ) && structure.store[RESOURCE_ENERGY] < structure.storeCapacity; }
        });


        if (storage.store[RESOURCE_ENERGY] < 2000 - creep.carry.energy + 154 || target.length <= 0) {

            if (creep.carry.energy < creep.carryCapacity) {

                let target = creep.room.find(FIND_SOURCES);
                if (creep.harvest(target[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                }

            } else {

                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(storage);
                }

            }
        } else {

            if (creep.carry.energy < creep.carryCapacity) {

                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                }

            } else {

                if (creep.transfer(target[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE ) {
                    creep.moveTo(target[0]);
                }

            }

        }

    },

};