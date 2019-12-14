let util = require('util');
let _roles = require('roles');
let _creepEgg = require('creepegg');

/*
    It controls each room
 */
class Hive extends util.Mod {

    constructor(room) {
        super(["hive", room instanceof Room ? room.name : Game.rooms[room]]);

        // room of the hive
        this.room = room;
    }

    init() {
        // What should the Hive do
        this.plan = {};

        // Behavior of the hive
        this.memory.protocol = this._get('protocol', PROTOCOL_DEFAULT);

        this.spawnMod = this.getSpawnMod();

        // creeps to spawn
        this.production = {};
    }

    run(balancer) {
        let room = this.room;
        let protocol = this.memory.protocol;
        let spawnMod = this.spawnMod;
        let enemies = room.find(FIND_HOSTILE_CREEPS);

        if (!spawnMod)
            throw new Error("No SpawnMod at Hive " + this.room.name);

        // Protocols

        console.log("Room " + room.name + " Protocol " + protocol);

        if (this.memory.protocol !== PROTOCOL_EMERGENCY) {
            _.set(Memory, ['overlord', 'emergency'], false);

            if (room.storage) {

                if (room.storage.store[RESOURCE_ENERGY] >= 800000) {
                    this.setProtocol(PROTOCOL_UPGRADE);
                } else if (room.storage.store[RESOURCE_ENERGY] <= 500000) {
                    if (room.storage.store[RESOURCE_ENERGY] <= 10000) {
                        this.setProtocol(PROTOCOL_LOAD);
                    } else if (room.storage.store[RESOURCE_ENERGY] >= 200000) {
                        this.setProtocol(PROTOCOL_DEFAULT);
                    }
                }
            }

        } else {
            _.set(Memory, ['overlord', 'emergency'], true);

            if (Game.time - spawnMod.memory.lastSpawn <= 10)
                this.setProtocol(PROTOCOL_DEFAULT);
        }

        if (enemies.length >= 2 || (!_.has(room, ['storage']) && enemies.length >= 1)) {
            this.setProtocol(PROTOCOL_DEFENSE);
            // this.memory.attacks = _.get(this, ['memory', 'attacks'], []).push(
            //     [Game.time, enemies.owner.username || 'Bots']
            // );
            // if (this.memory.attacks.length > 30)
            //     this.memory.attacks.shift();
        }

        // Define Creep Eggs

        let harvester = new _creepEgg.CreepEgg('harvester', {
            name: 'H' + Game.time,
            priority: 10,
        });

        let builder = new _creepEgg.CreepEgg('builder', {
            name: 'B' + Game.time,
            maxEnergy: 0.5,
            priority: 100,
        });

        let carrier = new _creepEgg.CreepEgg('carrier', {
            name: 'C' + Game.time,
            maxEnergy: 0.5,
            priority: 11,
        });

        let towercarrier = new _creepEgg.CreepEgg('carrier', {
            name: 'C' + Game.time,
            priority: 11,
        });

        let defender = new _creepEgg.CreepEgg('defender', {
            name: 'D' + Game.time,
            maxEnergy: room.energyAvailable,
            priority: 1
        });

        let longrange_harvester = (room) => {return new _creepEgg.CreepEgg('longrange_harvester', {
            name: 'L' + Game.time,
            priority: 110,
            memory: {
                toHarvest: room
            }
        })};

        let upgrader = new _creepEgg.CreepEgg('upgrader', {
            name: 'U' + Game.time,
            priority: 50,
            maxEnergy: room.energyCapacityAvailable * 0.5
        });

        // ----------------------------------------------------------#

        if (this.memory.protocol === PROTOCOL_EMERGENCY) {
            harvester.maxEnergy = room.energyAvailable;
            carrier.maxEnergy = room.energyAvailable;
        }

        if (!_.has(room, ['storage'])) {
            // start phase, no protocols, except defense
            this.spawn('h1', harvester, _.get(this.plan, ['creeps', 'harvester'], 3));
            this.spawn('u1', upgrader, _.get(this.plan, ['creeps', 'upgrader'], 4));
        } else {

            let energyInStorage = room.storage.store[RESOURCE_ENERGY];

            this.spawn('h1', harvester, _.get(this.plan, ['creeps', 'harvester'], 3));
            this.spawn('c1', carrier, _.get(this.plan, ['creeps', 'carrier'], 2));
            this.spawn('u1', upgrader, _.get(this.plan, ['creeps', 'upgrader'], 2));

            if (this.memory.protocol === PROTOCOL_UPGRADE) {
                harvester.maxEnergy = 0.8;
                this.setSpawnNumber('c1', 8);
            } else if (this.memory.protocol === PROTOCOL_LOAD) {
                this.setSpawnNumber('c1', 2);
                this.setSpawnNumber('u1', 1);
                upgrader.maxEnergy = 0.3;
            }

            if (energyInStorage >= 500000)
                this.setSpawnNumber('c1', 3);

            if (energyInStorage >= 10000)
                carrier.priority = 1;

            if (protocol === PROTOCOL_DEFENSE) {
                this.setSpawnNumber('u1', 1);
                this.setSpawnNumber('c1', 3);
            }

            // colonize if gcl level is enough
            if (this.plan.colonize) {
                for (let i = 0; i < this.plan.colonize.length; i++) {
                    let room = this.plan.colonize[i];
                    if (Game.rooms[room] && Game.rooms[room].controller.my && Game.rooms[room].energyCapacityAvailable > 400)
                        continue;

                    if (!_.has(Game.rooms, [room]) || !Game.rooms[room].controller.my)
                        this.spawn('Colonizer' + room, new _creepEgg.CreepEgg('colonizer', {
                            name: 'Colonizer' + Game.time,
                            memory: {
                                toColonize: room
                            }
                        }), 1);
                    else
                        this.spawn('helper' + room, new _creepEgg.CreepEgg('harvester', {
                            name: 'Helper' + Game.time,
                            home: Game.rooms[room]
                        }), 4);

                    break;
                }
            }

        }

        // only produce builder if construction sites exist
        let constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
            let restProgress = 0;
            _.each(constructionSites, (c) => {
                restProgress += c.progressTotal - c.progress;
            });
            this.spawn('b1', builder, Math.ceil(restProgress / 20000));
        }

