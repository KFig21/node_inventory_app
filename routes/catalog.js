require("dotenv").config();
var express = require("express");
var router = express.Router();

// Require controller modules.
var catalog_controller = require("../controllers/catalogController");
var item_controller = require("../controllers/itemController");
var brand_controller = require("../controllers/brandController");
var category_controller = require("../controllers/categoryController");

var multer = require("multer");
var path = require("path");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
  limits: { fileSize: 1000000 },
});

/// FOOD ROUTES ///

// GET catalog home page.
router.get("/", catalog_controller.index);

// GET request for creating a item. NOTE This must come before routes that display item (uses id).
router.get("/item/create", item_controller.item_create_get);

// POST request for creating item.
router.post(
  "/item/create",
  upload.single("imageURL"),
  item_controller.item_create_post
);

// GET request to delete item.
router.get("/item/:id/delete", item_controller.item_delete_get);

// POST request to delete item.
router.post("/item/:id/delete", item_controller.item_delete_post);

// GET request to update item INFO.
router.get("/item/:id/update", item_controller.item_update_get);

// POST request to update item INFO.
router.post("/item/:id/update", item_controller.item_update_post);

// GET request to update item IMAGE.
router.get("/item/:id/update_image", item_controller.item_update_image_get);

// POST request to update item IMAGE.
router.post(
  "/item/:id/update_image",
  upload.single("imageURL"),
  item_controller.item_update_image_post
);

// GET request for one item.
router.get("/item/:id", item_controller.item_detail);

// GET request for list of all item items.
router.get("/item", item_controller.item_list);

/// Brand ROUTES ///

// GET request for creating Author. NOTE This must come before route for id (i.e. display brand).
router.get("/brand/create", brand_controller.brand_create_get);

// POST request for creating brand.
router.post(
  "/brand/create",
  upload.single("imageURL"),
  brand_controller.brand_create_post
);

// GET request to delete brand.
router.get("/brand/:id/delete", brand_controller.brand_delete_get);

// POST request to delete brand.
router.post("/brand/:id/delete", brand_controller.brand_delete_post);

// GET request to update brand INFO.
router.get("/brand/:id/update", brand_controller.brand_update_get);

// POST request to update brand INFO.
router.post("/brand/:id/update", brand_controller.brand_update_post);

// GET request to update brand IMAGE.
router.get("/brand/:id/update_image", brand_controller.brand_update_image_get);

// POST request to update brand IMAGE.
router.post(
  "/brand/:id/update_image",
  upload.single("imageURL"),
  brand_controller.brand_update_image_post
);

// GET request for one brand.
router.get("/brand/:id", brand_controller.brand_detail);

// GET request for list of all brands.
router.get("/brand", brand_controller.brand_list);

/// Category ROUTES ///

// GET request for creating a category. NOTE This must come before route that displays category (uses id).
router.get("/category/create", category_controller.category_create_get);

//POST request for creating category.
router.post(
  "/category/create",
  upload.single("imageURL"),
  category_controller.category_create_post
);

// GET request to delete category.
router.get("/category/:id/delete", category_controller.category_delete_get);

// POST request to delete category.
router.post("/category/:id/delete", category_controller.category_delete_post);

// GET request to update category INFO.
router.get("/category/:id/update", category_controller.category_update_get);

// POST request to update category INFO.
router.post("/category/:id/update", category_controller.category_update_post);

// GET request to update category IMAGE.
router.get(
  "/category/:id/update_image",
  category_controller.category_update_image_get
);

// POST request to update category IMAGE.
router.post(
  "/category/:id/update_image",
  upload.single("imageURL"),
  category_controller.category_update_image_post
);

// GET request for one category.
router.get("/category/:id", category_controller.category_detail);

// GET request for list of all category.
router.get("/category", category_controller.category_list);

module.exports = router;
