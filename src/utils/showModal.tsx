import { Button, Modal } from 'carbon-components-react';
import React from 'react';
import ReactDOM from 'react-dom';

export interface IShowModalProps {
  title?: string;
  content?: React.ReactNode;
}

export default function showModal({ title, content }: IShowModalProps) {
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
          size="xs"
          open={open}
          onRequestClose={close}
          passiveModal
          selectorPrimaryFocus="#modalCloseButton"
          modalHeading={title}
        >
          {content}
          <Button kind="primary" onClick={close} id="modalCloseButton">
            Close
          </Button>
        </Modal>,
        div
      );
    });
  }

  function close() {
    if (closed) {
      return;
    }
    render(false);
    setTimeout(() => destroy, 1000);
    closed = true;
  }

  render(false);
  setTimeout(() => render(true), 100);
}
