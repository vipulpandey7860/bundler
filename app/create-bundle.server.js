import { authenticate } from "./shopify.server";

export async function createBundle(request, formData) {
  const { admin } = await authenticate.admin(request);
  const bundleData = JSON.parse(formData.get('formData'));

  const CREATE_PRODUCT_BUNDLE_MUTATION = `
  mutation ProductBundleCreate($input: ProductBundleCreateInput!) {
    productBundleCreate(input: $input) {
      productBundleOperation {
        id
        __typename
      }
      userErrors {
        message
        __typename
      }
      __typename
    }
  }
  `;

  try {
    const createProductResponse = await admin.graphql(CREATE_PRODUCT_BUNDLE_MUTATION, {
      variables: {
        "input": {
          "title": bundleData.bundleName,           
          "components": bundleData.products.map((product) => ({
            "quantity": product.quantity,
            "productId": product.id,
            "optionSelections": product.options.map((option) => ({
              "componentOptionId": option.id,
              "name": option.name,
              "values": option.values
            }))
          }))
        }
      },
    });

    const productBundleData = await createProductResponse.json();
    
    if (productBundleData.data.productBundleCreate.userErrors.length > 0) {
      throw new Error(productBundleData.data.productBundleCreate.userErrors[0].message);
    }


    return {
      success: true,
      message: "Bundle created successfully",
      bundle: productBundleData.data,
    };
  } catch (error) {
    console.error("Error creating bundle:", error);
    throw error;
  }
}