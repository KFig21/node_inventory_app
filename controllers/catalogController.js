var Item = require("../models/item");
var Brand = require("../models/brand");
var Category = require("../models/category");

var async = require("async");

exports.index = function (req, res) {
  // res.render("index", { title: "Catalog" });

  async.parallel(
    {
      item_count: function (callback) {
        Item.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      brand_count: function (callback) {
        Brand.countDocuments({}, callback);
      },
      category_count: function (callback) {
        Category.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Catalog - Party Planner",
        error: err,
        data: results,
      });
    }
  );
};
