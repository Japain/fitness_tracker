import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  Text,
  Grid,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import { WorkoutSet } from '@fitness-tracker/shared';
import { apiRequest } from '../api/client';

/**
 * Set Row Component
 * Design reference: mockups/html/02-active-workout.html lines 454-470
 *
 * Individual set row with inputs for weight/reps (strength) or duration/distance (cardio)
 * Auto-saves on blur or Enter key
 */
interface SetRowProps {
  set: WorkoutSet;
  workoutId: string;
  workoutExerciseId: string;
  exerciseType: 'strength' | 'cardio';
  onUpdate: () => void;
}

/**
 * Shared Set Input Component
 * Reusable input field for set values (weight, reps, duration, distance)
 */
interface SetInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputMode: 'numeric' | 'decimal';
  isDisabled: boolean;
}

function SetInput({ label, value, onChange, onBlur, onKeyDown, inputMode, isDisabled }: SetInputProps) {
  return (
    <Box>
      <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
        {label}
      </Text>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        onKeyDown={onKeyDown}
        inputMode={inputMode}
        fontSize="md"
        fontWeight="semibold"
        textAlign="center"
        h="44px"
        borderRadius="sm"
        borderColor="neutral.300"
        isDisabled={isDisabled}
        opacity={isDisabled ? 0.6 : 1}
        transition="opacity 0.2s"
        _focus={{
          borderColor: 'primary.500',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        }}
      />
    </Box>
  );
}

