let overlord = require('overlord');

var BODY_PART_COSTS = {
    'MOVE': 50,
    'WORK': 100,
    'CARRY': 50,
    'ATTACK': 80,
    'RANGED_ATTACK': 150,
    'HEAL': 250,
    'TOUGH': 10,
    'CLAIM': 600
};

let structurePriority = function(struct) {
    switch (struct) {
        case STRUCTURE_TOWER: return 1;
        case STRUCTURE_CONTAINER: return 2;
        default: return 1;
    }
};

module.exports.loop = function () {

    Game.spawns['Spawn1'].room.visual.text("My Colony", 2, 1, {color: 'white', font: 0.8});


    // let s = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {filter: (struct) => { return (struct.structureType === STRUCTURE_TOWER
    //         || struct.structureType === STRUCTURE_EXTENSION) && struct.energy && struct.energy < struct.energyCapacity;}});
    //
    // s = _.sortBy(s,(i) => { return (i.energy || i.store[RESOURCE_ENERGY]) * structurePriority(i.structureType); });
    // for (i in s) {
    //     console.log(s[i].structureType + " " + (s[i].energy ||s[i].store[RESOURCE_ENERGY]));
    // }
    // console.log();

    let towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
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


    overlord.commandCreeps();
    overlord.clearDeadMemory();


};