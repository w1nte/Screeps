
let Behavior = {

    // WORK, CARRY
    harvest: function(creep, target, source, resource) {
        if (!resource)
            resource = RESOURCE_ENERGY;

        if (creep.carry.energy < creep.energyCapacity) {
            if (creep.harvest(source, resource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else {
            if (creep.transfer(target, resource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }

        return true;
    },


    upgrade: function(creep, target, source) {


    },

    carry: function(creep, target, source, resource) {

    },

    // WORK, CARRY
    repair: function(creep, target, source) {
        // repair random with lowest hp, if no target
        if (!target) {
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: struct => struct.hits < struct.hitsMax
            });
            if (targets.length > 0) {
                targets.sort((a, b) => a.hits - b.hits);
                target = targets[0];
            }
        }

        let repair = creep.repair(target);
        switch (repair) {
            case OK:
                return true;
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target);
                return true;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.fetchEnergy(creep, source);
                return true;
            case ERR_NO_BODYPART || ERR_INVALID_TARGET:
                return false;
        }
        return false;
    },

    // WORK, CARRY
    build: function(creep, target, source) {
        let build = creep.build(target);
        switch (build) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target);
                return true;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.fetchEnergy(creep, source);
                return true;
            case ERR_NO_BODYPART || ERR_INVALID_TARGET:
                return false;
        }
        return false;
    },

    attack: function(creep, target) {
        if (!target) {
            target = creep.findClosestByRange(FIND_HOSTILE_CREEPS);
        }
        let attack = creep.attack(target);
        switch (attack) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target);
                return true;
            case ERR_NOT_ENOUGH_RESOURCES:
                this.fetchEnergy(creep, source);
                return true;
            case ERR_NO_BODYPART || ERR_INVALID_TARGET:
                return false;
        }
        return false;
    },

    fetchEnergy: function(creep, source) {

    }

};

modules.exports = Behavior;