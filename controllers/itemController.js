require("dotenv").config();

var Item = require("../models/item");
var Brand = require("../models/brand");
var Category = require("../models/category");
var async = require("async");
const { body, validationResult } = require("express-validator");
const fs = require("fs");

// Display list of all items.
exports.item_list = function (req, res) {
  async.parallel(
    {
      list_item: function (callback) {
        Item.find({}, "name price brand stock description categories imageURL")
          .sort({ name: 1 })
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
      item_count: function (callback) {
        Item.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.list_item == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("item_list", {
        title: "Items - Party Planner",
        item_list: results.list_item,
        item_count: results.item_count,
      });
    }
  );
};

// Display detail page for a specific item.
exports.item_detail = function (req, res, next) {
  // res.send("NOT IMPLEMENTED: item detail: " + req.params.id);

  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id)
          .populate("categories")
          .populate("brand")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("item_detail", {
        title:
          results.item.brand[0].name +
          " " +
          results.item.name +
          " - Party Planner",
        name: results.item.name,
        item: results.item,
      });
    }
  );
};

// Display item create form on GET.
exports.item_create_get = function (req, res) {
  async.parallel(
    {
      brands: function (callback) {
        Brand.find(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("item_form", {
        title: "Create Item - Party Planner",
        brands: results.brands,
        categories: results.categories,
      });
    }
  );
};

// Handle item create on POST.
exports.item_create_post = [
  // Convert the category to an array.
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  // Validate and sanitise fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("brand", "Brand must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
  body("stock", "Stock must not be empty").trim().isLength({ min: 1 }).escape(),
  body("category.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Item object with escaped and trimmed data.
    var item = new Item({
      name: req.body.name,
      brand: req.body.brand,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      categories: req.body.category,
      imageURL: req.file.filename,
    });

    if (req.file && errors.isEmpty()) {
      item.imageURL = req.file.filename;
      fs.unlink(`public/images/${req.body.fileName}`, (err) => {
        if (err) console.log(err);
        console.log(req.body.fileName, "was deleted");
      });
    } else if (
      req.body.fileName &&
      req.body.fileName != "null" &&
      req.body.fileName != "undefined"
    ) {
      item.imageURL = req.body.fileName;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      // Get all brands and categories for form.
      async.parallel(
        {
          brands: function (callback) {
            Brand.find(callback);
          },
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }
          // Mark our selected categories as checked.
          for (let i = 0; i < results.categories.length; i++) {
            if (item.categories.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("item_form", {
            title: "Create Item",
            brands: results.brands,
            categories: results.categories,
            description: results.description,
            stock: results.stock,
            price: results.price,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Save item.
      item.save(function (err) {
        if (err) {
          return next(err);
        }
        //successful - redirect to new item record.
        res.redirect(item.url);
      });
    }
  },
];

// Display item delete form on GET.
exports.item_delete_get = function (req, res, next) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id)
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        res.redirect("/catalog/item");
      }
      // Successful, so render.
      res.render("item_delete", {
        title: "Delete Item - Party Planner",
        item: results.item,
      });
    }
  );
};

// Handle item delete on POST.
exports.item_delete_post = function (req, res, next) {
  // Assume the post has valid id (ie no validation/sanitization).

  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.body.id)
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success

      // Delete item image from public/images folder
      fs.unlink(`public/images/${results.item.imageURL}`, (err) => {
        if (err) console.log(err);
        console.log(results.item.imageURL, "was deleted");
      });

      // Delete object and redirect to the list of items.
      Item.findByIdAndRemove(req.body.id, function deleteItem(err) {
        if (err) {
          return next(err);
        }
        // Success - got to books list.
        res.redirect("/catalog/item");
      });
    }
  );
};

