var ClassHooks = require('cloud/classes/class.hooks'),
    Game;

Game = Parse.Object.extend('Game', {

    // Instance methods

    isNew: function() {
        return +this.createdAt === +this.updatedAt;
    },

    getWinner: function() {
        return this.get('player1Score') >
                    this.get('player2Score') ?
                        this.get('player1') :
                        this.get('player2');
    },

    getLoser: function() {
        return this.get('player1Score') <
                    this.get('player2Score') ?
                        this.get('player1') :
                        this.get('player2');
    },

    getTotalPoints: function() {
        return this.get('player1Score') + this.get('player2Score');
    },

    getWinnerPoints: function() {
        return Math.max(this.get('player1Score'), this.get('player2Score'));
    },

    getLoserPoints: function() {
        return Math.min(this.get('player1Score'), this.get('player2Score'));
    }

}, {

    // Class methods

    query: function() {
        return new Parse.Query(this);
    },

    hooks: new ClassHooks(Game)

});

module.exports = Game;
