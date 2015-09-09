var ClassHooks = require('cloud/classes/class.hooks'),
    Team;

Team = Parse.Object.extend('Team', {

    // Instance methods

    isNew: function() {
        return +this.createdAt === +this.updatedAt;
    }

}, {

    // Class methods

    query: function() {
        return new Parse.Query(this);
    },

    hooks: new ClassHooks(Team)

});

module.exports = Team;
