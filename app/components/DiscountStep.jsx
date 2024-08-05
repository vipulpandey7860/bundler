import React, { useState, useCallback } from "react";
import { 
  Card, 
  BlockStack, 
  InlineStack,
  Text, 
  Select, 
  TextField,
  Button,
  Modal,
  DatePicker
} from "@shopify/polaris";

export default function DiscountStep({ formData, handleChange, handleDateChange, errors }) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  const handleDatePickerOpen = useCallback((field) => {
    setCurrentDateField(field);
    const date = field === 'startDate' ? formData.startDate : formData.endDate;
    setDate({ month: date.getMonth(), year: date.getFullYear() });
    setDatePickerOpen(true);
  }, [formData.startDate, formData.endDate]);

  const handleDatePickerClose = useCallback(() => {
    setDatePickerOpen(false);
    setCurrentDateField(null);
  }, []);

  const handleMonthChange = useCallback((month, year) => {
    setDate({ month, year });
  }, []);

  const handleDateSelected = useCallback((dates) => {
    if (currentDateField && dates.start) {
      handleDateChange(currentDateField)(dates.start);
    }
    handleDatePickerClose();
  }, [currentDateField, handleDateChange, handleDatePickerClose]);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
        <BlockStack gap="300">
          <Text variant="bodyMd" as="p">Discount Period</Text>
          <InlineStack gap="300" wrap={false}>
            <div style={{ flex: 1 }}>
              <Text variant="bodyMd" as="p">Start Date</Text>
              <Button fullWidth onClick={() => handleDatePickerOpen("startDate")}>
                {formatDate(formData.startDate)}
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              <Text variant="bodyMd" as="p">End Date</Text>
              <Button fullWidth onClick={() => handleDatePickerOpen("endDate")}>
                {formatDate(formData.endDate)}
              </Button>
            </div>
          </InlineStack>
        </BlockStack>
        {errors.dateRange && <Text tone="critical">{errors.dateRange}</Text>}
      </BlockStack>

      <Modal
        open={datePickerOpen}
        onClose={handleDatePickerClose}
        title={`Select ${currentDateField === 'startDate' ? 'Start' : 'End'} Date`}
        primaryAction={{
          content: 'Confirm',
          onAction: handleDatePickerClose,
        }}
      >
        <Modal.Section>
          <DatePicker
            month={month}
            year={year}
            onChange={handleDateSelected}
            onMonthChange={handleMonthChange}
            selected={currentDateField === 'startDate' ? formData.startDate : formData.endDate}
          />
        </Modal.Section>
      </Modal>
    </Card>
  );
}