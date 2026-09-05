import { Select } from "@chakra-ui/react";

export default function VideoQualityMenu({ options, value, onChange }) {
  if (!Array.isArray(options) || options.length < 2) return null;

  return (
    <Select
      size="sm"
      maxW="160px"
      value={String(value ?? 0)}
      onChange={(event) => onChange(Number(event.target.value))}
      bg="white"
      borderRadius="lg"
      fontWeight="600"
      aria-label="جودة الفيديو"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
