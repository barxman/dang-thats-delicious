const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});

storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of wes, wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // lookup stores and populate reviews
    { $lookup: { 
      from: 'reviews',
      localField: '_id',
      foreignField: 'store',
      as: 'reviews' 
    }},
    // filter for only items that have more than 1 review
    { $match: {
      'reviews.1': {$exists:true}
    }},
    // add the average reviews field
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.rating' }
    }},
    // sort by the new field, highest first
    { $sort: {
      averageRating: -1
    }},
    // limit to at most 10
    { $limit: 10 }
  ]);
}

// select reviews r where r.store = this._id
// normally lazily evaluated - but see the toJSON and toObject items in teh schema to force it 
// to be included when using those functions. 
// Note that this is a mongoose function (not mongodb)
storeSchema.virtual('reviews', { 
  ref: 'Review', // what model is linkes
  localField: '_id', // which field on the store
  foreignField: 'store' // which field on review
});

function autopopulate(next) {
  this.populate('reviews');
  next(); 
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Store', storeSchema);