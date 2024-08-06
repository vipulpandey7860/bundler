import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  IndexTable,
  useIndexResourceState,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Placeholder data - replace with actual API calls
  const totalBundles = 10;
  const totalSalesThroughBundles = 1000;
  const bundles = [
    { id: "1", name: "Summer Bundle", products: 3, sales: 50 },
    { id: "2", name: "Winter Bundle", products: 4, sales: 30 },
    { id: "3", name: "Spring Collection", products: 5, sales: 20 },
    { id: "4", name: "Fall Essentials", products: 3, sales: 40 },
    { id: "5", name: "Holiday Special", products: 6, sales: 60 },
  ];

  return json({
    totalBundles,
    totalSalesThroughBundles,
    bundles,
  });
};

export default function Index() {
  const { totalBundles, totalSalesThroughBundles, bundles } = useLoaderData();
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(bundles);

  const rowMarkup = bundles.map(
    ({ id, name, products, sales }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Link to={`/bundles/${id}`}>{name}</Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{products}</IndexTable.Cell>
        <IndexTable.Cell>{sales}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page title="Bundle Analytics">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variation="subdued">Total Bundles</Text>
            <Text element="h2">{totalBundles}</Text>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card sectioned>
            <Text variation="subdued">Total Sales Through Bundles</Text>
            <Text element="h2">{totalSalesThroughBundles}</Text>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Text>Bundle Details</Text>
          <Card>
            <IndexTable
              resourceName={{ singular: 'bundle', plural: 'bundles' }}
              itemCount={bundles.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: 'Bundle Name' },
                { title: 'Products' },
                { title: 'Sales' },
              ]}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}