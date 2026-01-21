import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
} from '@chakra-ui/react';
import type { Exercise } from '@fitness-tracker/shared';

/**
 * DeleteConfirmationModal Component
 * Confirmation dialog for deleting a custom exercise
 *
 * Design reference: mockups/EXERCISE-LIBRARY-DESIGN-SPEC.md
 * Used in: ExerciseLibraryPage
 *
 * Features:
 * - Standard dialog (not bottom sheet)
 * - Clear warning message
 * - Cancel and Delete buttons
 * - Red destructive action styling
 */
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onConfirm: (exerciseId: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  exercise,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    if (!exercise) return;
    try {
      await onConfirm(exercise.id);
      onClose(); // Only close on success
    } catch (error) {
      // Error already handled by parent toast, just don't close modal
    }
  };

  // Don't render if no exercise selected
  if (!exercise) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
      <ModalOverlay />
      <ModalContent mx="lg">
        <ModalHeader
          fontSize="xl"
          fontWeight="bold"
          color="neutral.900"
          pb="sm"
        >
          Delete Exercise?
        </ModalHeader>
        <ModalCloseButton top="md" right="md" />

        <ModalBody pb="md">
          <Text color="neutral.700" fontSize="md">
            This will remove <strong>"{exercise.name}"</strong> from your library. This action
            cannot be undone.
          </Text>
        </ModalBody>

        <ModalFooter pt="md">
          <Button
            variant="ghost"
            mr="sm"
            onClick={onClose}
            isDisabled={isLoading}
            h="44px"
            px="lg"
          >
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText="Deleting..."
            h="44px"
            px="lg"
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
