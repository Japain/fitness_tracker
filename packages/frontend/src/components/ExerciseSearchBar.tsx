import { Input, InputGroup, InputLeftElement, Icon } from '@chakra-ui/react';

/**
 * ExerciseSearchBar Component
 * Reusable search input for filtering exercises
 *
 * Design reference: mockups/html/03-exercise-selection.html
 * Used in: ExerciseSelectionModal, ExerciseLibraryPage
 */
interface ExerciseSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ExerciseSearchBar({
  value,
  onChange,
  placeholder = 'Search exercises...',
}: ExerciseSearchBarProps) {
  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none" h="52px">
        <Icon viewBox="0 0 24 24" boxSize="20px" color="neutral.500" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </Icon>
      </InputLeftElement>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="search"
        h="52px"
        pl="48px"
        fontSize="md"
        border="2px solid"
        borderColor="neutral.300"
        borderRadius="md"
        _focus={{
          borderColor: 'primary.500',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        }}
        _placeholder={{
          color: 'neutral.500',
        }}
      />
    </InputGroup>
  );
}
