import {
  Button,
  ButtonKind,
  Form,
  InlineLoading,
  Modal,
  ModalProps,
} from 'carbon-components-react';
import cx from 'classnames';
import { Formik, FormikErrors, FormikHelpers, FormikState, FormikValues } from 'formik';
import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './showModal.module.scss';

export interface IShowModalArgs<T = void>
  extends Omit<ModalProps, 'children' | 'open' | 'onRequestClose'> {
  renderBodyFooter?: (close: (closeResult?: T) => void) => React.ReactNode;
  hasFooter?: boolean;
}

export function ModalBody({ className, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.modalBody, className)} {...restProps} />;
}

export function ModalFooter({ className, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.modalFooter, className)} {...restProps} />;
}

export function showModal<T = void>({
  size = 'xs',
  renderBodyFooter,
  hasFooter = true,
  ...modalProps
}: IShowModalArgs<T>): Promise<T | undefined> {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    let closed = false;

    function destroy() {
      const unmountResult = ReactDOM.unmountComponentAtNode(div);
      if (unmountResult && div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }

    function render(open?: boolean) {
      setTimeout(() => {
        ReactDOM.render(
          <Modal
            size={size}
            open={open}
            onRequestClose={onRequestClose}
            passiveModal
            className={cx(styles.modal, { [styles.hasFooter]: hasFooter })}
            {...modalProps}
          >
            {renderBodyFooter && renderBodyFooter?.(close)}
          </Modal>,
          div
        );
      });
    }

    function onRequestClose() {
      close();
    }

    function close(closeResult?: T) {
      if (closed) {
        return;
      }
      render(false);
      destroy();
      resolve(closeResult);
      closed = true;
    }

    render(true);
  });
}

export interface IShowPromptArgs extends Omit<IShowModalArgs, 'renderBodyFooter'> {
  content?: React.ReactNode;
}

export function showPrompt({ content, ...rest }: IShowPromptArgs): Promise<void> {
  return showModal({
    renderBodyFooter: (close) => (
      <>
        <ModalBody>{content}</ModalBody>
        <ModalFooter>
          <Button kind="primary" onClick={close} className="promptCloseButton">
            Ok
          </Button>
        </ModalFooter>
      </>
    ),
    selectorPrimaryFocus: '.promptCloseButton',
    ...rest,
  });
}

export interface IFormModalFooterProps<T = void> {
  primaryButtonText?: React.ReactNode;
  primaryButtonKind?: ButtonKind;
  secondaryButtonText?: React.ReactNode;
  secondaryButtonKind?: ButtonKind;
  submittingText?: React.ReactNode;
  submittedText?: React.ReactNode;
  submittedResult?: T;
  submitFn?: () => Promise<T | false>;
  closeFn?: (closeResult?: T) => void;
}

function ConfirmModalFooter<T>({
  primaryButtonText = 'Submit',
  primaryButtonKind = 'primary',
  secondaryButtonText = 'Cancel',
  secondaryButtonKind = 'secondary',
  submittingText = 'Submitting...',
  submittedText = 'Submitted',
  submittedResult,
  submitFn,
  closeFn,
}: IFormModalFooterProps<T>) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!submitFn) {
      // If submit function is not provided, close modal immediately.
      closeFn?.(submittedResult);
      return;
    }

    setIsSubmitting(true);
    try {
      const r = await submitFn();
      if (r === false) {
        return;
      }
      setHasSubmitted(true);
      setTimeout(() => closeFn?.(r), 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFn, closeFn, submittedResult]);

  const handleSecondary = useCallback(() => {
    closeFn?.();
  }, [closeFn]);

  return (
    <>
      <Button
        kind={secondaryButtonKind}
        onClick={handleSecondary}
        className="formSecondaryButton"
        disabled={isSubmitting || hasSubmitted}
      >
        {secondaryButtonText}
      </Button>
      {isSubmitting || hasSubmitted ? (
        <InlineLoading
          status={hasSubmitted ? 'finished' : 'active'}
          description={hasSubmitted ? submittedText : submittingText}
        />
      ) : (
        <Button
          kind={primaryButtonKind}
          disabled={isSubmitting}
          onClick={handlePrimary}
          className="formPrimaryButton"
        >
          {primaryButtonText}
        </Button>
      )}
    </>
  );
}

