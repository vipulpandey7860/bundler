import React, { useCallback, useState, useEffect } from "react";
import { 
  Card, 
  BlockStack, 
  Text, 
  Button, 
  ResourceList, 
  Avatar, 
  ResourceItem, 
  TextField, 
  InlineStack, 
  EmptyState, 
  InlineError, 
  Tag, 
  Banner
} from "@shopify/polaris";
import { DeleteIcon } from '@shopify/polaris-icons';

export default function ProductSelectionStep({ formData, setFormData, errors, setErrors, app }) {
  const [localErrors, setLocalErrors] = useState({});

  const validateProducts = useCallback((products) => {
    const productErrors = {};
    products.forEach(product => {
      product.options.forEach(option => {
        if (!option.values.some(v => v.selected)) {
          if (!productErrors[product.id]) {
            productErrors[product.id] = {};
          }
          productErrors[product.id][option.id] = `At least one ${option.name} must be selected`;
        }
      });
    });
    return productErrors;
  }, []);

  useEffect(() => {
    const newErrors = validateProducts(formData.products);
    setLocalErrors(newErrors);
    setErrors(prevErrors => ({
      ...prevErrors,
      products: Object.keys(newErrors).length > 0 ? "Please ensure all products have at least one option selected" : null
    }));
  }, [formData.products, setErrors, validateProducts]);

  const handleProductSelection = useCallback(async () => {
    try {
      const selection = await app.resourcePicker({
        type: "product",
        action: "select",
        filter: { variants: false, draft: false, archived: false },
        multiple: true,
        selectionIds: formData.products.map(product => ({ id: product.id }))
      });

      if (selection && selection.length > 0) {
        const newProducts = selection.map(product => {
          const existingProduct = formData.products.find(p => p.id === product.id);
          if (existingProduct) {
            // If the product was previously selected, keep its existing data
            return existingProduct;
          } else {
            // If it's a new product, create a new entry
            return {
              id: product.id,
              title: product.title,
              vendor: product.vendor,
              images: product.images,
              quantity: 1,
              options: product.options.map(option => ({
                id: option.id,
                name: option.name,
                values: option.values.map(value => ({
                  value,
                  selected: true
                }))
              }))
            };
          }
        });

        setFormData(prev => ({
          ...prev,
          products: newProducts
        }));
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  }, [app, formData.products, setFormData]);

  const handleQuantityChange = useCallback((id, quantity) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map(product =>
        product.id === id ? { ...product, quantity: parseInt(quantity, 10) || 1 } : product
      ),
    }));
  }, [setFormData]);

  const handleOptionValueToggle = useCallback((productId, optionId, value) => {
    setFormData((prev) => {
      const updatedProducts = prev.products.map(product =>
        product.id === productId
          ? {
              ...product,
              options: product.options.map(option =>
                option.id === optionId
                  ? {
                      ...option,
                      values: option.values.map(v =>
                        v.value === value ? { ...v, selected: !v.selected } : v
                      )
                    }
                  : option
              )
            }
          : product
      );

      return { ...prev, products: updatedProducts };
    });
  }, [setFormData]);

  const handleDeleteProduct = useCallback((productId) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter(product => product.id !== productId)
    }));
  }, [setFormData]);

  return (
    <Card>
      <BlockStack gap="500">
        <InlineStack align="space-between">
          <Text variant="heading2xl" as="h2">
            Select Products
          </Text>
          {formData.products.length > 0 && (
            <Button onClick={handleProductSelection} plain>
              Add product
            </Button>
          )}
        </InlineStack>
        {errors.products && <InlineError message={errors.products} />}
        {formData.products.length > 0 ? (
          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={formData.products}
            renderItem={(item) => {
              const { id, title, vendor, images, quantity, options } = item;
              const media = (
                <Avatar
                  customer
                  size="md"
                  name={title}
                  source={images[0]?.originalSrc }
                />
              );
              return (
                <ResourceItem
                  id={id}
                  media={media}
                  accessibilityLabel={`View details for ${title}`}
                >
                  <BlockStack gap="300">
                    <InlineStack gap="500" align="space-between" wrap={false}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text variant="bodyMd" fontWeight="bold" as="h3" truncate>
                          {title}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          {vendor}
                        </Text>
                      </div>
                      <InlineStack gap="300" align="center">
                        <TextField
                          label="Quantity"
                          type="number"
                          value={quantity.toString()}
                          onChange={(value) => handleQuantityChange(id, value)}
                          min={1}
                          labelHidden
                        />
                        <Button 
                          onClick={() => handleDeleteProduct(id)} 
                          tone="critical"
                          icon={DeleteIcon}
                          accessibilityLabel={`Delete ${title}`}
                        />
                      </InlineStack>
                    </InlineStack>
                    {options.map((option) => (
                      <BlockStack key={option.id} gap="200">
                        <Text variant="bodyMd" fontWeight="semibold">
                          {option.name}
                        </Text>
                        <InlineStack gap="200" wrap>
                          {option.values.map((valueObj) => (
                            <div
                              key={valueObj.value}
                              style={{ opacity: valueObj.selected ? 1 : 0.5 }}
                            >
                              <Tag
                                onClick={() => handleOptionValueToggle(id, option.id, valueObj.value)}
                              >
                                {valueObj.value}
                              </Tag>
                            </div>
                          ))}
                        </InlineStack>
                        {localErrors[id] && localErrors[id][option.id] && (
                          <InlineError message={localErrors[id][option.id]} />
                        )}
                      </BlockStack>
                    ))}
                  </BlockStack>
                </ResourceItem>
              );
            }}
          />
        ) : (
          <EmptyState
            heading="No products selected"
            action={{
              content: "Select products",
              onAction: handleProductSelection,
            }}
          >
            <p>Select products to include them in your bundle.</p>
          </EmptyState>
        )}
        {Object.keys(localErrors).length > 0 && (
          <Banner status="critical">
            Please ensure at least one option is selected for each product.
          </Banner>
        )}
      </BlockStack>
    </Card>
  );
}