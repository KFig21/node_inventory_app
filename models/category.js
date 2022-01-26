var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CategorySchema = new Schema({
  name: { type: String, required: true, maxLength: 40 },
  imageURL: { type: String, required: true },
  admin: { type: Boolean, required: true, default: false },
});

// Virtual for author's URL
CategorySchema.virtual("url").get(function () {
  return "/catalog/category/" + this._id;
});

//Export model
module.exports = mongoose.model("Category", CategorySchema);