export interface IShowConfirmArgs<T = true> extends Omit<IShowModalArgs<T>, 'renderBodyFooter'> {
  content?: React.ReactNode;
  yesButtonText?: React.ReactNode;
  yesButtonKind?: ButtonKind;
  noButtonText?: React.ReactNode;
  noButtonKind?: ButtonKind;
  defaultYes?: boolean;
  submittingText?: React.ReactNode;
  submittedText?: React.ReactNode;
  submittedResult?: T;
  submitFn?: () => Promise<T | false>;
}

export function showConfirm<T = true>({
  content,
  yesButtonText = 'Yes',
  yesButtonKind,
  noButtonText = 'No',
  noButtonKind,
  defaultYes,
  submittingText,
  submittedText,
  submittedResult,
  submitFn,

  modalHeading = 'Confirm',
  ...restProps
}: IShowConfirmArgs<T>): Promise<T | undefined> {
  const footerProps = {
    primaryButtonText: yesButtonText,
    primaryButtonKind: yesButtonKind,
    secondaryButtonText: noButtonText,
    secondaryButtonKind: noButtonKind,
    submittingText,
    submittedText,
    submittedResult,
    submitFn,
  };

  const defaultFocus = defaultYes ? '.formPrimaryButton' : '.formSecondaryButton';

  return showModal<T>({
    renderBodyFooter: (close) => (
      <>
        <ModalBody>{content}</ModalBody>
        <ModalFooter>
          <ConfirmModalFooter<T> closeFn={close} {...footerProps} />
        </ModalFooter>
      </>
    ),
    modalHeading,
    selectorPrimaryFocus: defaultFocus,
    ...restProps,
  });
}

export interface IShowFormModalArgs<Values extends FormikValues = FormikValues, T = void>
  extends IShowModalArgs<T> {
  submittingText?: React.ReactNode;
  submittedText?: React.ReactNode;
  submitButtonText?: React.ReactNode;
  submitButtonKind?: ButtonKind;
  submitFn?: (values: Values, helpers: FormikHelpers<Values>) => Promise<T | false>;
  validateFn?: (values: Values) => void | object | Promise<FormikErrors<Values>>;
  renderForm?: (
    state: FormikState<Values>,
    hasSubmitted: boolean,
    close: (v?: T) => void
  ) => React.ReactNode;
  initialValues: Values | (Values & undefined);
}

export function showFormModal<Values extends FormikValues = FormikValues, T = void>({
  submittingText = 'Submitting...',
  submittedText = 'Submitted!',
  submitButtonText = 'Submit',
  submitButtonKind = 'primary',
  submitFn,
  validateFn,
  renderForm,
  initialValues,
  ...showModalArgs
}: IShowFormModalArgs<Values, T>): Promise<T | undefined> {
  function ModalForm({ closeFn }: { closeFn: (v?: T) => void }) {
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const handleSubmit = useCallback(
      async (values: Values, helpers: FormikHelpers<Values>) => {
        try {
          let r;
          if (submitFn) {
            r = await submitFn(values, helpers);
          }
          if (r === false) {
            return;
          }
          setHasSubmitted(true);
          setTimeout(() => closeFn(r), 1000);
        } catch (e) {
          console.log(e);
        } finally {
          helpers.setSubmitting(false);
        }
      },
      [closeFn]
    );

    return (
      <Formik initialValues={initialValues} validate={validateFn} onSubmit={handleSubmit}>
        {(props) => (
          <Form
            onSubmit={props.handleSubmit}
            onChange={props.handleChange}
            onBlur={props.handleBlur}
          >
            <ModalBody>{renderForm?.(props, hasSubmitted, closeFn)}</ModalBody>
            <ModalFooter>
              <Button
                kind="secondary"
                onClick={() => closeFn?.()}
                disabled={props.isSubmitting || hasSubmitted}
              >
                Cancel
              </Button>
              {props.isSubmitting || hasSubmitted ? (
                <InlineLoading
                  status={hasSubmitted ? 'finished' : 'active'}
                  description={hasSubmitted ? submittedText : submittingText}
                />
              ) : (
                <Button kind={submitButtonKind} type="submit" disabled={props.isSubmitting}>
                  {submitButtonText}
                </Button>
              )}
            </ModalFooter>
          </Form>
        )}
      </Formik>
    );
  }

  return showModal({
    ...showModalArgs,
    hasForm: true,
    renderBodyFooter: (close) => <ModalForm closeFn={close} />,
  });
}
