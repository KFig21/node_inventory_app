var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ItemSchema = new Schema({
  name: { type: String, required: true, maxLength: 40 },
  price: { type: Number, required: true, maxlength: 9999 },
  description: { type: String, required: true, maxLength: 300 },
  stock: { type: Number, required: true, maxlength: 9999 },
  brand: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  imageURL: { type: String, required: false },
  admin: { type: Boolean, required: true, default: false },
});

// Virtual for item's URL
ItemSchema.virtual("url").get(function () {
  return "/catalog/item/" + this._id;
});

//Export model
module.exports = mongoose.model("Item", ItemSchema);
