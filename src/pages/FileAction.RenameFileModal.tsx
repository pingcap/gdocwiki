import { Button, Form, InlineLoading, TextInput } from 'carbon-components-react';
import { Formik } from 'formik';
import React, { useCallback, useState } from 'react';
import { ModalBody, ModalFooter, showModal } from '../utils';

export function showRenameFileModal<T>(
  fileKind?: string,
  currentName?: string,
  submitFn?: (name: string) => Promise<T>
): Promise<T | undefined> {
  function ModalForm({ closeFn }: { closeFn: (v?: T) => void }) {
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const validate = useCallback(({ name }) => {
      let errors = {};
      if (!name) {
        errors['name'] = 'Required';
      }
      return errors;
    }, []);

    const handleSubmit = useCallback(
      async (values, { setSubmitting }) => {
        try {
          let r;
          if (submitFn) {
            r = await submitFn(values.name);
          }
          setHasSubmitted(true);
          setTimeout(() => closeFn(r), 1000);
        } catch (e) {
          console.log(e);
        } finally {
          setSubmitting(false);
        }
      },
      [closeFn]
    );

    return (
      <Formik
        initialValues={{
          name: currentName,
        }}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit} onChange={handleChange} onBlur={handleBlur}>
            <ModalBody>
              <TextInput
                id="name"
                name="name"
                labelText={
                  <span>
                    Rename "<strong>{currentName}</strong>" to
                  </span>
                }
                value={values.name}
                invalidText={errors.name}
                invalid={Boolean(touched.name && errors.name)}
                disabled={hasSubmitted}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                kind="secondary"
                onClick={() => closeFn?.()}
                disabled={isSubmitting || hasSubmitted}
              >
                Cancel
              </Button>
              {isSubmitting || hasSubmitted ? (
                <InlineLoading
                  status={hasSubmitted ? 'finished' : 'active'}
                  description={hasSubmitted ? `${fileKind} renamed!` : 'Renaming...'}
                />
              ) : (
                <Button kind="primary" type="submit" disabled={isSubmitting}>
                  Rename
                </Button>
              )}
            </ModalFooter>
          </Form>
        )}
      </Formik>
    );
  }

  return showModal({
    modalHeading: `Rename ${fileKind}`,
    selectorPrimaryFocus: `#name`,
    hasForm: true,
    renderBodyFooter: (close) => <ModalForm closeFn={close} />,
  });
}
