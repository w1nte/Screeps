'use strict';

let util = require('util');

class Group extends util.Mod {
    constructor(name, spawn, options) {
        if (util.isString(name))
            name = [name];

        super(['group'].concat(name));

        let defaultOptions = {
            autoSpawn: [] // [[creepEgg, number], ]
        };
        this.options = Object.assign({}, defaultOptions, options);

        this.name = name;
        this.spawn = spawn;

        if (!this.memory.id)
            this._set("id", Game.time);
    }

    getCreeps() {
        let creeps = [];
        _.each(Game.creeps, (creep) => {
            if (creep.my && _.get(creep, ['memory', 'group'].concat(name), false) === this.name) {
                creeps.push(creep);
            }
        });
        return creeps;
    }

    spawnCreep(creepEgg) {
        // copy object to avoid unintentional effects
        creepEgg = Object.assign({}, creepEgg);
        _.set(creepEgg, ['options', 'memory', 'group'].concat(name), this.name);
        creepEgg.spawn(this.spawn);
    }

    autoSpawn() {
        let creeps = this.getCreeps();
    }

    getID() {
        return this.memory.id;
    }

    run() {

    }

    static priority() {
        return 200;
    }
}

class Army extends Group {
    constructor(name, spawn) {
        super(['army', name], spawn);
    }



}

module.exports = {Army};