let overlord = require('overlord');
let Spawn = require('spawn');
let Util = require('util');


Object.assign(exports, {
    BODY_PART_COSTS: {
        MOVE: 50,
        WORK: 100,
        CARRY: 50,
        ATTACK: 80,
        RANGED_ATTACK: 150,
        HEAL: 250,
        TOUGH: 10,
        CLAIM: 600
    }
});

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

    overlord.commandCreeps();
    overlord.clearDeadMemory();

    let mods = [];

    let overlord2 = new Spawn.Overlord({
        w8n3: {

        }
    });

    mods.push(overlord2);
    _.each(Game.rooms, (room) => {
        if (room.controller && room.controller.my) {
            mods.push(new Spawn.Hive(room));
            mods.push(new Spawn.SpawnMod(room));
        }
    });

    let balancer = new Util.Balancer(mods);

    // _.each(mods, (mod) => {
    //     mod.clearMemory();
    // });

};