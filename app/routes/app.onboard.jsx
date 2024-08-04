import React, { useState, useCallback } from "react";
import {
  ResourceList,
  Avatar,
  ResourceItem,
  Text,
  Button,
  InlineStack,
  Page,
  BlockStack,
  ProgressBar,
  Select,
  TextField,
  DatePicker,
  EmptyState,
  InlineError,
  Card,
  Icon,
  Checkbox,
  Form,
} from "@shopify/polaris";

import {
  CaretDownIcon,
  CaretUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import { createBundle } from "../create-bundle.server";


const placeholderImage =
  "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg";

function ResourceListWithVariants({
  items,
  selectedVariants,
  handleVariantSelection,
}) {
  const [expandedProductId, setExpandedProductId] = useState(null);

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  return (
    <Card>
      <ResourceList
        resourceName={resourceName}
        items={items}
        renderItem={(item) =>
          renderItem(item, selectedVariants, handleVariantSelection)
        }
      />
    </Card>
  );

  function renderItem(item, selectedVariants, handleVariantSelection) {
    const { id, url, name, location, image, variants } = item;
    const media = (
      <Avatar
        customer
        size="md"
        name={name}
        source={image || placeholderImage}
      />
    );
    const isExpanded = expandedProductId === id;

    return (
      <div key={id}>
        <ResourceItem
          id={id}
          url={url}
          media={media}
          accessibilityLabel={`View details for ${name}`}
        >
          <InlineStack align="space-between">
            <BlockStack>
              <Text variant="bodyMd" fontWeight="bold" as="h3">
                {name}
              </Text>
              <div>{location}</div>
            </BlockStack>
            <Button
              plain
              icon={<Icon source={isExpanded ? CaretUpIcon : CaretDownIcon} />}
              onClick={() => setExpandedProductId(isExpanded ? null : id)}
              accessibilityLabel={
                isExpanded ? "Collapse variants" : "Expand variants"
              }
            />
          </InlineStack>
        </ResourceItem>
        {isExpanded && variants && variants.length > 0 && (
          <ResourceList
            resourceName={{ singular: "variant", plural: "variants" }}
            items={variants}
            renderItem={(variant) =>
              renderVariantItem(
                variant,
                selectedVariants,
                handleVariantSelection,
              )
            }
          />
        )}
      </div>
    );
  }

  function renderVariantItem(
    variant,
    selectedVariants,
    handleVariantSelection,
  ) {
    const { id, title, price, image } = variant;
    const media = (
      <Avatar
        customer
        size="md"
        name={title}
        source={image?.originalSrc || placeholderImage}
      />
    );

    return (
      <ResourceItem
        id={id}
        media={media}
        accessibilityLabel={`View details for ${title}`}
      >
        <InlineStack align="space-between">
          <BlockStack>
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              {title}
            </Text>
            <div>Price: {price}</div>
          </BlockStack>
          <Checkbox
            label="Select variant"
            checked={selectedVariants.includes(id)}
            onChange={() => handleVariantSelection(id)}
          />
        </InlineStack>
      </ResourceItem>
    );
  }
}

export const action = async ({ request }) => {
  const formData = await request.formData();
  const bundleData = JSON.parse(formData.get("bundleData"));

  try {
    const result = await createBundle(request, bundleData);
    return json({ success: true, bundleOperation: result });
  } catch (error) {
    console.error("Error creating bundle:", error);
    return json({ success: false, error: error.message }, { status: 400 });
  }
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bundleName: "",
    products: [],
    selectedVariants: [],
    discountType: "percentage",
    discountValue: "",
    startDate: new Date(),
    endDate: new Date(),
    description: "",
  });
  const [errors, setErrors] = useState({});
  const app = useAppBridge();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();

  const handleChange = useCallback(
    (field) => (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleDateChange = useCallback(
    (field) => (date) => {
      setFormData((prev) => ({ ...prev, [field]: date }));
    },
    [],
  );

  const handleProductSelection = useCallback(async () => {
    try {
      const selection = await app.resourcePicker({
        type: "product",
        action: "select",
        filter: { variants: false, draft: false, archived: false },
        multiple: true,
      });

      if (selection && selection.length > 0) {
        const selectedProducts = selection.map((product) => ({
          id: product.id,
          url: product.url,
          name: product.title,
          location: product.vendor,
          image: product.images[0]?.originalSrc,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            title: variant.title,
            price: variant.price,
            image: variant.image?.originalSrc,
          })),
        }));
        const allVariantIds = selectedProducts.flatMap((product) =>
          product.variants.map((variant) => variant.id),
        );
        setFormData((prev) => ({
          ...prev,
          products: selectedProducts,
          selectedVariants: allVariantIds,
        }));
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  }, [app]);

  const handleVariantSelection = useCallback((variantId) => {
    setFormData((prev) => {
      const updatedSelectedVariants = prev.selectedVariants.includes(variantId)
        ? prev.selectedVariants.filter((id) => id !== variantId)
        : [...prev.selectedVariants, variantId];
      return { ...prev, selectedVariants: updatedSelectedVariants };
    });
  }, []);

  const validateStep = () => {
    const newErrors = {};
    switch (step) {
      case 1:
        if (!formData.bundleName.trim())
          newErrors.bundleName = "Bundle name is required";
        break;
      case 2:
        if (formData.products.length === 0)
          newErrors.products = "At least one product must be selected";
        break;
      case 3:
        if (formData.selectedVariants.length === 0)
          newErrors.variants = "At least one variant must be selected";
        break;
      case 4:
        if (!formData.discountValue.trim())
          newErrors.discountValue = "Discount value is required";
        else if (
          isNaN(formData.discountValue) ||
          Number(formData.discountValue) <= 0
        )
          newErrors.discountValue = "Discount value must be a positive number";
        break;
      case 5:
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = useCallback(() => {
    if (validateStep()) {
      setStep((prevStep) => prevStep + 1);
    }
  }, [formData, step]);

  const handlePreviousStep = useCallback(() => {
    setStep((prevStep) => prevStep - 1);
  }, []);

  const handleSubmit = useCallback(() => {
    if (validateStep()) {
      console.log("Form Data:", formData); // Log the entire form data for debugging

      const bundleData = {
        title: formData.bundleName,
        components: formData.products
          .map((product) => {
            console.log("Processing product:", product); // Log each product for debugging

            const selectedVariant = product.variants.find((v) =>
              formData.selectedVariants.includes(v.id),
            );

            if (!selectedVariant) {
              console.log("No selected variant for product:", product.id);
              return null; // Skip if no variant is selected for this product
            }

            let optionSelections = [];
            if (product.options && Array.isArray(product.options)) {
              optionSelections = product.options
                .map((option) => {
                  const selectedValue = selectedVariant.title
                    .split(" - ")
                    .find((part) => option.values.includes(part));

                  return {
                    componentOptionId: option.id,
                    name: option.name,
                    values: selectedValue ? [selectedValue] : [],
                  };
                })
                .filter((option) => option.values.length > 0);
            } else {
              // Fallback if product.options is not available or not an array
              optionSelections = [
                {
                  componentOptionId: selectedVariant.id,
                  name: "Default Option",
                  values: [selectedVariant.title],
                },
              ];
            }

            return {
              productId: product.id,
              quantity: 1,
              optionSelections: optionSelections,
            };
          })
          .filter(Boolean), // Remove any null entries (products without selected variants)
      };

      console.log("Bundle Data:", bundleData); // Log the final bundle data for debugging

      submit({ bundleData: JSON.stringify(bundleData) }, { method: "post" });
    }
  }, [formData, validateStep, submit]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <BlockStack gap="500">
              <Text variant="heading2xl" as="h2">
                Welcome to Bundler
              </Text>
              <Text>Let's create your first bundle</Text>
              <TextField
                label="Bundle Name"
                value={formData.bundleName}
                onChange={handleChange("bundleName")}
                error={errors.bundleName}
                autoComplete="off"
              />
            </BlockStack>
          </Card>
        );
      case 2:
        return (
          <Card>
            <BlockStack gap="500">
              <Text variant="heading2xl" as="h2">
                Select Products
              </Text>
              {errors.products && <InlineError message={errors.products} />}
              <Button onClick={handleProductSelection} size="large">
                Select products
              </Button>
              {formData.products.length > 0 ? (
                <ResourceList
                  resourceName={{ singular: "product", plural: "products" }}
                  items={formData.products}
                  renderItem={(item) => {
                    const { id, url, name, location, image } = item;
                    const media = (
                      <Avatar
                        customer
                        size="md"
                        name={name}
                        source={image || placeholderImage}
                      />
                    );
                    return (
                      <ResourceItem
                        id={id}
                        url={url}
                        media={media}
                        accessibilityLabel={`View details for ${name}`}
                      >
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {name}
                        </Text>
                        <div>{location}</div>
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
                  image={placeholderImage}
                >
                  <p>Select products to include them in your bundle.</p>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        );
      case 3:
        return (
          <Card>
            <BlockStack gap="500">
              <Text variant="heading2xl" as="h2">
                Select Variants
              </Text>
              {errors.variants && <InlineError message={errors.variants} />}
              <ResourceListWithVariants
                items={formData.products}
                selectedVariants={formData.selectedVariants}
                handleVariantSelection={handleVariantSelection}
              />
            </BlockStack>
          </Card>
        );
      case 4:
        return (
          <Card>
            <BlockStack gap="500">
              <Text variant="heading2xl" as="h2">
                Set Discount
              </Text>
              <Select
                label="Discount Type"
                options={[
                  { label: "Percentage", value: "percentage" },
                  { label: "Fixed Amount", value: "fixed" },
                ]}
                value={formData.discountType}
                onChange={handleChange("discountType")}
              />
              <TextField
                label="Discount Value"
                value={formData.discountValue}
                onChange={handleChange("discountValue")}
                error={errors.discountValue}
                type="number"
                suffix={formData.discountType === "percentage" ? "%" : "$"}
              />
              <DatePicker
                month={formData.startDate.getMonth()}
                year={formData.startDate.getFullYear()}
                onChange={({ start }) => handleDateChange("startDate")(start)}
                selected={formData.startDate}
                label="Start Date"
              />
              <DatePicker
                month={formData.endDate.getMonth()}
                year={formData.endDate.getFullYear()}
                onChange={({ start }) => handleDateChange("endDate")(start)}
                selected={formData.endDate}
                label="End Date"
              />
            </BlockStack>
          </Card>
        );
      case 5:
        return (
          <Card>
            <BlockStack gap="500">
              <Text variant="heading2xl" as="h2">
                Describe Your Bundle
              </Text>
              <TextField
                label="Description"
                value={formData.description}
                onChange={handleChange("description")}
                error={errors.description}
                multiline={4}
              />
            </BlockStack>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Page narrowWidth>
      <Form method="post">
        <BlockStack gap="500">
          <Card>
            <ProgressBar
              progress={(step / 5) * 100}
              size="small"
              tone="primary"
            />
          </Card>
          {renderStep()}
          <Card>
            <InlineStack align="space-between">
              <div>
                {step > 1 && (
                  <Button onClick={handlePreviousStep}>
                    <InlineStack gap="200">
                      <Icon source={ChevronLeftIcon} />
                      <Text>Previous</Text>
                    </InlineStack>
                  </Button>
                )}
              </div>
              <div>
                {step < 5 ? (
                  <Button primary onClick={handleNextStep}>
                    <InlineStack gap="200">
                      <Text>Next</Text>
                      <Icon source={ChevronRightIcon} />
                    </InlineStack>
                  </Button>
                ) : (
                  <Button
                    primary
                    onClick={handleSubmit}
                    loading={navigation.state === "submitting"}
                  >
                    Create Bundle
                  </Button>
                )}
              </div>
            </InlineStack>
          </Card>
          {actionData && (
            <Card>
              {actionData.success ? (
                <Text variant="bodyLg" color="success">
                  Bundle created successfully!
                </Text>
              ) : (
                <Text variant="bodyLg" color="critical">
                  {actionData.error}
                </Text>
              )}
            </Card>
          )}
        </BlockStack>
      </Form>
    </Page>
  );
}
