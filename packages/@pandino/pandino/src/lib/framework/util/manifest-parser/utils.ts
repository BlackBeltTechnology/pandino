import { isAnyMissing } from '../../../utils/helpers';

export const parseDelimitedString = (value: string, delim: string, trim = true): string[] => {
  if (isAnyMissing(value)) {
    value = '';
  }

  const list: string[] = [];

  const CHAR = 1;
  const DELIMITER = 2;
  const STARTQUOTE = 4;
  const ENDQUOTE = 8;

  let sb = '';

  let expecting = CHAR | DELIMITER | STARTQUOTE;

  let isEscaped = false;
  for (let i = 0; i < value.length; i++) {
    const c = value.charAt(i);

    const isDelimiter = delim.indexOf(c) >= 0;

    if (!isEscaped && c == '\\') {
      isEscaped = true;
      continue;
    }

    if (isEscaped) {
      sb += c;
    } else if (isDelimiter && (expecting & DELIMITER) > 0) {
      if (trim) {
        list.push(sb.toString().trim());
      } else {
        list.push(sb.toString());
      }
      sb = '';
      expecting = CHAR | DELIMITER | STARTQUOTE;
    } else if (c == '"' && (expecting & STARTQUOTE) > 0) {
      sb += c;
      expecting = CHAR | ENDQUOTE;
    } else if (c == '"' && (expecting & ENDQUOTE) > 0) {
      sb += c;
      expecting = CHAR | STARTQUOTE | DELIMITER;
    } else if ((expecting & CHAR) > 0) {
      sb += c;
    } else {
      throw new Error('Invalid delimited string: ' + value);
    }

    isEscaped = false;
  }

  if (sb.length > 0) {
    if (trim) {
      list.push(sb.toString().trim());
    } else {
      list.push(sb.toString());
    }
  }

  return list;
};
