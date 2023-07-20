import { evaluateFilter } from './simple-filter';

describe('Filter', () => {
  describe('Matching', () => {
    it('simple equality', () => {
      const query = '(sn=smith)';
      expect(evaluateFilter({ sn: 'smith' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'SMITH' }, query)).toEqual(false);
      expect(evaluateFilter({ sn: 'jones' }, query)).toEqual(false);
    });

    it('multi-valued keys', () => {
      const query = '(gn=Rick)';
      let data = { gn: ['Richard', 'Dick', 'Rick', 'Ricky'] };
      expect(evaluateFilter(data, query)).toEqual(true);

      data = { gn: ['Thomas', 'Tom'] };
      expect(evaluateFilter(data, query)).toEqual(false);
    });

    it('attribute presence', () => {
      const query = '(sn=*)';
      expect(evaluateFilter({ sn: 'smith' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'jones' }, query)).toEqual(true);
      expect(evaluateFilter({ gn: 'jim' }, query)).toEqual(false);
    });

    it('attribute contains value', () => {
      const query = '(sn=*smith*)';
      expect(evaluateFilter({ sn: 'smith' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'smith-jones' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'McSmithers' }, query)).toEqual(false);
    });

    it('attribute ends with value', () => {
      const query = '(sn=*smith)';
      expect(evaluateFilter({ sn: 'smith' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'jones-smith' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'jensen-smith-jones' }, query)).toEqual(false);
    });

    it('attribute starts with value', () => {
      const query = '(sn=smith*)';
      expect(evaluateFilter({ sn: 'smith' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'smith-jones' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'jones-smith-jensen' }, query)).toEqual(false);
    });

    it('attribute greater than or equal', () => {
      // Numeric
      let query = '(age>=5)';
      expect(evaluateFilter({ age: 4 }, query)).toEqual(false);
      expect(evaluateFilter({ age: '4' }, query)).toEqual(false);
      expect(evaluateFilter({ age: 5 }, query)).toEqual(true);
      expect(evaluateFilter({ age: '5' }, query)).toEqual(true);
      expect(evaluateFilter({ age: 6 }, query)).toEqual(true);
      expect(evaluateFilter({ age: '6' }, query)).toEqual(true);
      expect(evaluateFilter({}, query)).toEqual(false);

      // Lexical
      query = '(sn>=bell)';
      expect(evaluateFilter({ sn: 'ace' }, query)).toEqual(false);
      expect(evaluateFilter({ sn: 'bell' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'call' }, query)).toEqual(true);
    });

    it('attribute less than or equal', () => {
      // Numeric
      let query = '(age<=5)';
      expect(evaluateFilter({ age: 4 }, query)).toEqual(true);
      expect(evaluateFilter({ age: '4' }, query)).toEqual(true);
      expect(evaluateFilter({ age: 5 }, query)).toEqual(true);
      expect(evaluateFilter({ age: '5' }, query)).toEqual(true);
      expect(evaluateFilter({ age: 6 }, query)).toEqual(false);
      expect(evaluateFilter({ age: '6' }, query)).toEqual(false);
      expect(evaluateFilter({}, query)).toEqual(false);

      // Lexical
      query = '(sn<=bell)';
      expect(evaluateFilter({ sn: 'ace' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'bell' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'call' }, query)).toEqual(false);
    });

    it('aggregate AND', () => {
      const query = '(&(gn=Jenny)(sn=Jensen*))';
      expect(evaluateFilter({ gn: 'Jenny', sn: 'Jensen' }, query)).toEqual(true);
      expect(evaluateFilter({ gn: 'Jenny', sn: 'Jensen-Smith' }, query)).toEqual(true);
      expect(evaluateFilter({ gn: 'Jerry', sn: 'Jensen' }, query)).toEqual(false);
      expect(evaluateFilter({ sn: 'Jensen' }, query)).toEqual(false);
    });

    it('aggregate OR', () => {
      const query = '(|(gn=Jenny)(sn=Jensen*))';
      expect(evaluateFilter({ gn: 'Jenny', sn: 'Jensen' }, query)).toEqual(true);
      expect(evaluateFilter({ gn: 'Jenny' }, query)).toEqual(true);
      expect(evaluateFilter({ sn: 'Jensen' }, query)).toEqual(true);
      expect(evaluateFilter({ gn: 'Jerry', sn: 'Jones' }, query)).toEqual(false);
      expect(evaluateFilter({}, query)).toEqual(false);
    });

    it('negation (NOT)', () => {
      const query = '(!(sn=Jensen))';
      expect(evaluateFilter({ sn: 'Jensen' }, query)).toEqual(false);
      expect(evaluateFilter({ sn: 'Jones' }, query)).toEqual(true);
      expect(evaluateFilter({}, query)).toEqual(true);
    });

    // it('values that require escaping', () => {
    //   const filter = Filter.attribute('info').equalTo('*(test)*');
    //   expect(filter.match({ info: '*(test)*' })).toEqual(true);
    //   expect(filter.match({ info: '(test)' })).toEqual(false);
    //   expect(filter.match({})).toEqual(false);
    // });

    // This is kind of a mishmash
    it('complex filter and object match', () => {
      const query = '(&(active=1)(!(objectClass=inetMailObject))(|(gn=jenny)(sn=jensen*)))';

      const data: any = { active: '1', gn: 'jenny' };
      expect(evaluateFilter(data, query)).toEqual(true);

      data.objectClass = ['person'];
      expect(evaluateFilter(data, query)).toEqual(true);

      data.objectClass = ['person', 'inetMailObject'];
      expect(evaluateFilter(data, query)).toEqual(false);

      expect(evaluateFilter({}, query)).toEqual(false);
    });

    // it("matches substrings with multiple *'s", () => {
    //   const filter = Filter.attribute('cn').raw('*jen* jo*e*');
    //   expect(filter.match({ cn: 'Jenny Jones' })).toEqual(true);
    // });

    // it('match embedded escape characters', () => {
    //   const filter = Filter.attribute('cn').raw('jenny\\2a \\28jones\\29 \\5c');
    //   expect(filter.match({ cn: 'Jenny* (Jones) \\' })).toEqual(true);
    // });
    //
    // it('matches embedded escape characters with substring', () => {
    //   const filter = Filter.attribute('cn').raw('*jenny\\2a j*s*');
    //   expect(filter.match({ cn: 'Jenny* Jones' })).toEqual(true);
    // });
  });
});
