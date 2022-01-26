var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var BrandSchema = new Schema({
  name: { type: String, required: true, maxLength: 40 },
  imageURL: { type: String, required: true },
  admin: { type: Boolean, required: true, default: false },
});

// Virtual for brand's URL
BrandSchema.virtual("url").get(function () {
  return "/catalog/brand/" + this._id;
});

//Export model
module.exports = mongoose.model("Brand", BrandSchema);
