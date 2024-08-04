// Assuming we have some way to import or define these types
// import { InputCart, InputCartLinesMerchandise, InputCartLinesMerchandiseOnProductVariant } from './types';

/**
 * @param {Object} input - The input data
 * @returns {Object} The function result
 */
function run(input) {
  const cartOperations = getExpandCartOperations(input.cart);
  return {
    operations: cartOperations
  };
}

/**
 * @param {InputCart} cart
 * @returns {Array} Cart operations
 */
function getExpandCartOperations(cart) {
  const result = [];

  for (const line of cart.lines) {
    const variant = line.merchandise.ProductVariant;
    if (!variant) continue;

    const componentReferences = getComponentReferences(variant);
    if (componentReferences.length === 0) continue;

    const expandRelationships = componentReferences.map(reference => ({
      merchandise_id: reference,
      quantity: 1,
      price: null,
      attributes: null
    }));

    const expandOperation = {
      type: 'expand',
      cart_line_id: line.id,
      expanded_cart_items: expandRelationships,
      price: null,
      image: null,
      title: null
    };

    result.push(expandOperation);
  }

  return result;
}

/**
 * @param {InputCartLinesMerchandiseOnProductVariant} variant
 * @returns {Array} Component references
 */
function getComponentReferences(variant) {
  if (variant.component_reference) {
    return JSON.parse(variant.component_reference.value);
  }
  return [];
}

// Export the run function
export { run };