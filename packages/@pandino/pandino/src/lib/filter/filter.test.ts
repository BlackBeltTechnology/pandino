import Filter from './filter';

describe('Filter', () => {
  describe('Building filters', () => {
    it('builds a presence filter', () => {
      const out = Filter.attribute('sn').present().toString();
      expect(out).toEqual('(sn=*)');
    });

    it('builds an equality filter', () => {
      const out = Filter.attribute('sn').equalTo('Jones').toString();
      expect(out).toEqual('(sn=Jones)');
    });

    it('builds an ends with filter', () => {
      const out = Filter.attribute('sn').endsWith('jones').toString();
      expect(out).toEqual('(sn=*jones)');
    });

    it('builds an starts with filter', () => {
      const out = Filter.attribute('sn').startsWith('jones').toString();
      expect(out).toEqual('(sn=jones*)');
    });

    it('builds a contains filter', () => {
      const out = Filter.attribute('sn').contains('jones').toString();
      expect(out).toEqual('(sn=*jones*)');
    });

    it('builds an approximate filter', () => {
      const out = Filter.attribute('sn').approx('jones').toString();
      expect(out).toEqual('(sn~=jones)');
    });

    it('builds an less than or equal filter', () => {
      const out = Filter.attribute('sn').lte('smith').toString();
      expect(out).toEqual('(sn<=smith)');
    });

    it('builds an greater than or equal filter', () => {
      const out = Filter.attribute('sn').gte('smith').toString();
      expect(out).toEqual('(sn>=smith)');
    });

    it('converts number values to strings', () => {
      const out = Filter.attribute('age').equalTo(1000).toString();
      expect(out).toEqual('(age=1000)');
    });

    it('properly escapes values', () => {
      const out = Filter.attribute('description').equalTo('a * (complex) \\value').toString();
      expect(out).toEqual('(description=a \\2a \\28complex\\29 \\5cvalue)');
    });
  });

  describe('Aggregate filters', () => {
    it('AND filters', () => {
      const out = Filter.AND([
        Filter.attribute('givenName').equalTo('jenny'),
        Filter.attribute('sn').equalTo('jensen'),
      ]).toString();

      expect(out).toEqual('(&(givenName=jenny)(sn=jensen))');
    });

    it('OR filters', () => {
      const out = Filter.OR([
        Filter.attribute('givenName').equalTo('jenny'),
        Filter.attribute('sn').equalTo('jensen'),
      ]).toString();

      expect(out).toEqual('(|(givenName=jenny)(sn=jensen))');
    });

    it('NOT filter', () => {
      const out = Filter.NOT([Filter.attribute('sn').equalTo('jensen')]).toString();

      expect(out).toEqual('(!(sn=jensen))');
    });
  });

  describe('Matching', () => {
    it('simple equality', () => {
      const filter = Filter.attribute('sn').equalTo('smith');
      expect(filter.match({ sn: 'smith' })).toEqual(true);
      expect(filter.match({ sn: 'SMITH' })).toEqual(true);
      expect(filter.match({ sn: 'jones' })).toEqual(false);
    });

    it('multi-valued keys', () => {
      const filter = Filter.attribute('gn').equalTo('rick');
      let data = { gn: ['Richard', 'Dick', 'Rick', 'Ricky'] };

      expect(filter.match(data)).toEqual(true);

      data = { gn: ['Thomas', 'Tom'] };
      expect(filter.match(data)).toEqual(false);
    });

    it('attribute presense', () => {
      let filter = Filter.attribute('sn').present();
      expect(filter.match({ sn: 'smith' })).toEqual(true);
      expect(filter.match({ sn: 'jones' })).toEqual(true);
      expect(filter.match({ gn: 'jim' })).toEqual(false);

      filter = Filter.parse('(sn=*)');
      expect(filter.match({ sn: 'smith' })).toEqual(true);
      expect(filter.match({ sn: 'jones' })).toEqual(true);
      expect(filter.match({ gn: 'jim' })).toEqual(false);
    });

    it('attribute contains value', () => {
      const filter = Filter.attribute('sn').contains('smith');
      expect(filter.match({ sn: 'smith' })).toEqual(true);
      expect(filter.match({ sn: 'smith-jones' })).toEqual(true);
      expect(filter.match({ sn: 'McSmithers' })).toEqual(true);
      expect(filter.match({ sn: 'Jones' })).toEqual(false);
    });

    it('attribute ends with value', () => {
      const filter = Filter.attribute('sn').endsWith('smith');
      expect(filter.match({ sn: 'Smith' })).toEqual(true);
      expect(filter.match({ sn: 'Jones-Smith' })).toEqual(true);
      expect(filter.match({ sn: 'Jensen-Smith-Jones' })).toEqual(false);
    });

    it('attribute starts with value', () => {
      const filter = Filter.attribute('sn').startsWith('smith');
      expect(filter.match({ sn: 'Smith' })).toEqual(true);
      expect(filter.match({ sn: 'Smith-Jones' })).toEqual(true);
      expect(filter.match({ sn: 'Jones-Smith-Jensen' })).toEqual(false);
    });

    it('attribute greater than or equal', () => {
      // Numeric
      let filter = Filter.attribute('age').gte('5');
      expect(filter.match({ age: 4 })).toEqual(false);
      expect(filter.match({ age: '4' })).toEqual(false);
      expect(filter.match({ age: 5 })).toEqual(true);
      expect(filter.match({ age: '5' })).toEqual(true);
      expect(filter.match({ age: 6 })).toEqual(true);
      expect(filter.match({ age: '6' })).toEqual(true);
      expect(filter.match({})).toEqual(false);

      // Lexical
      filter = Filter.attribute('sn').gte('bell');
      expect(filter.match({ sn: 'ace' })).toEqual(false);
      expect(filter.match({ sn: 'bell' })).toEqual(true);
      expect(filter.match({ sn: 'call' })).toEqual(true);
    });

    it('attribute less than or equal', () => {
      // Numeric
      let filter = Filter.attribute('age').lte('5');
      expect(filter.match({ age: 5 })).toEqual(true);
      expect(filter.match({ age: '5' })).toEqual(true);
      expect(filter.match({ age: 6 })).toEqual(false);
      expect(filter.match({ age: '6' })).toEqual(false);
      expect(filter.match({ age: '4' })).toEqual(true);
      expect(filter.match({ age: 4 })).toEqual(true);
      expect(filter.match({})).toEqual(false);

      // Lexical
      filter = Filter.attribute('sn').lte('bell');
      expect(filter.match({ sn: 'ace' })).toEqual(true);
      expect(filter.match({ sn: 'bell' })).toEqual(true);
      expect(filter.match({ sn: 'call' })).toEqual(false);
    });

    it('aggregate AND', () => {
      const filter = Filter.AND([Filter.attribute('gn').equalTo('jenny'), Filter.attribute('sn').startsWith('jensen')]);
      expect(filter.match({ gn: 'Jenny', sn: 'Jensen' })).toEqual(true);
      expect(filter.match({ gn: 'Jenny', sn: 'Jensen-Smith' })).toEqual(true);
      expect(filter.match({ gn: 'Jerry', sn: 'Jensen' })).toEqual(false);
      expect(filter.match({ sn: 'Jensen' })).toEqual(false);
    });

    it('aggregate OR', () => {
      const filter = Filter.OR([Filter.attribute('gn').equalTo('jenny'), Filter.attribute('sn').startsWith('jensen')]);
      expect(filter.match({ gn: 'Jenny', sn: 'Jensen' })).toEqual(true);
      expect(filter.match({ gn: 'Jenny' })).toEqual(true);
      expect(filter.match({ sn: 'Jensen' })).toEqual(true);
      expect(filter.match({ gn: 'Jerry', sn: 'Jones' })).toEqual(false);
      expect(filter.match({})).toEqual(false);
    });

    it('negation (NOT)', () => {
      const filter = Filter.NOT(Filter.attribute('sn').equalTo('jensen'));
      expect(filter.match({ sn: 'Jensen' })).toEqual(false);
      expect(filter.match({ sn: 'Jones' })).toEqual(true);
      expect(filter.match({})).toEqual(true);
    });

    it('values that require escaping', () => {
      const filter = Filter.attribute('info').equalTo('*(test)*');
      expect(filter.match({ info: '*(test)*' })).toEqual(true);
      expect(filter.match({ info: '(test)' })).toEqual(false);
      expect(filter.match({})).toEqual(false);
    });

    // This is kind of a mishmash
    it('complex filter and object match', () => {
      const filter = Filter.AND([
        Filter.attribute('active').equalTo('1'),
        Filter.NOT(Filter.attribute('objectClass').equalTo('inetMailObject')),
        Filter.OR([Filter.attribute('gn').equalTo('jenny'), Filter.attribute('sn').startsWith('jensen')]),
      ]);

      const data: any = { active: '1', gn: 'jenny' };
      expect(filter.match(data)).toEqual(true);

      data.objectClass = ['person'];
      expect(filter.match(data)).toEqual(true);

      data.objectClass = ['person', 'inetMailObject'];
      expect(filter.match(data)).toEqual(false);

      expect(filter.match({})).toEqual(false);
    });

    it("matches substrings with multiple *'s", () => {
      const filter = Filter.attribute('cn').raw('*jen* jo*e*');
      expect(filter.match({ cn: 'Jenny Jones' })).toEqual(true);
    });

    it('match embedded escape characters', () => {
      const filter = Filter.attribute('cn').raw('jenny\\2a \\28jones\\29 \\5c');
      expect(filter.match({ cn: 'Jenny* (Jones) \\' })).toEqual(true);
    });

    it('matches embedded escape characters with substring', () => {
      const filter = Filter.attribute('cn').raw('*jenny\\2a j*s*');
      expect(filter.match({ cn: 'Jenny* Jones' })).toEqual(true);
    });
  });

  describe('Parsing', () => {
    it('parse small filter', () => {
      const filter = '(sn=smith)';
      const parsed = Filter.parse(filter);
      expect(parsed.toString()).toEqual(filter);
    });

    it('parses a funny character value', () => {
      const filter = '(orgUnit=%)';
      const parsed = Filter.parse(filter);
      expect(parsed.toString()).toEqual(filter);
    });

    it('parse more complex filter', () => {
      const filter = '(&(sn=smith)(gn=john)(!(age=5)))';
      const parsed = Filter.parse(filter);
      expect(parsed.toString()).toEqual(filter);
    });

    it('matching against parsed filter', () => {
      const filter = '(&(sn=jensen)(gn=jenny))';
      const parsed = Filter.parse(filter);
      let data: any = { sn: 'Jensen', gn: 'Jenny' };
      expect(parsed.match(data)).toEqual(true);

      data = { sn: 'Jensen' };
      expect(parsed.match(data)).toEqual(false);
    });

    it('fails on incorrectly formed filter', () => {
      const filter = '(sn=smith';
      expect(() => Filter.parse(filter)).toThrow();
    });

    it('parses substring matches beginning with asterisk', () => {
      const filter = '(sn=*smith*)';
      const parsed = Filter.parse(filter);
      expect(parsed.type).toEqual('filter');
      expect(parsed.attrib).toEqual('sn');
      expect(parsed.comp).toEqual('=');
      expect(parsed.value).toEqual('*smith*');
    });

    it('fails on incorrect format past first correct filter parse', () => {
      const filter = '(&(sn=smith))\n(uuid=3) f';
      expect(() => Filter.parse(filter)).toThrow();
    });

    it('allows whitespace', () => {
      const filter = ' (&  (sn=smith) \n )  ';
      expect(Filter.parse(filter).toString()).toEqual('(&(sn=smith))');
    });

    it('parses a single filter without parenthesis', () => {
      const filter = 'sn=smith';
      expect(Filter.parse(filter).toString()).toEqual('(sn=smith)');
    });

    it('allows whitespace on single filter without parenthesis', () => {
      const filter = '\n sn=smith ';
      expect(Filter.parse(filter).toString()).toEqual('(sn=smith)');
    });
  });

  describe('Simplify', () => {
    it("does not simplify what it shouldn't", () => {
      const input = '(&(givenName=jenny)(sn=jensen)(|(c=us)(st=ontario)))';
      const parsed = Filter.parse(input);
      expect(parsed.toString()).toEqual(input);
    });

    it('does simplify what it should', () => {
      const input = '(&(givenName=jenny)(sn=jensen)(|(!(c=us))(st=ontario)))';
      const complex = '(&(|(givenName=jenny))(&(sn=jensen))(|(!(c=us))(st=ontario)))';
      const parsed = Filter.parse(complex);
      expect(parsed.simplify().toString()).toEqual(input);
    });
  });

  describe('Output', () => {
    const input = '(&(givenName=jenny)(sn=jensen)(|(c=us)(st=ontario)))';
    const parsed = Filter.parse(input);

    it('basic output toString()', () => {
      expect(parsed.toString()).toEqual('(&(givenName=jenny)(sn=jensen)(|(c=us)(st=ontario)))');
    });

    it('basic output string concatenation', () => {
      expect(parsed + '').toEqual('(&(givenName=jenny)(sn=jensen)(|(c=us)(st=ontario)))');
    });

    it('beautifies with default indentation', () => {
      Filter.indent = 4;
      expect(parsed.toString(true)).toEqual(
        '(&\n    (givenName=jenny)\n    (sn=jensen)\n    (|\n        (c=us)\n        (st=ontario)\n    )\n)',
      );
    });

    it('beautifies with specified indent', () => {
      expect(parsed.toString(2)).toEqual(
        '(&\n  (givenName=jenny)\n  (sn=jensen)\n  (|\n    (c=us)\n    (st=ontario)\n  )\n)',
      );
    });

    it('indents with custom string', () => {
      expect(parsed.toString(2, null, '\t')).toEqual(
        '(&\n\t\t(givenName=jenny)\n\t\t(sn=jensen)\n\t\t(|\n\t\t\t\t(c=us)\n\t\t\t\t(st=ontario)\n\t\t)\n)',
      );
    });

    it('indents with custom string (global setting)', () => {
      const old = Filter.indent_char;
      Filter.indent_char = '\t';
      expect(parsed.toString(2)).toEqual(
        '(&\n\t\t(givenName=jenny)\n\t\t(sn=jensen)\n\t\t(|\n\t\t\t\t(c=us)\n\t\t\t\t(st=ontario)\n\t\t)\n)',
      );
      Filter.indent_char = old;
    });

    it('fails if indent string not a string', () => {
      expect(() => parsed.toString(2, null, 1)).toThrow();
    });
  });
});
