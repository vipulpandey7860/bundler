import { authenticate } from "./shopify.server";

export async function createBundle(request, bundleData) {
  const { admin } = await authenticate.admin(request);

  const CREATE_BUNDLE_MUTATION = `
    mutation productBundleCreate($input: ProductBundleCreateInput!) {
      productBundleCreate(input: $input) {
        productBundleOperation {
          status
        }
        userErrors {
          field
          message
        }
        
      }
    }
  `;

  try {
    const response = await admin.graphql(CREATE_BUNDLE_MUTATION, {
      variables: {
        input: {
          title: bundleData.title,
          components: bundleData.components.map(component => ({
            productId: component.productId,
            quantity: component.quantity,
            optionSelections: component.optionSelections.map(option => ({
              componentOptionId: option.componentOptionId,
              name: option.name,
              values: option.values
            })),
            quantityOption: component.quantityOption ? {
              name: component.quantityOption.name,
              values: component.quantityOption.values.map(value => ({
                name: value.name,
                quantity: value.quantity
              }))
            } : undefined
          }))
        }
      }
    });

    const responseJson = await response.json();
    if (responseJson.data.productBundleCreate.userErrors.length > 0) {
      throw new Error(responseJson.data.productBundleCreate.userErrors[0].message);
    }

    return responseJson.data.productBundleCreate.productBundleOperation;
  } catch (error) {
    console.error("Error creating bundle:", error);
    throw error;
  }
}