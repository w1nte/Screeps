

let Flags = {

    run() {
        _.each(Game.flags, (f) => {
            console.log(f.secondaryColor);
        });
    }

};

module.exports = Flags;