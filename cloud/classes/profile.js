var ClassHooks = require('cloud/classes/class.hooks'),
    Profile;

Profile = Parse.Object.extend('Profile', {

    // Instance methods

    isNew: function() {
        return +this.createdAt === +this.updatedAt;
    }

}, {

    // Class methods

    query: function() {
        return new Parse.Query(this);
    },

    hooks: new ClassHooks(Profile)

});

module.exports = Profile;