function SetRow({ set, workoutId, workoutExerciseId, exerciseType, onUpdate }: SetRowProps) {
  const toast = useToast();

  // Local state for inputs (for immediate UI updates)
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const [duration, setDuration] = useState(set.duration ? (set.duration / 60).toString() : ''); // Convert seconds to minutes
  const [distance, setDistance] = useState(set.distance?.toString() || '');
  const [completed, setCompleted] = useState(set.completed);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setWeight(set.weight?.toString() || '');
    setReps(set.reps?.toString() || '');
    setDuration(set.duration ? (set.duration / 60).toString() : '');
    setDistance(set.distance?.toString() || '');
    setCompleted(set.completed);
  }, [set]);

  /**
   * Update set in database
   */
  const updateSet = async (field: string, value: string | boolean) => {
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {};

      if (field === 'weight') {
        const parsedWeight = parseFloat((value as string).trim());
        // Weight can be 0 or greater (nonnegative)
        updateData.weight = value && !isNaN(parsedWeight) && parsedWeight >= 0 ? parsedWeight : null;
        updateData.weightUnit = set.weightUnit || 'lbs';
      } else if (field === 'reps') {
        const parsedReps = parseInt((value as string).trim(), 10);
        // Reps must be positive (>0) per validation schema
        updateData.reps = value && !isNaN(parsedReps) && parsedReps > 0 ? parsedReps : null;
      } else if (field === 'duration') {
        // Convert minutes to seconds
        const parsedDuration = parseFloat((value as string).trim());
        // Duration must be positive (>0) per validation schema
        // Check parsedDuration > 0 BEFORE converting to avoid rounding edge cases
        const durationInSeconds = Math.round(parsedDuration * 60);
        updateData.duration = value && !isNaN(parsedDuration) && parsedDuration > 0 ? durationInSeconds : null;
      } else if (field === 'distance') {
        const parsedDistance = parseFloat((value as string).trim());
        // Distance can be 0 or greater (nonnegative)
        updateData.distance = value && !isNaN(parsedDistance) && parsedDistance >= 0 ? parsedDistance : null;
        updateData.distanceUnit = set.distanceUnit || 'km';
      } else if (field === 'completed') {
        updateData.completed = value;
      }

      await apiRequest(
        `/api/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${set.id}`,
        {
          method: 'PATCH',
          body: updateData,
        }
      );

      // Refresh workout data
      onUpdate();
    } catch (error) {
      // TODO: Implement centralized error handling pattern
      toast({
        title: 'Failed to update set',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while updating the set. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle input blur (save changes)
   * Only update if value has changed from original
   */
  const handleBlur = (field: string, value: string) => {
    let originalValue: string;

    if (field === 'weight') {
      originalValue = set.weight?.toString() || '';
    } else if (field === 'reps') {
      originalValue = set.reps?.toString() || '';
    } else if (field === 'duration') {
      // set.duration is in seconds, value is in minutes (string)
      originalValue = set.duration ? (set.duration / 60).toString() : '';
    } else if (field === 'distance') {
      originalValue = set.distance?.toString() || '';
    } else {
      originalValue = '';
    }

    // Only update if value has changed
    if (value !== originalValue) {
      updateSet(field, value);
    }
  };

  /**
   * Handle Enter key (blur will trigger save via onBlur)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  /**
   * Handle checkbox toggle
   */
  const handleToggleCompleted = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    updateSet('completed', newCompleted);
  };

  // Render strength exercise inputs (Weight, Reps)
  if (exerciseType === 'strength') {
    return (
      <Grid
        templateColumns="40px 1fr 1fr 44px"
        gap="md"
        alignItems="center"
        py="md"
        borderBottom="1px solid"
        borderBottomColor="neutral.100"
        _last={{ borderBottom: 'none' }}
      >
        {/* Set Number */}
        <Text fontSize="sm" fontWeight="semibold" color="neutral.600" textAlign="center">
          {set.setNumber}
        </Text>

        {/* Weight Input */}
        {/* TODO: Use user preferences for unit display if available, fallback to set.weightUnit */}
        <SetInput
          label={`Weight (${set.weightUnit || 'lbs'})`}
          value={weight}
          onChange={setWeight}
          onBlur={(value) => handleBlur('weight', value)}
          onKeyDown={handleKeyDown}
          inputMode="decimal"
          isDisabled={isSaving}
        />

        {/* Reps Input */}
        <SetInput
          label="Reps"
          value={reps}
          onChange={setReps}
          onBlur={(value) => handleBlur('reps', value)}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          isDisabled={isSaving}
        />

        {/* Completion Checkbox */}
        <Checkbox
          aria-label="Mark set as completed"
          isChecked={completed}
          onChange={handleToggleCompleted}
          colorScheme="green"
          size="lg"
          borderColor="neutral.300"
          sx={{
            '.chakra-checkbox__control': {
              w: '24px',
              h: '24px',
              borderRadius: 'sm',
              borderWidth: '2px',
            },
            '.chakra-checkbox__control[data-checked]': {
              bg: 'success.500',
              borderColor: 'success.500',
            },
          }}
        />
      </Grid>
    );
  }

  // Render cardio exercise inputs (Duration, Distance)
  return (
    <Grid
      templateColumns="40px 1fr 1fr 44px"
      gap="md"
      alignItems="center"
      py="md"
      borderBottom="1px solid"
      borderBottomColor="neutral.100"
      _last={{ borderBottom: 'none' }}
    >
      {/* Set Number */}
      <Text fontSize="sm" fontWeight="semibold" color="neutral.600" textAlign="center">
        {set.setNumber}
      </Text>

      {/* Duration Input (minutes) */}
      <SetInput
        label="Time (min)"
        value={duration}
        onChange={setDuration}
        onBlur={(value) => handleBlur('duration', value)}
        onKeyDown={handleKeyDown}
        inputMode="decimal"
        isDisabled={isSaving}
      />

      {/* Distance Input */}
      {/* TODO: Use user preferences for unit display if available, fallback to set.distanceUnit */}
      <SetInput
        label={`Distance (${set.distanceUnit || 'km'})`}
        value={distance}
        onChange={setDistance}
        onBlur={(value) => handleBlur('distance', value)}
        onKeyDown={handleKeyDown}
        inputMode="decimal"
        isDisabled={isSaving}
      />

      {/* Completion Checkbox */}
      <Checkbox
        aria-label="Mark set as completed"
        isChecked={completed}
        onChange={handleToggleCompleted}
        colorScheme="green"
        size="lg"
        borderColor="neutral.300"
        sx={{
          '.chakra-checkbox__control': {
            w: '24px',
            h: '24px',
            borderRadius: 'sm',
            borderWidth: '2px',
          },
          '.chakra-checkbox__control[data-checked]': {
            bg: 'success.500',
            borderColor: 'success.500',
          },
        }}
      />
    </Grid>
  );
}

export default SetRow;
