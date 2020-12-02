import { Button, Form, InlineLoading, Modal, TextInput } from 'carbon-components-react';
import { Formik } from 'formik';
import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom';

export function showCreateFileModal<T>(
  fileKind?: string,
  submitFn?: (name: string) => Promise<T>
): Promise<T | undefined> {
  function ModalForm({ closeFn }: { closeFn: (v: T | undefined) => void }) {
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
          setTimeout(() => closeFn(r), 500);
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
          name: '',
        }}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit} onChange={handleChange} onBlur={handleBlur}>
            <div style={{ marginBottom: '2em' }}>
              <TextInput
                id="name"
                name="name"
                labelText="Name"
                value={values.name}
                invalidText={errors.name}
                invalid={Boolean(touched.name && errors.name)}
                disabled={hasSubmitted}
              />
            </div>
            {isSubmitting || hasSubmitted ? (
              <InlineLoading
                success={hasSubmitted}
                description={hasSubmitted ? `${fileKind} created!` : 'Creating...'}
              />
            ) : (
              <Button kind="primary" type="submit" disabled={isSubmitting}>
                Create {fileKind}
              </Button>
            )}
          </Form>
        )}
      </Formik>
    );
  }

  let closed = false;

  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    function destroy() {
      const unmountResult = ReactDOM.unmountComponentAtNode(div);
      if (unmountResult && div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }

    function handleClose() {
      close(undefined);
    }

    function render(open?: boolean) {
      setTimeout(() => {
        ReactDOM.render(
          <Modal
            size="xs"
            open={open}
            onRequestClose={handleClose}
            passiveModal
            hasForm
            selectorPrimaryFocus="#name"
            modalHeading={`Create ${fileKind}`}
          >
            <ModalForm closeFn={close} />
          </Modal>,
          div
        );
      });
    }

    function close(resolveResult: T | undefined) {
      if (closed) {
        return;
      }
      render(false);
      destroy();
      resolve(resolveResult);
      closed = true;
    }

    render(true);
  });
}
