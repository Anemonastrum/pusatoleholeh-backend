import { body, param } from "express-validator";

export const validateShopCreation = [
  body("name").notEmpty().withMessage("Shop name is required"),
  body("description")
    .isLength({ max: 500 })
    .withMessage("Description should not exceed 500 characters"),
];

export const validateShopUpdate = [
  body("name").optional().notEmpty().withMessage("Name should not be empty"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description should not exceed 500 characters"),
];

export const validateUserUpdate = [
  body("name").notEmpty().withMessage("Name should not be empty"),
  body("phoneNumber")
    .isLength({ min: 10, max: 13 })
    .withMessage("Invalid phone number."),
];

export const validateProductCreation = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 1000 })
    .withMessage("Description should not exceed 1000 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

export const validateProductUpdate = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Product name should not be empty"),
  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description should not exceed 1000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

export const validateCategoryId = [
  param('categoryId').isMongoId().withMessage('Invalid category ID')
];

export const validateAddCategory = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required')
];

export const validateUpdateCategory = [
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
];

export const validateArticleCreation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isMongoId()
    .withMessage("Invalid Category ID"),
  body("productIds")
    .optional()
    .isArray()
    .withMessage("Product IDs must be an array")
    .custom((productIds) => {
      return productIds.every((id) =>
        /^[0-9a-fA-F]{24}$/.test(id)
      ); // Validate each ID is a valid MongoDB ObjectId
    })
    .withMessage("Invalid Product IDs"),
];

export const validateReviewCreation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isMongoId()
    .withMessage('Invalid transaction ID format'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters')
];

export const validateReviewUpdate = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters')
];