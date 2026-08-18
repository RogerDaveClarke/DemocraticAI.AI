import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type UseFormReturn } from 'react-hook-form';
import { type z } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

interface ValidatedFormProps<TSchema extends z.ZodTypeAny> {
  schema: TSchema;
  defaultValues: DefaultValues<z.infer<TSchema>>;
  onSubmit: (values: z.infer<TSchema>, form: UseFormReturn<z.infer<TSchema>>) => void | Promise<void>;
  children: (form: UseFormReturn<z.infer<TSchema>>) => React.ReactNode;
  submitLabel?: string;
  className?: string;
}

export function ValidatedForm<TSchema extends z.ZodTypeAny>({
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel = 'Save',
  className,
}: ValidatedFormProps<TSchema>) {
  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onSubmit',
  });

  const submitHandler = form.handleSubmit(async (values) => {
    await onSubmit(values, form);
  });

  return (
    <Form {...form}>
      <form onSubmit={submitHandler} className={cn('space-y-6', className)}>
        {children(form)}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : submitLabel}
          </Button>
          {form.formState.isSubmitSuccessful ? (
            <span className="text-sm text-emerald-600">Saved successfully.</span>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
