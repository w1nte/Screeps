'use strict';

/**
 * Super Class that makes persistent classes easier.
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

/**
 * Mod class that can be executed by ModRunner
 */
class Mod extends D {
    constructor(memoryLocation, options) {
        super(['mod'].concat(memoryLocation));

        this.options = assignOptions(options, {
            sleep: 1,
            offset: 0, // sleep offset
            requires: []
        });

        this.balancer = null;
        this.sleep = this.options.sleep;
        this.memory.lastRun = this._get("lastRun", 0);
        if (!this.memory.id)
            this._set("id", Game.time); // TODO: doesnt make sense, change it
    }

    /**
     * Is called by the balancer at begin
     * @returns {number}
     */
    init() {
        return 0;
    }

    /**
     * Returns the priority of a mod. Should be overwritten by the child class
     * @returns {number}
     */
    static priority() {
        return 50;
    }

    getID() {
        return this.memory.id;
    }

    /**
     * Function that is called by the balancer, must be overwritten by the child class
     * @param balancer
     */
    run(balancer) {
        throw new Error("run isn't implemented yet!");
    }

    /**
     * Returns if the mod is sleeping. If yes, then the mod will not be executed by the balancer
     * @returns {boolean}
     */
    isSleeping() {
        return (Game.time + this.options.offset - this.memory.lastRun) < this.sleep;
    }
}

/**
 *  The Balancer runs all Mods. The Object instantly works if it is created.
 */
class Balancer extends D {
    constructor(mods) {
        super(["runner"]);

        if (typeof mods !== 'object' || !(mods instanceof Array) || (mods.length < 1) || !(mods[0] instanceof Mod))
            throw new Error("Invalid Argument! Processes has to be an Array with Mod Objects");

        this.mods = mods;
        this.mods.sort((a, b) => a.constructor.priority() - b.constructor.priority());
        //TODO: implement requires
        this.mods.map((mod) => { mod.balancer = this; mod.init(); });

        this._run();
    }

    /**
     * Return a list of all mods (in priority order).
     * @param filter String of the Modclass or filter function
     * @returns {*[]}
     */
    getMods(filter) {
        let mods = [].concat(this.mods);

        if (isString(filter))
            return mods.filter((mod) => { return mod.constructor.name === filter; });

        if (typeof filter === 'function')
            return mods.filter(filter);

        return mods;
    }

    /**
     * Runs all the mods in priority order
     * @private
     */
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

    clearMemory() {
        if (_.has(Memory, [this.memoryLocation[0]]))
            delete Memory[this.memoryLocation[0]];

        _.each(this.mods, (process) => {
            process.clearMemory();
        });
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

let clearDeadMemory = () => {
    if (_.has(Memory, ["creeps"]))
        _.each(Object.keys(Memory.creeps), (creep) => {
            if (!_.has(Game, ["creeps", creep]))
                delete Memory.creeps[creep];
        });

    if (_.has(Memory, ["rooms"]))
        _.each(Object.keys(Memory.rooms), (room) => {
            if (!_.has(Game, ["rooms", room]))
                delete Memory.rooms[room];
        });
};

let setTimer = (key, ticks) => {
    let nextTick = _.get(Memory, ["overlord", "timer", key, "nextTick"]);

    if (nextTick == null || Game.time > nextTick) {
        _.set(Memory, ["overlord", "timer", key, "nextTick"], Game.time + ticks);
    }
};

let getTimer = (key) => {
    return _.get(Memory, ["overlord", "timer", key, "nextTick"], 0) - Game.time;
};

let isTimer = (key) => {
    return this.getTimer(key) === 0;
};

let timer = (key, ticks) => {
    setTimer(key, ticks);
    return getTimer(key);
};

let setCounter = (key, reset) => {
    let lastCount = _.get(Memory, ["overlord", "counter", key, "c"]);

    if (lastCount == null || reset() === true) {
        _.set(Memory, ["overlord", "counter", key, "c"], 0);
    } else {
        _.set(Memory, ["overlord", "counter", key, "c"], ++lastCount);
    }
};

let getCounter = (key) => {
    return _.get(Memory, ["overlord", "counter", key, "c"], 0);
};

module.exports = {D, Mod, Balancer, isString, assignOptions, clearDeadMemory, setCounter, setTimer, getTimer, isTimer, getCounter, timer};