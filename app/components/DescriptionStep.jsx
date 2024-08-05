import React from "react";
import { Card, BlockStack, Text, TextField } from "@shopify/polaris";

export default function DescriptionStep({ formData, handleChange, errors }) {
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
}