import Filter, { FilterComp } from './filter';

/* istanbul ignore file */
function peg$subclass(child: any, parent: any) {
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  // @ts-ignore
  child.prototype = new ctor();
}

function peg$SyntaxError(message: any, expected: any, found: any, location: any) {
  this.message = message;
  this.expected = expected;
  this.found = found;
  this.location = location;
  this.name = 'SyntaxError';

  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

function peg$parse(input: any) {
  let options = arguments.length > 1 ? arguments[1] : {},
    peg$FAILED = {},
    peg$startRuleFunctions: any = { start: peg$parsestart },
    peg$startRuleFunction = peg$parsestart,
    peg$c0 = function (filter: any) {
      return filter;
    },
    peg$c1 = function (filter: any) {
      filter.value = filter.value.replace(/ +$/, '');
      return filter;
    },
    peg$c2 = '(',
    peg$c3 = { type: 'literal', value: '(', description: '"("' },
    peg$c4 = ')',
    peg$c5 = { type: 'literal', value: ')', description: '")"' },
    peg$c6 = '&',
    peg$c7 = { type: 'literal', value: '&', description: '"&"' },
    peg$c8 = function (filters: any) {
      return Filter.AND(filters);
    },
    peg$c9 = '|',
    peg$c10 = { type: 'literal', value: '|', description: '"|"' },
    peg$c11 = function (filters: any) {
      return Filter.OR(filters);
    },
    peg$c12 = '!',
    peg$c13 = { type: 'literal', value: '!', description: '"!"' },
    peg$c14 = function (filter: any) {
      return Filter.NOT(filter);
    },
    peg$c15 = function (attr: any, comp: any, value: any) {
      return new Filter(attr.attribute, comp, value);
    },
    peg$c16 = '=',
    peg$c17 = { type: 'literal', value: '=', description: '"="' },
    peg$c18 = '~=',
    peg$c19 = { type: 'literal', value: '~=', description: '"~="' },
    peg$c20 = '>=',
    peg$c21 = { type: 'literal', value: '>=', description: '">="' },
    peg$c22 = '<=',
    peg$c23 = { type: 'literal', value: '<=', description: '"<="' },
    peg$c24 = '=*',
    peg$c25 = { type: 'literal', value: '=*', description: '"=*"' },
    peg$c26 = function (attr: any) {
      return Filter.attribute(attr.attribute).present();
    },
    peg$c27 = function (attr: any, value: any) {
      return new Filter(attr.attribute, FilterComp.EQ, value);
    },
    peg$c28 = '*',
    peg$c29 = { type: 'literal', value: '*', description: '"*"' },
    peg$c30 = { type: 'other', description: 'attribute description' },
    peg$c31 = ';',
    peg$c32 = { type: 'literal', value: ';', description: '";"' },
    peg$c33 = function (attr: any, opts: any) {
      if (opts) {
        opts.shift();
        opts = opts.shift();
        opts = opts.split(';');
      }
      attr.options = opts || [];
      return attr;
    },
    peg$c34 = { type: 'other', description: 'attribute Type' },
    peg$c35 = function (oid: any) {
      return {
        type: 'oid',
        attribute: oid,
      };
    },
    peg$c36 = function (name: any) {
      return {
        type: 'attribute',
        attribute: name,
      };
    },
    peg$c37 = { type: 'other', description: 'attribute type chars' },
    peg$c38 = '-',
    peg$c39 = { type: 'literal', value: '-', description: '"-"' },
    peg$c40 = { type: 'other', description: 'OID' },
    peg$c41 = '.',
    peg$c42 = { type: 'literal', value: '.', description: '"."' },
    peg$c43 = { type: 'other', description: 'attribute options' },
    peg$c44 = { type: 'other', description: 'attribute option' },
    peg$c45 = /^[^)]/,
    peg$c46 = { type: 'class', value: '[^\\x29]', description: '[^\\x29]' },
    peg$c47 = '\\',
    peg$c48 = { type: 'literal', value: '\\', description: '"\\\\"' },
    peg$c49 = function (char: any) {
      return String.fromCharCode(char);
    },
    peg$c50 = function (value: any) {
      return parseInt(value, 16);
    },
    peg$c51 = /^[a-fA-F0-9]/,
    peg$c52 = { type: 'class', value: '[a-fA-F0-9]', description: '[a-fA-F0-9]' },
    peg$c53 = { type: 'other', description: 'WHITESPACE' },
    peg$c54 = { type: 'other', description: 'SPACE' },
    peg$c55 = /^[ ]/,
    peg$c56 = { type: 'class', value: '[\\x20]', description: '[\\x20]' },
    peg$c57 = { type: 'other', description: 'TAB' },
    peg$c58 = /^[\t]/,
    peg$c59 = { type: 'class', value: '[\\x09]', description: '[\\x09]' },
    peg$c60 = { type: 'other', description: 'DIGIT' },
    peg$c61 = /^[0-9]/,
    peg$c62 = { type: 'class', value: '[0-9]', description: '[0-9]' },
    peg$c63 = { type: 'other', description: 'ALPHA' },
    peg$c64 = /^[a-zA-Z]/,
    peg$c65 = { type: 'class', value: '[a-zA-Z]', description: '[a-zA-Z]' },
    peg$c66 = { type: 'other', description: 'NEWLINE' },
    peg$c67 = '\r\n',
    peg$c68 = { type: 'literal', value: '\r\n', description: '"\\r\\n"' },
    peg$c69 = '\n',
    peg$c70 = { type: 'literal', value: '\n', description: '"\\n"' },
    peg$currPos = 0,
    peg$savedPos = 0,
    peg$posDetailsCache = [{ line: 1, column: 1, seenCR: false }],
    peg$maxFailPos = 0,
    peg$maxFailExpected: any[] = [],
    peg$silentFails = 0,
    peg$result;

  if ('startRule' in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error('Can\'t start parsing from rule "' + options.startRule + '".');
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description: any) {
    throw peg$buildException(
      null,
      [{ type: 'other', description: description }],
      input.substring(peg$savedPos, peg$currPos),
      peg$computeLocation(peg$savedPos, peg$currPos),
    );
  }

  function error(message: any) {
    throw peg$buildException(
      message,
      null,
      input.substring(peg$savedPos, peg$currPos),
      peg$computeLocation(peg$savedPos, peg$currPos),
    );
  }

  function peg$computePosDetails(pos: any) {
    let details = peg$posDetailsCache[pos],
      p,
      ch;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column,
        seenCR: details.seenCR,
      };

      while (p < pos) {
        ch = input.charAt(p);
        if (ch === '\n') {
          if (!details.seenCR) {
            details.line++;
          }
          details.column = 1;
          details.seenCR = false;
        } else if (ch === '\r' || ch === '\u2028' || ch === '\u2029') {
          details.line++;
          details.column = 1;
          details.seenCR = true;
        } else {
          details.column++;
          details.seenCR = false;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos: any, endPos: any) {
    let startPosDetails = peg$computePosDetails(startPos),
      endPosDetails = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column,
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column,
      },
    };
  }

  function peg$fail(expected: any) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildException(message: any, expected: any, found: any, location: any) {
    function cleanupExpected(expected: any) {
      let i = 1;

      expected.sort(function (a: any, b: any) {
        if (a.description < b.description) {
          return -1;
        } else if (a.description > b.description) {
          return 1;
        } else {
          return 0;
        }
      });

      while (i < expected.length) {
        if (expected[i - 1] === expected[i]) {
          expected.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    function buildMessage(expected: any, found: any) {
      function stringEscape(s: any) {
        function hex(ch: any) {
          return ch.charCodeAt(0).toString(16).toUpperCase();
        }

        return s
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\x08/g, '\\b')
          .replace(/\t/g, '\\t')
          .replace(/\n/g, '\\n')
          .replace(/\f/g, '\\f')
          .replace(/\r/g, '\\r')
          .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (ch: any) {
            return '\\x0' + hex(ch);
          })
          .replace(/[\x10-\x1F\x80-\xFF]/g, function (ch: any) {
            return '\\x' + hex(ch);
          })
          .replace(/[\u0100-\u0FFF]/g, function (ch: any) {
            return '\\u0' + hex(ch);
          })
          .replace(/[\u1000-\uFFFF]/g, function (ch: any) {
            return '\\u' + hex(ch);
          });
      }

      let expectedDescs = new Array(expected.length),
        expectedDesc,
        foundDesc,
        i;

      for (i = 0; i < expected.length; i++) {
        expectedDescs[i] = expected[i].description;
      }

      expectedDesc =
        expected.length > 1
          ? expectedDescs.slice(0, -1).join(', ') + ' or ' + expectedDescs[expected.length - 1]
          : expectedDescs[0];

      foundDesc = found ? '"' + stringEscape(found) + '"' : 'end of input';

      return 'Expected ' + expectedDesc + ' but ' + foundDesc + ' found.';
    }

    if (expected !== null) {
      cleanupExpected(expected);
    }

    // @ts-ignore
    return new peg$SyntaxError(message !== null ? message : buildMessage(expected, found), expected, found, location);
  }

  function peg$parsestart() {
    let s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parsefilter();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c0(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseFILL();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseFILL();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseitem();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c1(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parsefilter(): any {
    let s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseFILL();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parseFILL();
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 40) {
        s2 = peg$c2;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c3);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefiltercomp();
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s4 = peg$c4;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c5);
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$parseFILL();
            while (s6 !== peg$FAILED) {
              s5.push(s6);
              s6 = peg$parseFILL();
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c0(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsefiltercomp() {
    let s0;

    s0 = peg$parseand();
    if (s0 === peg$FAILED) {
      s0 = peg$parseor();
      if (s0 === peg$FAILED) {
        s0 = peg$parsenot();
        if (s0 === peg$FAILED) {
          s0 = peg$parseitem();
        }
      }
    }

    return s0;
  }

  function peg$parseand() {
    let s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 38) {
      s1 = peg$c6;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c7);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseFILL();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseFILL();
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefilterlist();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parseFILL();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parseFILL();
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseor() {
    let s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 124) {
      s1 = peg$c9;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c10);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseFILL();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseFILL();
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefilterlist();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parseFILL();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parseFILL();
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c11(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsenot() {
    let s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 33) {
      s1 = peg$c12;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c13);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseFILL();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseFILL();
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefilter();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parseFILL();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parseFILL();
          }
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c14(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsefilterlist() {
    let s0, s1;

    s0 = [];
    s1 = peg$parsefilter();
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsefilter();
      }
    } else {
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseitem() {
    let s0;

    s0 = peg$parsesubstring();
    if (s0 === peg$FAILED) {
      s0 = peg$parsesimple();
      if (s0 === peg$FAILED) {
        s0 = peg$parsepresent();
      }
    }

    return s0;
  }

  function peg$parsesimple() {
    let s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseAttributeDescription();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsefiltertype();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsevalue();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c15(s1, s2, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsefiltertype() {
    let s0;

    s0 = peg$parseequal();
    if (s0 === peg$FAILED) {
      s0 = peg$parseapprox();
      if (s0 === peg$FAILED) {
        s0 = peg$parsegreater();
        if (s0 === peg$FAILED) {
          s0 = peg$parseless();
        }
      }
    }

    return s0;
  }

  function peg$parseequal() {
    let s0;

    if (input.charCodeAt(peg$currPos) === 61) {
      s0 = peg$c16;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c17);
      }
    }

    return s0;
  }

  function peg$parseapprox() {
    let s0;

    if (input.substr(peg$currPos, 2) === peg$c18) {
      s0 = peg$c18;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c19);
      }
    }

    return s0;
  }

  function peg$parsegreater() {
    let s0;

    if (input.substr(peg$currPos, 2) === peg$c20) {
      s0 = peg$c20;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c21);
      }
    }

    return s0;
  }

  function peg$parseless() {
    let s0;

    if (input.substr(peg$currPos, 2) === peg$c22) {
      s0 = peg$c22;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c23);
      }
    }

    return s0;
  }

  function peg$parsepresent() {
    let s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parseAttributeDescription();
    if (s1 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c24) {
        s2 = peg$c24;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c25);
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c26(s1);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesubstring() {
    let s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parseAttributeDescription();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseequal();
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        s4 = peg$currPos;
        s5 = peg$parsevalue();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parseany();
          if (s6 !== peg$FAILED) {
            s7 = peg$parsevalue();
            if (s7 === peg$FAILED) {
              s7 = null;
            }
            if (s7 !== peg$FAILED) {
              s5 = [s5, s6, s7];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s3 = input.substring(s3, peg$currPos);
        } else {
          s3 = s4;
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c27(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseany() {
    let s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 42) {
      s2 = peg$c28;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c29);
      }
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parsevalue();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 42) {
          s5 = peg$c28;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c29);
          }
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parsevalue();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 42) {
            s5 = peg$c28;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c29);
            }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsevalue() {
    let s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseAttributeValue();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseAttributeValue();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    return s0;
  }

  function peg$parseAttributeDescription() {
    let s0, s1, s2, s3, s4;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseAttributeType();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 59) {
        s3 = peg$c31;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c32);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parseoptions();
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c33(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c30);
      }
    }

    return s0;
  }

  function peg$parseAttributeType() {
    let s0, s1, s2, s3, s4, s5;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseLDAP_OID();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c35(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      s3 = peg$parseALPHA();
      if (s3 !== peg$FAILED) {
        s4 = [];
        s5 = peg$parseAttrTypeChars();
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          s5 = peg$parseAttrTypeChars();
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = input.substring(s1, peg$currPos);
      } else {
        s1 = s2;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c36(s1);
      }
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c34);
      }
    }

    return s0;
  }

  function peg$parseAttrTypeChars() {
    let s0, s1;

    peg$silentFails++;
    s0 = peg$parseALPHA();
    if (s0 === peg$FAILED) {
      s0 = peg$parseDIGIT();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 45) {
          s0 = peg$c38;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c39);
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c37);
      }
    }

    return s0;
  }

  function peg$parseLDAP_OID() {
    let s0, s1, s2, s3, s4, s5, s6, s7;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = [];
    s3 = peg$parseDIGIT();
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseDIGIT();
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s5 = peg$c41;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c42);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = [];
        s7 = peg$parseDIGIT();
        if (s7 !== peg$FAILED) {
          while (s7 !== peg$FAILED) {
            s6.push(s7);
            s7 = peg$parseDIGIT();
          }
        } else {
          s6 = peg$FAILED;
        }
        if (s6 !== peg$FAILED) {
          s5 = [s5, s6];
          s4 = s5;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s5 = peg$c41;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c42);
          }
        }
        if (s5 !== peg$FAILED) {
          s6 = [];
          s7 = peg$parseDIGIT();
          if (s7 !== peg$FAILED) {
            while (s7 !== peg$FAILED) {
              s6.push(s7);
              s7 = peg$parseDIGIT();
            }
          } else {
            s6 = peg$FAILED;
          }
          if (s6 !== peg$FAILED) {
            s5 = [s5, s6];
            s4 = s5;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c40);
      }
    }

    return s0;
  }

  function peg$parseoptions(): any {
    let s0, s1, s2, s3, s4;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parseoption();
    if (s2 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 59) {
        s3 = peg$c31;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c32);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parseoptions();
        if (s4 !== peg$FAILED) {
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseoption();
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c43);
      }
    }

    return s0;
  }

  function peg$parseoption() {
    let s0, s1;

    peg$silentFails++;
    s0 = [];
    s1 = peg$parseAttrTypeChars();
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseAttrTypeChars();
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c44);
      }
    }

    return s0;
  }

  function peg$parseAttributeValue() {
    let s0;

    s0 = peg$parseEscapedCharacter();
    if (s0 === peg$FAILED) {
      if (peg$c45.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c46);
        }
      }
    }

    return s0;
  }

  function peg$parseEscapedCharacter() {
    let s0, s1, s2;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 92) {
      s1 = peg$c47;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c48);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseASCII_VALUE();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c49(s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseASCII_VALUE() {
    let s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$currPos;
    s3 = peg$parseHEX_CHAR();
    if (s3 !== peg$FAILED) {
      s4 = peg$parseHEX_CHAR();
      if (s4 !== peg$FAILED) {
        s3 = [s3, s4];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c50(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parseHEX_CHAR() {
    let s0;

    if (peg$c51.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c52);
      }
    }

    return s0;
  }

  function peg$parseFILL() {
    let s0, s1;

    peg$silentFails++;
    s0 = peg$parseSPACE();
    if (s0 === peg$FAILED) {
      s0 = peg$parseTAB();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSEP();
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c53);
      }
    }

    return s0;
  }

  function peg$parseSPACE() {
    let s0, s1;

    peg$silentFails++;
    if (peg$c55.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c56);
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c54);
      }
    }

    return s0;
  }

  function peg$parseTAB() {
    let s0, s1;

    peg$silentFails++;
    if (peg$c58.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c59);
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c57);
      }
    }

    return s0;
  }

  function peg$parseDIGIT() {
    let s0, s1;

    peg$silentFails++;
    s0 = peg$currPos;
    if (peg$c61.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c62);
      }
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c60);
      }
    }

    return s0;
  }

  function peg$parseALPHA() {
    let s0, s1;

    peg$silentFails++;
    s0 = peg$currPos;
    if (peg$c64.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c65);
      }
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c63);
      }
    }

    return s0;
  }

  function peg$parseSEP() {
    let s0, s1;

    peg$silentFails++;
    if (input.substr(peg$currPos, 2) === peg$c67) {
      s0 = peg$c67;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c68);
      }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 10) {
        s0 = peg$c69;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$c70);
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$c66);
      }
    }

    return s0;
  }

  function base64_decode(val: any) {
    return new Buffer(val, 'base64').toString();
  }

  let _pluck = function (list: any, attr: any) {
    return list.map(function (cv: any) {
      return cv[attr];
    });
  };

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail({ type: 'end', description: 'end of input' });
    }

    throw peg$buildException(
      null,
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos),
    );
  }
}

export default peg$parse;
