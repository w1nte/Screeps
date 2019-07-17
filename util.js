'use strict';

/*
    Super Class that makes persistent classes easier.
 */
class D {
    constructor(memoryLocation) {
        if (isString(memoryLocation))
            memoryLocation = [memoryLocation];

        if (!(memoryLocation instanceof Array) ||memoryLocation.length < 1)
            throw new Error("Invalid Argument! memoryLocation has to be an Array or String!");

        this.memoryLocation = memoryLocation;
        if (!_.has(Memory, memoryLocation))
            _.set(Memory, memoryLocation, {});

        // set pointer to memory location
        this.memory = _.get(Memory, memoryLocation);
    }

    _get(attr, defaultValue) {
        if (isString(attr))
            attr = [attr];

        return _.get(this.memory, attr, defaultValue);
    }

    _set(attr, value) {
        if (isString(attr))
            attr = [attr];
        return _.set(this.memory, attr, value);
    }

    clearMemory() {
        if (_.has(Memory, [this.memoryLocation[0]]))
            delete Memory[this.memoryLocation[0]];
    }
}

/*
   Mod that can executed by ModRunner
 */
class Mod extends D {
    constructor(memoryLocation, options) {
        super(['mod'].concat(memoryLocation));

        this.options = assignOptions(options, {
            sleep: 1,
            requires: []
        });

        this.sleep = this.options.sleep;
        this.memory.lastRun = this._get("lastRun", 0);
        if (!this.memory.id)
            this._set("id", Game.time);
    }

    // return priority of the process
    static priority() {
        return 50;
    }

    getID() {
        return this.memory.id;
    }

    run(balancer) {
        throw new Error("run isn't implemented yet!");
    }

    isSleeping() {
        return (Game.time - this.memory.lastRun) < this.sleep;
    }
}

/*
    The Balancer runs all Processes dependent on the cpu usage
 */
class Balancer extends D {
    constructor(mods) {
        super(["runner"]);

        if (typeof mods !== 'object' || !(mods instanceof Array) || (mods.length < 1) || !(mods[0] instanceof Mod))
            throw new Error("Invalid Argument! Processes has to be an Array with Mod Objects");

        this.mods = mods;
        this.mods.sort((a, b) => a.constructor.priority() - b.constructor.priority());
        //TODO: implement requires

        this._run();
    }

    getMods(filter) {
        let mods = [].concat(this.mods);
        if (typeof filter === 'function')
            return mods.filter(filter);

        return mods;
    }

    _run() {
        let total_executing_time = 0;
        _.each(this.mods, (process) => {
            if (!process.isSleeping()) {
                let t = new Date().getMilliseconds();
                process.run(this);
                process.memory.lastRun = Game.time;
                t = new Date().getMilliseconds() - t;
                total_executing_time += t;
            }
        });
        console.log("Total executing time: " + total_executing_time + "ms!");
    }
}

let assignOptions = (userOptions, defaultOptions) => {
    if (defaultOptions === undefined)
        defaultOptions = {};

    return Object.assign({}, defaultOptions, userOptions);
};

let isString = (variable) => {
    return variable instanceof String || typeof variable === 'string';
};

module.exports = {D, Mod, Balancer, isString, assignOptions};