// Display item update INFO form on GET.
exports.item_update_get = function (req, res, next) {
  // Get item, brand and categories for form.
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id)
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
      brands: function (callback) {
        Brand.find(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      console.log("ITEM", results.item);
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected categories as checked.
      for (
        var all_category_iterations = 0;
        all_category_iterations < results.categories.length;
        all_category_iterations++
      ) {
        for (
          var item_category_iterations = 0;
          item_category_iterations < results.item.categories.length;
          item_category_iterations++
        ) {
          if (
            results.categories[all_category_iterations]._id.toString() ===
            results.item.categories[item_category_iterations]._id.toString()
          ) {
            results.categories[all_category_iterations].checked = "true";
          }
        }
      }
      res.render("item_update_info", {
        title: "Update Item - Party Planner",
        brands: results.brands,
        categories: results.categories,
        item: results.item,
      });
    }
  );
};

// Handle item update INFO on POST.
exports.item_update_post = [
  // Convert the category to an array.
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  // Validate and sanitise fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("brand", "Brand must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
  body("stock", "Stock must not be empty").trim().isLength({ min: 1 }).escape(),
  body("category.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // Create a Item object with escaped and trimmed data.
    var item = new Item({
      name: req.body.name,
      brand: req.body.brand,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      categories: req.body.category,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      console.log("ERRORs", errors);
      // Get all brands and categories for form
      async.parallel(
        {
          brands: function (callback) {
            Brand.find(callback);
          },
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected categories as checked.
          for (let i = 0; i < results.categories.length; i++) {
            if (item.categories.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("item_update_info", {
            title: "Update Item",
            brands: results.brands,
            categories: results.categories,
            description: results.description,
            stock: results.stock,
            price: results.price,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Item.findByIdAndUpdate(req.params.id, item, {}, function (err, item) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to item detail page.
        res.redirect(item.url);
      });
    }
  },
];

// Display item update IMAGE form on GET.
exports.item_update_image_get = function (req, res, next) {
  // Get item, brand and categories for form.
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id)
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
      brands: function (callback) {
        Brand.find(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      console.log("ITEM", results.item);
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected categories as checked.
      for (
        var all_category_iterations = 0;
        all_category_iterations < results.categories.length;
        all_category_iterations++
      ) {
        for (
          var item_category_iterations = 0;
          item_category_iterations < results.item.categories.length;
          item_category_iterations++
        ) {
          if (
            results.categories[all_category_iterations]._id.toString() ===
            results.item.categories[item_category_iterations]._id.toString()
          ) {
            results.categories[all_category_iterations].checked = "true";
          }
        }
      }
      res.render("item_update_image", {
        title: "Update Image - Party Planner",
        brands: results.brands,
        categories: results.categories,
        item: results.item,
      });
    }
  );
};

// Handle item update IMAGE on POST.
exports.item_update_image_post = [
  // Convert the category to an array.
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // Create a Item object with escaped and trimmed data. IDK why but we need the brands and categories, they are hidden in the form. MONGO DB seems to clear item arrays on update for any field
    var item = new Item({
      oldImageURL: req.body.oldImageURL,
      brand: req.body.brand,
      categories: req.body.category,
      _id: req.params.id,
    });
    // set image file
    if (req.file && errors.isEmpty()) {
      item.imageURL = req.file.filename;
      fs.unlink(`public/images/${req.body.oldImageURL}`, (err) => {
        if (err) console.log(err);
        console.log(req.body.oldImageURL, "was deleted");
      });
    } else if (
      req.body.fileName &&
      req.body.fileName != "null" &&
      req.body.fileName != "undefined"
    ) {
      item.imageURL = req.body.fileName;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      console.log("ERRORs", errors);
      // Get all brands and categories for form
      async.parallel(
        {
          brands: function (callback) {
            Brand.find(callback);
          },
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected categories as checked.
          for (let i = 0; i < results.categories.length; i++) {
            if (item.categories.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("item_update_image", {
            title: "Update Item",
            item: item,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Item.findByIdAndUpdate(req.params.id, item, {}, function (err, item) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to item detail page.
        res.redirect(item.url);
      });
    }
  },
];
