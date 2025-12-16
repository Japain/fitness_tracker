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
        updateData.weight = value ? parseFloat(value as string) : null;
        updateData.weightUnit = set.weightUnit || 'lbs';
      } else if (field === 'reps') {
        updateData.reps = value ? parseInt(value as string, 10) : null;
      } else if (field === 'duration') {
        // Convert minutes to seconds
        updateData.duration = value ? Math.round(parseFloat(value as string) * 60) : null;
      } else if (field === 'distance') {
        updateData.distance = value ? parseFloat(value as string) : null;
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
      toast({
        title: 'Failed to update set',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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
   */
  const handleBlur = (field: string, value: string) => {
    updateSet(field, value);
  };

  /**
   * Handle Enter key (save changes and blur)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string, value: string) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      updateSet(field, value);
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
        <Box>
          <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
            Weight (lbs)
          </Text>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={(e) => handleBlur('weight', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'weight', weight)}
            inputMode="decimal"
            fontSize="md"
            fontWeight="semibold"
            textAlign="center"
            h="44px"
            borderRadius="sm"
            borderColor="neutral.300"
            isDisabled={isSaving}
            opacity={isSaving ? 0.6 : 1}
            transition="opacity 0.2s"
            _focus={{
              borderColor: 'primary.500',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
            }}
          />
        </Box>

        {/* Reps Input */}
        <Box>
          <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
            Reps
          </Text>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={(e) => handleBlur('reps', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'reps', reps)}
            inputMode="numeric"
            fontSize="md"
            fontWeight="semibold"
            textAlign="center"
            h="44px"
            borderRadius="sm"
            borderColor="neutral.300"
            isDisabled={isSaving}
            opacity={isSaving ? 0.6 : 1}
            transition="opacity 0.2s"
            _focus={{
              borderColor: 'primary.500',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
            }}
          />
        </Box>

        {/* Completion Checkbox */}
        <Checkbox
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
      <Box>
        <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
          Time (min)
        </Text>
        <Input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          onBlur={(e) => handleBlur('duration', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'duration', duration)}
          inputMode="decimal"
          fontSize="md"
          fontWeight="semibold"
          textAlign="center"
          h="44px"
          borderRadius="sm"
          borderColor="neutral.300"
          isDisabled={isSaving}
          opacity={isSaving ? 0.6 : 1}
          transition="opacity 0.2s"
          _focus={{
            borderColor: 'primary.500',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          }}
        />
      </Box>

      {/* Distance Input */}
      <Box>
        <Text fontSize="xs" color="neutral.600" fontWeight="medium" mb="xs">
          Distance (km)
        </Text>
        <Input
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          onBlur={(e) => handleBlur('distance', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'distance', distance)}
          inputMode="decimal"
          fontSize="md"
          fontWeight="semibold"
          textAlign="center"
          h="44px"
          borderRadius="sm"
          borderColor="neutral.300"
          isDisabled={isSaving}
          opacity={isSaving ? 0.6 : 1}
          transition="opacity 0.2s"
          _focus={{
            borderColor: 'primary.500',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
          }}
        />
      </Box>

      {/* Completion Checkbox */}
      <Checkbox
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
