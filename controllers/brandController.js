require("dotenv").config();

var Item = require("../models/item");
var Brand = require("../models/brand");
var Category = require("../models/category");
var async = require("async");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const { uploadFile, deleteFile } = require("../s3");

// Display list of all brands.
exports.brand_list = function (req, res, next) {
  async.parallel(
    {
      list_brand: function (callback) {
        Brand.find({}, "name imageURL admin")
          .sort({ name: 1 })
          .populate("name")
          .exec(callback);
      },
      brand_count: function (callback) {
        Brand.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.list_brand == null) {
        // No results.
        var err = new Error("Brand not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("brand_list", {
        title: "Brands - Party Planner",
        brand_list: results.list_brand,
        brand_count: results.brand_count,
      });
    }
  );
};

// Display detail page for a specific brand.
exports.brand_detail = function (req, res, next) {
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },
      brand_items: function (callback) {
        Item.find(
          { brand: req.params.id },
          "name price brand stock description categories imageURL admin"
        )
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
      item_count: function (callback) {
        Item.countDocuments({ brand: req.params.id }, callback); // Pass an empty object as match condition to find all documents of this collection
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } // Error in API usage.
      if (results.brand == null) {
        // No results.
        var err = new Error("Brand not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("brand_detail", {
        title: results.brand.name + " - Party Planner",
        brand: results.brand,
        item_list: results.brand_items,
        item_count: results.item_count,
      });
    }
  );
};

// Display brand create form on GET.
exports.brand_create_get = function (req, res) {
  res.render("brand_form", {
    title: "Create Brand - Party Planner",
  });
};

// Handle brand create on POST.
exports.brand_create_post = [
  // Validate and sanitise fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // upload image to S3
    const result = await uploadFile(req.file);

    // Create a Brand object with escaped and trimmed data.
    var brand = new Brand({
      name: req.body.name,
      imageURL: result.key,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all brands and categories for form.
      async.parallel(function (err, results) {
        if (err) {
          return next(err);
        }
        res.render("brand_form", {
          title: "Create Brand",
          errors: errors.array(),
        });
      });
      return;
    } else {
      // Data from form is valid. Save brand.
      brand.save(function (err) {
        if (err) {
          return next(err);
        }
        //successful - redirect to new brand record.
        res.redirect(brand.url);
      });
    }
  },
];

// Display brand delete form on GET.
exports.brand_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: brand delete GET");
};

// Handle brand delete on POST.
exports.brand_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: brand delete POST");
};

// Display brand update INFO form on GET.
exports.brand_update_get = function (req, res, next) {
  Brand.findById(req.params.id, function (err, brand) {
    if (err) {
      return next(err);
    }
    if (brand == null) {
      // No results.
      var err = new Error("Brand not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("brand_update_info", {
      title: "Update Brand - Party Planner",
      brand: brand,
    });
  });
};

// Handle brand update INFO on POST.
exports.brand_update_post = [
  // Validate and santize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Brand object with escaped and trimmed data.
    var brand = new Brand({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("brand_form", {
        title: "Update Brand",
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Brand.findByIdAndUpdate(req.params.id, brand, {}, function (err, brand) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to genre detail page.
        res.redirect(brand.url);
      });
    }
  },
];

// Display brand update IMAGE form on GET.
exports.brand_update_image_get = function (req, res, next) {
  Brand.findById(req.params.id, function (err, brand) {
    if (err) {
      return next(err);
    }
    if (brand == null) {
      // No results.
      var err = new Error("Brand not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("brand_update_image", {
      title: "Update Brand image - Party Planner",
      brand: brand,
    });
  });
};

// Handle brand update IMAGE on POST.
exports.brand_update_image_post = [
  // Validate and santize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // upload image to S3
    const result = await uploadFile(req.file);
    // Create a Brand object with escaped and trimmed data.
    var brand = new Brand({
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
      res.render("brand_form", {
        title: "Update Brand",
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Brand.findByIdAndUpdate(req.params.id, brand, {}, function (err, brand) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to genre detail page.
        res.redirect(brand.url);
      });
    }
  },
];
