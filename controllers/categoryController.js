require("dotenv").config();

var Item = require("../models/item");
var Brand = require("../models/brand");
var Category = require("../models/category");
var async = require("async");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const { uploadFile, deleteFile } = require("../s3");

// Display list of all category.
exports.category_list = function (req, res) {
  async.parallel(
    {
      list_category: function (callback) {
        Category.find({}, "name imageURL admin")
          .sort({ name: 1 })
          .populate("name")
          .exec(callback);
      },
      category_count: function (callback) {
        Category.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.list_category == null) {
        // No results.
        var err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("category_list", {
        title: "Categories - Party Planner",
        category_list: results.list_category,
        category_count: results.category_count,
      });
    }
  );
};

// Display detail page for a specific category.
exports.category_detail = function (req, res, next) {
  async.parallel(
    {
      category: function (callback) {
        Category.findById(req.params.id).exec(callback);
      },
      category_items: function (callback) {
        Item.find(
          { categories: req.params.id },
          "name price brand stock description categories imageURL admin"
        )
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
      item_count: function (callback) {
        Item.countDocuments({ categories: req.params.id }, callback); // Pass an empty object as match condition to find all documents of this collection
      },
    },
    function (err, results) {
      console.log("category", results.category);
      console.log("category_items", results.category_items);
      if (err) {
        return next(err);
      } // Error in API usage.
      if (results.category == null) {
        // No results.
        var err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("category_detail", {
        title: results.category.name + " - Party Planner",
        category: results.category,
        item_list: results.category_items,
        item_count: results.item_count,
      });
    }
  );
};

// Display category create form on GET.
exports.category_create_get = function (req, res) {
  res.render("category_form", {
    title: "Create Category - Party Planner",
  });
};

// Handle category create on POST.
exports.category_create_post = [
  // Validate and sanitise fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Category object with escaped and trimmed data.
    var category = new Category({
      name: req.body.name,
      imageURL: req.file.filename,
    });

    // set image file
    if (req.file && errors.isEmpty()) {
      category.imageURL = req.file.filename;
      fs.unlink(`public/images/${req.body.fileName}`, (err) => {
        if (err) console.log(err);
        console.log(req.body.fileName, "was deleted");
      });
    } else if (
      req.body.fileName &&
      req.body.fileName != "null" &&
      req.body.fileName != "undefined"
    ) {
      category.imageURL = req.body.fileName;
    }

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all categorys and categories for form.
      async.parallel(function (err, results) {
        if (err) {
          return next(err);
        }
        res.render("category_form", {
          title: "Create Category - Party Planner",
          errors: errors.array(),
        });
      });
      return;
    } else {
      // Data from form is valid. Save item.
      category.save(function (err) {
        if (err) {
          return next(err);
        }
        //successful - redirect to new item record.
        res.redirect(category.url);
      });
    }
  },
];

// Display category delete form on GET.
exports.category_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: category delete GET");
};

// Handle category delete on POST.
exports.category_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: category delete POST");
};

// Display category update INFO form on GET.
exports.category_update_get = function (req, res, next) {
  Category.findById(req.params.id, function (err, category) {
    if (err) {
      return next(err);
    }
    if (category == null) {
      // No results.
      var err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("category_update_info", {
      title: "Update Category - Party Planner",
      category: category,
    });
  });
};

// Handle category update INFO on POST.
exports.category_update_post = [
  // Validate and santize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Category object with escaped and trimmed data.
    var category = new Category({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("category_form", {
        title: "Update Category",
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Category.findByIdAndUpdate(
        req.params.id,
        category,
        {},
        function (err, category) {
          if (err) {
            return next(err);
          }
          // Successful - redirect to genre detail page.
          res.redirect(category.url);
        }
      );
    }
  },
];

// Display category update IMAGE form on GET.
exports.category_update_image_get = function (req, res, next) {
  Category.findById(req.params.id, function (err, category) {
    if (err) {
      return next(err);
    }
    if (category == null) {
      // No results.
      var err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("category_update_image", {
      title: "Update Category image - Party Planner",
      category: category,
    });
  });
};

// Handle category update IMAGE on POST.
exports.category_update_image_post = [
  // Validate and santize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // upload image to S3
    const result = await uploadFile(req.file);

    // Create a Category object with escaped and trimmed data.
    var category = new Category({
      oldImageURL: req.body.oldImageURL,
      _id: req.params.id,
      imageURL: result.key,
    });

    // delete old image from S3
    if (req.body.oldImageURL) {
      await deleteFile(req.body.oldImageURL);
    }

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("category_form", {
        title: "Update Category Image",
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Category.findByIdAndUpdate(
        req.params.id,
        category,
        {},
        function (err, category) {
          if (err) {
            return next(err);
          }
          // Successful - redirect to genre detail page.
          res.redirect(category.url);
        }
      );
    }
  },
];
