import { get, post, put, del } from './api';

// Add missing 'del' method to api.js if it doesn't exist
// This method should be added to api.js in a real implementation

// Get all products
export const getAllProducts = async () => {
  return await get('/api/products/');
};

// Get a single product by ID
export const getProductById = async (productId) => {
  return await get(`/api/products/${productId}`);
};

// Create a new product
export const createProduct = async (productData) => {
  return await post('/api/products/', productData);
};

// Update an existing product
export const updateProduct = async (productId, productData) => {
  return await put(`/api/products/${productId}`, productData);
};

// Delete a product
export const deleteProduct = async (productId) => {
  return await del(`/api/products/${productId}`);
};

// Create multiple products in bulk
export const createBulkProducts = async (productsData) => {
  return await post('/api/products/bulk/', productsData);
};

// Map frontend product model to backend API model
export const mapToApiModel = (product) => {
  return {
    name: product.name,
    pn: product.code,
    search_terms: product.name, // Using name as search terms for now
    family: product.category,
    reference_price: parseFloat(product.referencePrice) || parseFloat(product.currentPrice) || 0,
    is_active: product.status === 'active'
  };
};

// Map backend API model to frontend product model
export const mapFromApiModel = (apiProduct) => {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    code: apiProduct.pn,
    category: apiProduct.family || 'outros',
    currentPrice: apiProduct.current_price || apiProduct.reference_price || 0,
    referencePrice: apiProduct.reference_price || 0,
    seller: apiProduct.seller || 'Não especificado',
    authorized: apiProduct.is_authorized || false,
    lastUpdate: apiProduct.last_update || new Date().toISOString(),
    priceVariation: apiProduct.price_variation || 0,
    hasAlert: apiProduct.has_alert || false,
    status: apiProduct.is_active ? 'active' : 'inactive',
    createdAt: apiProduct.created_at || new Date().toISOString(),
    imageUrl: apiProduct.image_url || ''
  };
};
