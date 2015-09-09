var ClassHooks = require('cloud/classes/class.hooks'),
    Player;

Player = Parse.Object.extend('Player', {

    // Instance methods

    isNew: function() {
        return +this.createdAt === +this.updatedAt;
    },

    getWinPercentage: function() {
        return this.get('wins') / this.get('games');
    },

    getLossPercentage: function() {
        return this.get('losses') / this.get('games');
    },

    getAveragePointsPerGame: function() {
        return this.get('totalPoints') / this.get('games');
    },

    getAverageOpponentPointsPerGame: function() {
        return this.get('opponentTotalPoints') / this.get('games')
    },

    updateWinningStreak: function() {
        if (this.get('streak') > 0) {
            this.increment('streak');
        } else {
            this.set('streak', 1);
        }
    },

    updateLosingStreak: function() {
        if (this.get('streak') < 0) {
            this.increment('streak', -1);
        } else {
            this.set('streak', -1);
        }
        return this;
    }

}, {

    // Class methods

    query: function() {
        return new Parse.Query(this);
    },

    hooks: new ClassHooks(Player)

});

module.exports = Player;
