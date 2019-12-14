require('constants');
let _spawn = require('spawn');
let _hive = require('hive');
let _overlord = require('overlord');
let _util = require('util');


//
// let structurePriority = function(struct) {
//     switch (struct) {
//         case STRUCTURE_TOWER: return 1;
//         case STRUCTURE_CONTAINER: return 2;
//         default: return 1;
//     }
// };

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


    _util.clearDeadMemory();

    let mods = [];

    let overlord = new _overlord.Overlord({
        W7N3: {
            mode: 'normal',
            creeps: {
                harvester: 2,
            },
            harvest: [
                ['W7N4', RESOURCE_ENERGY, 3],
                ['W6N3', RESOURCE_ENERGY, 3],
                ['W8N4', RESOURCE_ENERGY, 1],
            ],
        },
        W8N3: {
            mode: 'normal',
            creeps: {
                carrier: 4,
                upgrader: 4
            },
            harvest: [
                ['W8N2', RESOURCE_ENERGY, 1],
            ],
            // colonize: [
            //     'W6N1'
            // ]
        },
        W8N4: {
            mode: 'normal',
            creeps: {
                harvester: 2,
                upgrader: 4
            },
            harvest: [
                ['W8N5', RESOURCE_ENERGY, 2],
            ],
        },
        W6N1: {
            mode: 'normal',
            creeps: {
                harvester: 3,
                upgrader: 11
            },
            // harvest: [
            //     ['W8N5', RESOURCE_ENERGY, 2],
            // ],
        }
    });

    mods.push(overlord);
    _.each(Game.rooms, (room) => {
        if (room.controller && room.controller.my) {
            mods.push(new _hive.Hive(room));
            mods.push(new _spawn.SpawnMod(room));
        }
    });

    let balancer = new _util.Balancer(mods);

    // balancer.clearMemory();

};