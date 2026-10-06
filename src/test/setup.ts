import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { db } from '../db/db';

// Animations finish instantly in tests.
MotionGlobalConfig.skipAnimations = true;

// jsdom doesn't implement these browser APIs.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}

if (!('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub });
}

window.scrollTo = () => {};
Element.prototype.scrollIntoView = function scrollIntoView() {};

// Modal dialogs: jsdom has <dialog> but not showModal() or close() in every version.
const dialogProto = HTMLDialogElement.prototype as HTMLDialogElement & {
  showModal?: () => void;
  close?: (value?: string) => void;
};
if (typeof dialogProto.showModal !== 'function') {
  dialogProto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}
if (typeof dialogProto.close !== 'function') {
  dialogProto.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(async () => {
  cleanup();
  window.history.replaceState(null, '', '/');
  await Promise.all(db.tables.map((table) => table.clear()));
});
