var Profile = Parse.Object.extend('Profile', {

    // Instance methods

    isNew: function() {
        return +this.createdAt === +this.updatedAt;
    }

}, {

    // Class methods

    query: function() {
        return new Parse.Query(this);
    }

});

module.exports = Profile;
