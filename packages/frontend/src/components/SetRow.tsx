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
 *
 * For strength exercises, the last set shows a "Sets" multiplier field that allows
 * users to quickly create multiple sets with the same weight/reps values.
 */
interface SetRowProps {
  set: WorkoutSet;
  workoutId: string;
  workoutExerciseId: string;
  exerciseType: 'strength' | 'cardio';
  isLastSet: boolean;
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

function SetRow({ set, workoutId, workoutExerciseId, exerciseType, isLastSet, onUpdate }: SetRowProps) {
  const toast = useToast();

  // Local state for inputs (for immediate UI updates)
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const [duration, setDuration] = useState(set.duration ? (set.duration / 60).toString() : ''); // Convert seconds to minutes
  const [distance, setDistance] = useState(set.distance?.toString() || '');
  const [completed, setCompleted] = useState(set.completed);
  const [sets, setSets] = useState('1'); // Sets multiplier (only shown on last set)
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingSets, setIsCreatingSets] = useState(false);

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
        // Duration must be positive (>0) per validation schema and must round to at least 1 second
        const durationInSeconds = Math.round(parsedDuration * 60);
        updateData.duration =
          value &&
          !isNaN(parsedDuration) &&
          parsedDuration > 0 &&
          durationInSeconds > 0
            ? durationInSeconds
            : null;
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

  /**
   * Handle Sets multiplier change
   * Creates additional sets with the same weight/reps values
   */
  const handleSetsChange = async (value: string) => {
    const numSets = parseInt(value.trim(), 10);

    // Validate input
    if (!value || isNaN(numSets) || numSets < 1) {
      setSets(value); // Allow typing, validation happens on blur
      return;
    }

    setSets(value);

    // If sets is 1, nothing to do
    if (numSets === 1) {
      return;
    }

    // Create additional sets (numSets - 1, since current set already exists)
    setIsCreatingSets(true);

    try {
      const currentSetNumber = set.setNumber;
      const setData = exerciseType === 'strength'
        ? {
            reps: set.reps || 1,
            weight: set.weight,
            weightUnit: set.weightUnit || 'lbs',
            completed: false,
          }
        : {
            duration: set.duration || 60,
            distance: set.distance,
            distanceUnit: set.distanceUnit || 'km',
            completed: false,
          };

      // Create additional sets sequentially
      for (let i = 1; i < numSets; i++) {
        await apiRequest(
          `/api/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
          {
            method: 'POST',
            body: {
              ...setData,
              setNumber: currentSetNumber + i,
            },
          }
        );
      }

      toast({
        title: 'Sets added',
        description: `Created ${numSets - 1} additional set${numSets - 1 > 1 ? 's' : ''}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

      // Refresh workout data
      onUpdate();

      // Reset sets input
      setSets('1');
    } catch (error) {
      toast({
        title: 'Failed to create sets',
        description: error instanceof Error ? error.message : 'An unexpected error occurred while creating sets. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsCreatingSets(false);
    }
  };

  // Render strength exercise inputs (Weight, Reps, and Sets multiplier on last set)
  if (exerciseType === 'strength') {
    return (
      <Grid
        templateColumns={isLastSet ? "40px 1fr 1fr 1fr 44px" : "40px 1fr 1fr 44px"}
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
          isDisabled={isSaving || isCreatingSets}
        />

        {/* Reps Input */}
        <SetInput
          label="Reps"
          value={reps}
          onChange={setReps}
          onBlur={(value) => handleBlur('reps', value)}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          isDisabled={isSaving || isCreatingSets}
        />

        {/* Sets Multiplier Input (only shown on last set) */}
        {isLastSet && (
          <SetInput
            label="Sets"
            value={sets}
            onChange={setSets}
            onBlur={(value) => handleSetsChange(value)}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
            isDisabled={isSaving || isCreatingSets}
          />
        )}

        {/* Completion Checkbox */}
        <Box>
          <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
            Done
          </Text>
          <Checkbox
            aria-label="Mark set as completed"
            isChecked={completed}
            onChange={handleToggleCompleted}
            colorScheme="green"
            size="lg"
            borderColor="neutral.300"
            isDisabled={isCreatingSets}
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
        </Box>
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
      <Box>
        <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
          Done
        </Text>
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
      </Box>
    </Grid>
  );
}

export default SetRow;
