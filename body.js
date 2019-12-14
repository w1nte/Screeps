
class Body {
    constructor(parts) {
        if (!parts || !(parts instanceof Array))
            parts = [WORK, CARRY, MOVE];

        this.parts = parts;
    }

    static bodies() {
        let bodies = {
            'harvester': [
                new Body([WORK, CARRY, MOVE]), // 200
                new Body([WORK, WORK, CARRY, CARRY, CARRY, MOVE]), // 400
                new Body([WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]), // 600
                new Body([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]), // 800
                new Body([WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]), // 1200
                new Body([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]), // 1400
                new Body([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]) // 1800
            ],
            'carrier': [
                new Body([WORK, CARRY, MOVE]), // 200
                new Body([WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]), // 400
                new Body([WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]), // 800
                new Body([WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]), // 1200
                new Body([WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]), // 1400
                new Body([WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                    CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]) // 1800
            ],
            'colonizer': [
                new Body([CLAIM, WORK, CARRY, MOVE]), // 800
                new Body([CLAIM, WORK, WORK, CARRY, CARRY, CARRY, MOVE]), // 1200
                new Body([CLAIM, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]), // 1400
                new Body([CLAIM, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE])
            ],
            'defender': [
                new Body([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, RANGED_ATTACK]), // 300
                new Body([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK]), // 900
                new Body([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK]), // 1200
            ],
            'attacker': [
                new Body([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE])
            ],
            'healer': [
                new Body([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE])
            ],
            'annoyer': [
                new Body([
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    HEAL, HEAL, HEAL, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]) // heals 72hp per tick
            ]
        };

        bodies['default'] = bodies['harvester'];

        return bodies;
    }

    static bodiesByRole(role) {
        let bodies = Body.bodies();
        if (role in bodies)
            return bodies[role];
        else
            return bodies.default;
    }

    static cost(body) {
        if (body === undefined)
            return;

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
        _.each(_.get(body, ['parts'], body), (p) => {
            costs += BODY_PART_COSTS[p.toUpperCase()];
        });
        return costs;
    }

    static maxBody(bodies, maxEnergy) {
        let nextBody, body = bodies[0];

        for (let i = 0; i < bodies.length; i++) {
            nextBody = bodies[i];
            if (Body.cost(nextBody) <= maxEnergy) {
                body = nextBody;
            } else {
                break;
            }
        }

        return body;
    }
}

module.exports = {Body};