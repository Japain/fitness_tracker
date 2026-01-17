import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { CustomExerciseForm, CustomExerciseFormValues } from './CustomExerciseForm';
import type { Exercise } from '@fitness-tracker/shared';

/**
 * EditExerciseModal Component
 * Modal for editing an existing custom exercise
 *
 * Design reference: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md
 * Used in: ExerciseLibraryPage
 *
 * Features:
 * - Bottom sheet modal on mobile
 * - Pre-fills form with exercise data
 * - Uses CustomExerciseForm component
 * - Validation and error handling
 */
interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onSubmit: (exerciseId: string, values: CustomExerciseFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function EditExerciseModal({
  isOpen,
  onClose,
  exercise,
  onSubmit,
  isLoading = false,
}: EditExerciseModalProps) {
  const handleSubmit = async (values: CustomExerciseFormValues) => {
    if (!exercise) return;
    await onSubmit(exercise.id, values);
    onClose();
  };

  // Don't render if no exercise selected
  if (!exercise) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="slideInBottom">
      <ModalOverlay />
      <ModalContent
        bg="white"
        borderTopRadius="xl"
        mt="auto"
        mb={0}
        maxH="90vh"
        overflowY="auto"
      >
        <ModalHeader
          fontSize="xl"
          fontWeight="bold"
          color="neutral.900"
          borderBottom="1px solid"
          borderColor="neutral.200"
          pb="md"
        >
          Edit Exercise
        </ModalHeader>
        <ModalCloseButton top="md" right="md" />

        <ModalBody p="lg">
          <CustomExerciseForm
            mode="edit"
            initialValues={{
              name: exercise.name,
              category: exercise.category,
              type: exercise.type,
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            submitButtonText="Save Changes"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
