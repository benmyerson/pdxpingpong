var Season = Parse.Object.extend('Season', {

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

module.exports = Season;
