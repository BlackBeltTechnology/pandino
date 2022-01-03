import { StringInverter } from './string-inverter';

export const stringInverterImpl: StringInverter = (str: string) => {
  return str.split('').reverse().join('');
};
