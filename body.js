
// class Body {
//     constructor(parts) {
//         if (!parts || !(parts instanceof Array))
//             parts = [WORK, CARRY, MOVE];
//
//         this.parts = parts;
//     }
//
//     static bodies() {
//         return {
//             'harvester':  [
//                 [WORK, CARRY, MOVE], // 200
//                 [WORK, WORK, CARRY, CARRY, CARRY, MOVE], // 400
//                 [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], // 600
//                 [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], // 800
//                 [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], // 1200
//                 [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], // 1400
//                 [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] // 1800
//             ],
//             'default': []
//         };
//     }
//
//     static bodiesByRole(role) {
//         let bodies = Body.bodies();
//         if (role in bodies)
//             return bodies[role];
//         else
//             return bodies.default;
//     }
//
//     static cost(body) {
//         let costs = 0;
//         _.each(body.parts, (p) => {
//             costs += BODY_PART_COSTS[p.toUpperCase()];
//         });
//         return costs;
//     }
//
//     static maxBody(bodies, maxEnergy) {
//         let nextBody, body;
//
//         for (let i = 0; i < bodies.length; i++) {
//             nextBody = bodies[i];
//             if (Body.cost(nextBody) <= maxEnergy) {
//                 body = nextBody;
//             } else {
//                 break;
//             }
//         }
//
//         return body;
//     }
// }

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
            case 2: return [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 600
            case 3: return [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 800
            case 4: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 1200
            case 5: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 1400
            case 6: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; // 1800

            default: return null;
        }
    },

    longrange_harvester(level) {
        return Body.harvester(level);
    },

    builder(level) {
        if (level === 6)
            return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; // 1800
        return Body.harvester(level);
    },

    upgrader(level) {
        return Body.harvester(level);
    },

    carrier(level) {
        switch (level) {
            case 0: return [WORK, CARRY, MOVE]; // 200
            case 1: return [WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]; // 400
            case 2: return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; // 800
            case 3: return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; // 1200
            case 4: return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; // 1400
            case 5: return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                MOVE, MOVE, MOVE, MOVE , MOVE, MOVE]; // 1800

            default: return null;
        }
    },

    colonizer(level) {
        switch (level) {
            case 0: return [CLAIM, WORK, CARRY, MOVE]; // 800
            case 1: return [CLAIM,WORK, WORK, CARRY, CARRY, CARRY, MOVE]; // 1200
            case 2: return [CLAIM,WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 1400
            case 3: return [CLAIM,WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 1800

            default: return null;
        }
    },

    attacker(level) {
        switch (level) {
            case 0: return [ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,TOUGH, HEAL, MOVE, MOVE, MOVE, MOVE];

            default: return null;
        }
    },

    default(level) {
        return Body.harvester(level);
    },

};

module.exports = Body;