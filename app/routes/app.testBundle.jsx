import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const bundleTitle = formData.get("bundleTitle");
  const productIds = formData.getAll("productIds");

  try {
    const response = await admin.graphql(
      `mutation productBundleCreate($input: ProductBundleInput!) {
        productBundleCreate(input: $input) {
          productBundle {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            title: bundleTitle,
            products: productIds.map(id => ({ id })),
          },
        },
      }
    );

    const responseJson = await response.json();
    return json(responseJson.data.productBundleCreate);
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};

export default function BundleCreator() {
  const actionData = useActionData();
  const submit = useSubmit();

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(event.target, { method: "post" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="bundleTitle" placeholder="Bundle Title" required />
      <input type="text" name="productIds" placeholder="Product ID" required />
      <input type="text" name="productIds" placeholder="Product ID" />
      <button type="submit">Create Bundle</button>
      {actionData?.productBundle && (
        <p>Bundle created: {actionData.productBundle.title}</p>
      )}
      {actionData?.userErrors && (
        <ul>
          {actionData.userErrors.map((error, index) => (
            <li key={index}>{error.message}</li>
          ))}
        </ul>
      )}
    </form>
  );
}