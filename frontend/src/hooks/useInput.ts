import { FormEventHandler, useState } from "react";

export function useInput(defaultValue?: string) {
  const [value, setValue] = useState(defaultValue);
  const onInput: FormEventHandler<HTMLInputElement> = (e) => {
    setValue(e.currentTarget.value);
  };

  return {
    value,
    setValue: setValue,
    htmlAttribute: {
      value,
      onInput,
      onChange: onInput,
    },
  };
}

export function useInputNumber(defaultValue?: number) {
  const [value, setValue] = useState(defaultValue ?? 0);
  const onChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setValue(value[0]);
      return;
    }

    setValue(value);
  };

  return {
    value,
    setValue,
    htmlAttribute: {
      value,
      onChange,
    },
  };
}
