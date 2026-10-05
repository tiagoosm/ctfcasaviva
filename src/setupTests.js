import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';

// The default 1 s for findBy* is too tight when every suite runs in parallel
configure({ asyncUtilTimeout: 5000 });

// react-router v7 uses TextEncoder, which is missing from Jest 27's jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Layout APIs that jsdom does not implement
window.scrollTo = () => {};
Element.prototype.scrollIntoView = function scrollIntoView() {};

beforeEach(() => {
  window.localStorage.clear();
});
