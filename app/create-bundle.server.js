import { authenticate } from "./shopify.server";
import prisma from "./db.server";

export async function createBundle(request, formData) {
  const { admin } = await authenticate.admin(request);
  const bundleData = JSON.parse(formData.get('formData'));
  const session = await prisma.session.findFirst();
    if (!session) {
      throw new Error("No session found. Please ensure you have at least one session in the database.");
    }
    const offerData = {
      bundleName: bundleData.bundleName,
      createSectionBlock: bundleData.createSectionBlock,
      description: bundleData.description, 
      discountType: bundleData.discountType,
      discountValue: bundleData.discountValue,
      startDate: bundleData.startDate === 'null' ? new Date() : new Date(bundleData.startDate),
      endDate: bundleData.endDate === 'null' ? null :  new Date(bundleData.endDate),
      products: JSON.stringify(bundleData.products),
      userId: session.id
      
    };  
    await prisma.bundle.create({ data: offerData })

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