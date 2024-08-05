import React from "react";
import { Card, BlockStack, Text, TextField, Checkbox } from "@shopify/polaris";

export default function WelcomeStep({ formData, handleChange, errors }) {
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
        <Checkbox
          label="Create section block for bundle"
          checked={formData.createSectionBlock}
          onChange={handleChange("createSectionBlock")}
        />
      </BlockStack>
    </Card>
  );
}