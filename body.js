
let Body = {

    costs(body) {
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

        let costs = 0;
        _.each(body, (p) => {
            costs += BODY_PART_COSTS[p.toUpperCase()];
        });

        return costs;
    },

    harvester(level) {
        switch (level) {
            case 0: return [WORK, CARRY, MOVE]; // 200
            case 1: return [WORK, WORK, CARRY, CARRY, CARRY, MOVE]; // 400
            case 2: return [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 800
            case 3: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 1200
            case 4: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 1400

            default: return this.harvester(0);
        }
    }

};

module.exports = Body;