import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// react-router v7 utilise TextEncoder, absent de l'environnement jsdom de Jest 27.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
