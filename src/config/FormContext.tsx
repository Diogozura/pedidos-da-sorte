'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormContextProps {
  formValues: Record<string, Record<string, unknown>>;
  setFormValues: (formName: string, values: Record<string, unknown>) => void;
  resetFormValues: () => void;
}

const FormContext = createContext<FormContextProps | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formValues, setFormValuesState] = useState<Record<string, Record<string, unknown>>>({});

  const setFormValues = (formName: string, values: Record<string, unknown>) => {
    setFormValuesState((prev) => ({
      ...prev,
      [formName]: {
        ...prev[formName],
        ...values,
      },
    }));
  };

  const resetFormValues = () => {
    setFormValuesState({});
  };

  return (
    <FormContext.Provider value={{ formValues, setFormValues, resetFormValues }}>
      {children}
    </FormContext.Provider>
  );
};
