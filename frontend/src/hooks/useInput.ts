import { FormEventHandler, useState } from "react";

export function useInput(defaultValue?: string) {
  const [value, setValue] = useState(defaultValue ?? "");
  const onInput: FormEventHandler<HTMLInputElement> = (e) => {
    setValue(e.currentTarget.value);
  };

  return {
    value,
    setValue: setValue,
    htmlAttribute: {
      value,
      onInput,
    },
  };
}
