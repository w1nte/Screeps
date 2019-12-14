let util = require('util');
let _creepEgg = require('creepegg');

class Overlord extends util.Mod {
    constructor(roomPlan) {
        super(["overlord"], 0);

        this.roomPlan = roomPlan;
    }

    run(balancer) {
        let hiveMods = balancer.getMods('Hive');
        _.each(hiveMods, (hive) => {
            let plan = _.get(this.roomPlan, [hive.room.name], {});
            hive.plan = plan;

            if (hive.room.name === 'W7N3') {
                hive.spawn('helperW8N4', new _creepEgg.CreepEgg('harvester', {
                    home: Game.rooms['W8N4'],
                    priority: 150
                }), 2);
            }

            if (hive.room.storage && util.timer('statistic', 10) === 0) {
                let energyStorage = this._get(['statistic', 'energyStorage', hive.room.name], []);
                energyStorage.push(hive.room.storage.store[RESOURCE_ENERGY] || 0);
                if (energyStorage.length > 20)
                    energyStorage.shift();
                this._set(['statistic', 'energyStorage', hive.room.name], energyStorage);
            }

            // if (hive.room.name === 'W7N3') {
            //     hive.spawn(new CreepEgg('attacker', {
            //         name: 'A' + Game.time,
            //         priority: 1,
            //         memory: {
            //             toAttack: 'W5N3',
            //             waitUntil: 4
            //         }
            //     }));
            //
            //     for (let i = 0; i < 3; i++)
            //         hive.spawn(new CreepEgg('healer', {
            //             name: 'Healer' + Game.time,
            //             priority: 1,
            //             memory: {
            //                 toAttack: 'W5N3',
            //                 waitUntil: 4
            //             }
            //         }));
            // }

        })
    }

    static priority() {
        return 1;
    }
}

module.exports = {Overlord};