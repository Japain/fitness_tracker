import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { CustomExerciseForm, CustomExerciseFormValues } from './CustomExerciseForm';

/**
 * CreateExerciseModal Component
 * Modal for creating a new custom exercise
 *
 * Design reference: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md
 * Used in: ExerciseLibraryPage
 *
 * Features:
 * - Bottom sheet modal on mobile
 * - Uses CustomExerciseForm component
 * - Validation and error handling
 */
interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CustomExerciseFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function CreateExerciseModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateExerciseModalProps) {
  const handleSubmit = async (values: CustomExerciseFormValues) => {
    try {
      await onSubmit(values);
      onClose(); // Only close on success
    } catch (error) {
      // Error already handled by parent toast, just don't close modal
    }
  };

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
          Create Custom Exercise
        </ModalHeader>
        <ModalCloseButton top="md" right="md" />

        <ModalBody p="lg">
          <CustomExerciseForm
            key={isOpen ? 'open' : 'closed'}
            mode="create"
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            submitButtonText="Create Exercise"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
