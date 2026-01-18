import { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Button,
  Input,
  Select,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
} from '@chakra-ui/react';
import { EXERCISE_CATEGORIES, EXERCISE_TYPES, createExerciseSchema } from '../utils/exerciseValidation';

/**
 * CustomExerciseForm Component
 * Reusable form for creating or editing custom exercises
 *
 * Design reference: mockups/html/03-exercise-selection.html (lines 511-647)
 * Used in: ExerciseSelectionModal (inline), CreateExerciseModal, EditExerciseModal
 *
 * Features:
 * - Three fields: name (text input), category (select), type (radio buttons)
 * - Zod validation with error messages
 * - Support for both create and edit modes
 * - Configurable submit button text
 */

export interface CustomExerciseFormValues {
  name: string;
  category: string;
  type: string;
}

interface CustomExerciseFormProps {
  mode: 'create' | 'edit';
  initialValues?: CustomExerciseFormValues;
  onSubmit: (values: CustomExerciseFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  loadingText?: string;
}

export function CustomExerciseForm({
  mode,
  initialValues = {
    name: '',
    category: 'Push',
    type: 'strength',
  },
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Create',
  loadingText,
}: CustomExerciseFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [category, setCategory] = useState(initialValues.category);
  const [type, setType] = useState(initialValues.type);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync form state when initialValues change (for edit mode)
  useEffect(() => {
    setName(initialValues.name);
    setCategory(initialValues.category);
    setType(initialValues.type);
    setFormErrors({}); // Clear validation errors when switching exercises
  }, [initialValues]);

  /**
   * Handle form submission with validation
   */
  const handleSubmit = async () => {
    // Clear previous errors
    setFormErrors({});

    // Validate input using Zod schema
    const validationResult = createExerciseSchema.safeParse({
      name,
      category,
      type,
    });

    if (!validationResult.success) {
      // Convert Zod errors to form errors
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    // Call onSubmit with validated data
    await onSubmit(validationResult.data);
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    setFormErrors({}); // Clear validation errors before closing
    onCancel();
  };

  return (
    <VStack align="stretch" spacing="md">
      {/* Exercise Name */}
      <FormControl isInvalid={!!formErrors.name}>
        <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700" mb="xs">
          Exercise Name
        </FormLabel>
        <Input
          type="text"
          placeholder="e.g., Dumbbell Curl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          h="52px"
          fontSize="md"
          border="2px solid"
          borderColor={formErrors.name ? 'error.500' : 'neutral.300'}
          borderRadius="md"
          _focus={{
            borderColor: formErrors.name ? 'error.500' : 'primary.500',
            boxShadow: formErrors.name
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
              : '0 0 0 3px rgba(59, 130, 246, 0.1)',
          }}
        />
        {formErrors.name && (
          <FormErrorMessage fontSize="sm">{formErrors.name}</FormErrorMessage>
        )}
      </FormControl>

      {/* Exercise Category */}
      <FormControl isInvalid={!!formErrors.category}>
        <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700" mb="xs">
          Category
        </FormLabel>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          h="52px"
          fontSize="md"
          border="2px solid"
          borderColor={formErrors.category ? 'error.500' : 'neutral.300'}
          borderRadius="md"
          _focus={{
            borderColor: formErrors.category ? 'error.500' : 'primary.500',
            boxShadow: formErrors.category
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
              : '0 0 0 3px rgba(59, 130, 246, 0.1)',
          }}
        >
          {EXERCISE_CATEGORIES.map((cat: string) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
        {formErrors.category && (
          <FormErrorMessage fontSize="sm">{formErrors.category}</FormErrorMessage>
        )}
      </FormControl>

      {/* Exercise Type */}
      <FormControl isInvalid={!!formErrors.type}>
        <FormLabel fontSize="sm" fontWeight="semibold" color="neutral.700" mb="xs">
          Type
        </FormLabel>
        <RadioGroup value={type} onChange={setType}>
          <HStack spacing="lg">
            {EXERCISE_TYPES.map((exerciseType: string) => (
              <Radio
                key={exerciseType}
                value={exerciseType}
                colorScheme="primary"
                size="lg"
                borderColor={formErrors.type ? 'error.500' : 'neutral.300'}
              >
                <Text fontSize="md" color="neutral.700" textTransform="capitalize">
                  {exerciseType}
                </Text>
              </Radio>
            ))}
          </HStack>
        </RadioGroup>
        {formErrors.type && (
          <FormErrorMessage fontSize="sm">{formErrors.type}</FormErrorMessage>
        )}
      </FormControl>

      {/* Action Buttons */}
      <HStack spacing="md">
        <Button
          flex="1"
          h="52px"
          variant="outline"
          onClick={handleCancel}
          isDisabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          flex="1"
          h="52px"
          colorScheme="primary"
          onClick={handleSubmit}
          isLoading={isLoading}
          loadingText={loadingText ?? (mode === 'create' ? 'Creating...' : 'Saving...')}
        >
          {submitButtonText}
        </Button>
      </HStack>
    </VStack>
  );
}
