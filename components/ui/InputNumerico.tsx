// components/ui/InputNumerico.tsx
"use client";
import React, { useState, useEffect } from "react";

type Props = {
  value: number | "";
  onChange: (value: number | "") => void;
  className?: string;
  min?: number;
  step?: number;
  placeholder?: string;
  [key: string]: any; // Para pasar otros props como 'disabled', etc.
};

export default function InputNumerico({
  value,
  onChange,
  className,
  min = 0,
  step = 1,
  ...rest
}: Props) {
  const [internalValue, setInternalValue] = useState(String(value));

  useEffect(() => {
    // Sincroniza desde el padre solo si el valor es diferente
    const numericValue = parseFloat(internalValue);
    if (value !== numericValue) {
      setInternalValue(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Permite campo vacío o negativo si el mínimo es menor a 0
    if (val === "" || (min < 0 && val === "-")) {
      setInternalValue(val);
      onChange("");
      return;
    }

    // Permite solo números (enteros o decimales)
    if (/^-?\d*\.?\d*$/.test(val)) {
      setInternalValue(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    let num = parseFloat(internalValue);
    if (isNaN(num)) {
      num = 0;
    }
    // Si el valor final es menor al mínimo, lo ajusta al mínimo
    if (typeof min === "number" && num < min) {
      num = min;
    }
    setInternalValue(String(num));
    onChange(num);
  };

  return (
    <input
      type="number"
      className={`input ${className || ""}`} // Usa la clase base .input
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      step={step}
      {...rest}
    />
  );
}