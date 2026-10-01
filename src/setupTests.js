import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router v7 uses TextEncoder, which is missing from Jest 27's jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Layout APIs that jsdom does not implement
window.scrollTo = () => {};
Element.prototype.scrollIntoView = function scrollIntoView() {};

beforeEach(() => {
  window.localStorage.clear();
});
