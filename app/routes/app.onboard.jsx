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
  Form,
  Tag,
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

export const action = async ({ request }) => {
  const formData = await request.formData();

  try {
    const result = await createBundle(request, formData);
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
    []
  );

  const handleDateChange = useCallback(
    (field) => (date) => {
      setFormData((prev) => ({ ...prev, [field]: date }));
    },
    []
  );

  const handleProductSelection = useCallback(async () => {
    try {
      const selection = await app.resourcePicker({
        type: "product",
        action: "select",
        multiple: true,
      });

      if (selection && selection.length > 0) {
        const productsWithQuantityAndOptions = selection.map(product => ({
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
        }));
        setFormData((prev) => ({
          ...prev,
          products: productsWithQuantityAndOptions,
        }));
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  }, [app]);

  const handleQuantityChange = useCallback((id, quantity) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map(product =>
        product.id === id ? { ...product, quantity: parseInt(quantity, 10) || 1 } : product
      ),
    }));
  }, []);

  const handleOptionValueToggle = useCallback((productId, optionId, value) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map(product =>
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
      ),
    }));
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
        if (!formData.discountValue.trim())
          newErrors.discountValue = "Discount value is required";
        else if (
          isNaN(formData.discountValue) ||
          Number(formData.discountValue) <= 0
        )
          newErrors.discountValue = "Discount value must be a positive number";
        break;
      case 4:
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
      const cleanedFormData = {
        ...formData,
        products: formData.products.map(product => ({
          ...product,
          options: product.options.map(option => ({
            ...option,
            values: option.values.filter(v => v.selected).map(v => v.value)
          }))
        }))
      };
      console.log("Submitting form data:", cleanedFormData);
      submit({ formData: JSON.stringify(cleanedFormData) }, { method: "post" });
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
                    const { id, title, vendor, images, quantity, options } = item;
                    const media = (
                      <Avatar
                        customer
                        size="md"
                        name={title}
                        source={images[0]?.originalSrc || placeholderImage}
                      />
                    );
                    return (
                      <ResourceItem
                        id={id}
                        media={media}
                        accessibilityLabel={`View details for ${title}`}
                      >
                        <BlockStack gap="200">
                          <InlineStack gap="500" align="space-between">
                            <BlockStack>
                              <Text variant="bodyMd" fontWeight="bold" as="h3">
                                {title}
                              </Text>
                              <div>{vendor}</div>
                            </BlockStack>
                            <TextField
                              label="Quantity"
                              type="number"
                              value={quantity.toString()}
                              onChange={(value) => handleQuantityChange(id, value)}
                              min={1}
                            />
                          </InlineStack>
                          {options.map((option) => (
                            <BlockStack key={option.id}>
                              <Text variant="bodyMd" fontWeight="semibold">
                                {option.name}
                              </Text>
                              <InlineStack gap="300" wrap>
                                {option.values.map((valueObj) => (
                                  <Tag
                                    key={valueObj.value}
                                    onClick={() => handleOptionValueToggle(id, option.id, valueObj.value)}
                                    className={valueObj.selected ? "selected-tag" : ""}
                                  >
                                    {valueObj.value}
                                  </Tag>
                                ))}
                              </InlineStack>
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
      case 4:
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
              progress={(step / 4) * 100}
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
                {step < 4 ? (
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