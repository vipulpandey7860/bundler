import WelcomeStep from "../components/WelcomeStep";
import ProductSelectionStep from "../components/ProductSelectionStep";
import DiscountStep from "../components/DiscountStep";
import DescriptionStep from "../components/DescriptionStep";


import React, { useState, useCallback, useEffect } from "react";
import { Page, Card, ProgressBar, InlineStack, Button, Text, Icon, Form, Banner } from "@shopify/polaris";
import { ChevronLeftIcon, ChevronRightIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import { createBundle } from "../create-bundle.server";


export const action = async ({ request }) => {
  const formData = await request.formData();

  try {
    const result = await createBundle(request, formData);
    console.log("Bundle operation result:", result);
    return json({ success: true, bundleOperation: result });
  } catch (error) {
    console.error("Error creating bundle:", error);
    return json({ success: false, error: error.message }, { status: 400 });
  }
};

export default function Onboarding() {
  const initialFormData = {
    bundleName: "",
    createSectionBlock: false,
    products: [],
    discountType: "percentage",
    discountValue: "",
    startDate: new Date(),
    endDate: new Date(),
    description: "",
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const app = useAppBridge();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData();

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setStep(1);
    setErrors({});
    setShowErrors(false);
  }, [initialFormData]);

  useEffect(() => {
    if (actionData && actionData.success) {
      shopify.toast.show('Bundle created successfully');
      resetForm();
    }
  }, [actionData, resetForm]);
  

  const handleChange = useCallback(
    (field) => (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

  const handleDateChange = useCallback(
    (field) => (date) => {
      setFormData((prev) => ({ ...prev, [field]: date }));
      if (errors.dateRange) {
        setErrors((prev) => {
          const { dateRange: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

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
        if (formData.startDate >= formData.endDate)
          newErrors.dateRange = "End date must be after start date";
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
      setShowErrors(false);
    } else {
      setShowErrors(true);
    }
  }, [formData, step]);

  const handlePreviousStep = useCallback(() => {
    setStep((prevStep) => prevStep - 1);
    setShowErrors(false);
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
        })),
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString()
      };
      console.log("Submitting form data:", cleanedFormData);
      submit({ formData: JSON.stringify(cleanedFormData) }, { method: "post" });
    } else {
      setShowErrors(true);
    }
  }, [formData, validateStep, submit]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep formData={formData} handleChange={handleChange} errors={showErrors ? errors : {}} />;
      case 2:
        return <ProductSelectionStep 
          formData={formData} 
          setFormData={setFormData} 
          errors={showErrors ? errors : {}}
          setErrors={setErrors}
          app={app} 
        />;
      case 3:
        return <DiscountStep 
          formData={formData} 
          handleChange={handleChange} 
          handleDateChange={handleDateChange}
          errors={showErrors ? errors : {}} 
        />;
      case 4:
        return <DescriptionStep formData={formData} handleChange={handleChange} errors={showErrors ? errors : {}} />;
      default:
        return null;
    }
  };

  return (
    <Page narrowWidth>
      <Form method="post">
        <Card>
          <ProgressBar progress={(step / 4) * 100} size="small" tone="primary" />
        </Card>
        {renderStep()}
        {showErrors && Object.keys(errors).length > 0 && (
          <Banner status="critical">
            Please correct the errors before proceeding.
          </Banner>
        )}
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
                <Button onClick={handleNextStep} primary>
                  <InlineStack gap="200">
                    <Text>Next</Text>
                    <Icon source={ChevronRightIcon} />
                  </InlineStack>
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  primary
                  loading={navigation.state === "submitting"}
                >
                  Create Bundle
                </Button>
              )}
            </div>
          </InlineStack>
        </Card>
        {actionData && !actionData.success && (
          <Card>
            <Banner status="critical">
              {actionData.error}
            </Banner>
          </Card>
        )}
      </Form>
    </Page>
  );
}