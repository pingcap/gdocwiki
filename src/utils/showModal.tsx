import { Button, ButtonKind, InlineLoading, Modal, ModalProps } from 'carbon-components-react';
import cx from 'classnames';
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
  submitFn?: () => Promise<T>;
  closeFn?: (closeResult?: T) => void;
}

function ConfirmModalFooter<T>({
  primaryButtonText = 'Submit',
  primaryButtonKind = 'primary',
  secondaryButtonText = 'Cancel',
  secondaryButtonKind = 'secondary',
  submittingText = 'Submitting...',
  submittedText = 'Submitted',
  submitFn,
  closeFn,
}: IFormModalFooterProps<T>) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!submitFn) {
      // If submit function is not provided, close modal immediately.
      closeFn?.();
      return;
    }

    setIsSubmitting(true);
    try {
      const r = await submitFn();
      setHasSubmitted(true);
      setTimeout(() => closeFn?.(r), 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFn, closeFn]);

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

export interface IShowConfirmProps<T = void> extends Omit<IShowModalArgs<T>, 'renderBodyFooter'> {
  content?: React.ReactNode;
  yesButtonText?: React.ReactNode;
  yesButtonKind?: ButtonKind;
  noButtonText?: React.ReactNode;
  noButtonKind?: ButtonKind;
  defaultYes?: boolean;
  submittingText?: React.ReactNode;
  submittedText?: React.ReactNode;
  submitFn?: () => Promise<T>;
}

export function showConfirm<T = boolean>({
  content,
  yesButtonText = 'Yes',
  yesButtonKind,
  noButtonText = 'No',
  noButtonKind,
  defaultYes,
  submittingText,
  submittedText,
  submitFn,

  modalHeading = 'Confirm',
  ...restProps
}: IShowConfirmProps<T>): Promise<T | undefined> {
  const footerProps = {
    primaryButtonText: yesButtonText,
    primaryButtonKind: yesButtonKind,
    secondaryButtonText: noButtonText,
    secondaryButtonKind: noButtonKind,
    submittingText,
    submittedText,
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
