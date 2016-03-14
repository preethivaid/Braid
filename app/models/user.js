var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = function(io) {

    var Convo = mongoose.models.Convo || require('./convo')(io);

    var Schema = mongoose.Schema;

    var userSchema = new Schema({
        username: {type: String, required: true}
    });

    userSchema.post('remove', function() {
        // find, loop, and instance-level remove, instead of simply model-level remove all at once which doesn't trigger middleware hooks
        Convo.find({$or: [{user_id_0: this._id}, {user_id_1: this._id}]}, function(err, convos) {
            _.each(convos, function(convo) {
                convo.remove();
            });
        });
    });

    return mongoose.model('User', userSchema);

};
