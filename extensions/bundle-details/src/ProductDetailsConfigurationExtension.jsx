import React from "react";
import {
  reactExtension,
  useApi,
  Box,
  Text,
  Link,
  Image,
  BlockStack,
  InlineStack,
  
  
} from "@shopify/ui-extensions-react/admin";
export default reactExtension(
  "admin.product-details.configuration.render",
  () => <App />,
);


function App() {
  const { data, error } = useApi();

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  if (!data || !data.product || !data.product.productComponents) {
    return <Text>Loading...</Text>;
  }

  return (
    <BlockStack gap>
      {data.product.productComponents.map((component) => (
        <Box padding='small'   key={component.id}>
        
          <InlineStack gap >
          
                <Box blockSize="50" inlineSize="10%" >
                <Link
            to={`shopify://admin/products/${component.id.split("/").pop()}`}
            external
          >
                <Image 
                  loading="lazy"
                  source={component.featuredImage?.url || ""}
                    alt={component.title || ""}
                />
          </Link>

              </Box>
              

              <BlockStack  >
                <Box>
                <Text variant="headingLg ">{component.title}</Text>

                </Box>
                <Box>
                <Text variant="bodySm" color="black">
                  {component.totalVariants}{" "}
                  {component.totalVariants === 1 ? "variant" : "variants"}
                </Text>
                </Box>
              </BlockStack>
            </InlineStack>
        </Box>

      ))}
    </BlockStack>
  );
}
