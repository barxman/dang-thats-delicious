const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const reviewSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId, 
        ref: 'User',
        required: 'Your must supply an Author'
    },
    store: {
        type: mongoose.Schema.ObjectId, 
        ref: 'Store',
        required: 'Your must supply a Store'
    },
    text: {
        type: String,
        required: 'Your review must have Text'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
});

function autopopulate(next) {
    this.populate('author'); 
    next(); 
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);
