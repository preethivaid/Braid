var mongoose = require('mongoose');
var _ = require('underscore');
var passportLocalMongoose = require('passport-local-mongoose');


module.exports = function(io) {

    var Convo = require('./convo')(io);
    var Friendship = require('./friendship')(io);

    var Schema = mongoose.Schema;

    var userSchema = new Schema({
        username: {type: String, required: true, unique: true}
    });

    userSchema.post('remove', function() {
        // find, loop, and instance-level remove, instead of simply model-level remove all at once which doesn't trigger middleware hooks
        Convo.find({$or: [{user_id_0: this._id}, {user_id_1: this._id}]}, function(err, convos) {
            _.each(convos, function(convo) {
                convo.remove();
            });
        });
        // find, loop, and instance-level remove, instead of simply model-level remove all at once which doesn't trigger middleware hooks
        Friendship.find({$or: [{requester_id: this._id}, {target_id: this._id}]}, function(err, friendships) {
            _.each(friendships, function(friendship) {
                friendship.remove();
            });
        });
    });

    userSchema.plugin(passportLocalMongoose);

    // if the model already exists, use the existing model
    return mongoose.models.User || mongoose.model('User', userSchema);

};
