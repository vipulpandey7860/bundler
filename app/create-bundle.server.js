import { authenticate } from "./shopify.server";

export async function createBundle(request, formData) {
  const { admin } = await authenticate.admin(request);
  const bundleData = JSON.parse(formData.get('formData'));

  console.log(bundleData);

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
    // Step 1: Create the bundle product
    const createProductResponse = await admin.graphql(CREATE_PRODUCT_BUNDLE_MUTATION, {
      variables: {
          "input": {
            "title": bundleData.bundleName,
          "components": bundleData.products.map((product) => {
            return {
              "quantity": product.quantity,
              "productId": product.id,
              "optionSelections": product.options.map((option) => {
                return {
                  "componentOptionId": option.id,
                  "name": option.name,
                  "values": option.values
                }
              })
            }
          })
          }
      },
    });

    const createProductData = await createProductResponse.json();
    console.log(createProductData);
  
    return {
      success: true,
      message: "Bundle created successfully",
      data: createProductData.data.productCreate.product,
    };
  } catch (error) {
    console.error("Error creating bundle:", error);
    throw error;
  }
}

