import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// O react-router v7 usa TextEncoder, ausente no jsdom do Jest 27
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// APIs de layout que o jsdom não implementa
window.scrollTo = () => {};
Element.prototype.scrollIntoView = function scrollIntoView() {};

beforeEach(() => {
  window.localStorage.clear();
});
