var ClassHooks = require('cloud/classes/class.hooks'),
    Season;

Season = Parse.Object.extend('Season', {

    // Instance methods

    isNew: function() {
        return +this.createdAt === +this.updatedAt;
    }

}, {

    // Class methods

    query: function() {
        return new Parse.Query(this);
    },

    hooks: new ClassHooks(Season)

});

module.exports = Season;