        // if (protocol === PROTOCOL_DEFENSE)
        //     production['def'] = [defender, 1];

        _.each(this.plan.harvest, (p) => {
            this.spawn('l' + p[0], longrange_harvester(p[0]), p[2] || 1);
        });

        spawnMod.setAutoProduction(this.production);

        let creeps = this.getCreeps();
        _.each(creeps, (creep) => {
            _roles.run(creep);
        });

        let towers = this.room.find(FIND_STRUCTURES, {
            filter: (struct) => { return struct.structureType === STRUCTURE_TOWER }
        });

        _.each(towers, (tower) => {

            if (enemies.length > 0) {
                let hostile = enemies;

                hostile.sort((a, b) => {
                    return (a.hits - b.hits) * (tower.pos.getRangeTo(a) - tower.pos.getRangeTo(b));
                });

                tower.attack(hostile[0]);
            } else {
                let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => !(structure.structureType === STRUCTURE_WALL && structure.hits > 10000) && !(structure.structureType === STRUCTURE_RAMPART && structure.hits > 10000) && structure.hits < structure.hitsMax
                });

                if(closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                }
            }
        });
    }

    /*
        Return all creeps of this hive
     */
    getCreeps() {
        let creeps = [];
        _.each(Game.creeps, (creep) => {
            if (creep.my && (_.get(creep, ['memory', 'hive'], _.get(creep, ['memory', 'home', 'name'])) === this.room.name || (creep.spawning && creep.room === this.room))) {
                creeps.push(creep);
            }
        });
        return creeps;
    }

    /*
        Return all creeps of this hive, related by memory value
     */
    getCreepsBy(memory, defaultBy) {
        if (!Array.isArray(memory))
            memory = [memory];

        if (defaultBy === undefined)
            defaultBy = 'none';

        let creeps = {};
        _.each(this.getCreeps(), (creep) => {
            let s = _.get(creep, ['memory'].concat(memory), defaultBy);
            _.set(creeps, [s], _.get(creeps, [s], []).concat([creep]));
        });
        return creeps;
    }

    /*
        Return all creeps of this hive, related by their roles
     */
    getCreepsByRoles() {
        return this.getCreepsBy(['role']);
    }

    /*
        Return all creeps of this hive, related by their groups
     */
    getCreepsByGroups() {
        return this.getCreepsBy(['group']);
    }

    getSpawnMod() {
        return _.get(this.balancer.getMods((mod) => { return mod.constructor.name === 'SpawnMod' && mod.room === this.room; }), [0]);
    }

    setProtocol(protocol) {
        this.memory.protocol = protocol;
    }

    getProtocol() {
        return this.memory.protocol;
    }

    spawn(groupName, creepEgg, number) {
        if (number === undefined)
            number = 1;

        this.production[groupName] = [creepEgg, number];
    }

    setSpawnNumber(groupName, number) {
        if (_.has(this.production, [groupName]))
            this.production[groupName][1] = number;
    }

    clearSpawn() {
        this.spawnMod.clearSpawnList();
    }

    static priority() {
        return 10;
    }
}

module.exports = {Hive};