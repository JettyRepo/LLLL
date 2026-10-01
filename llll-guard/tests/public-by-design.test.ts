import { describe, expect, it } from 'vitest';
import { publicByDesignReason, type PublicByDesignInput } from '../src/scanners/public-by-design.js';

const never = { isPublishedValue: () => false };
const always = { isPublishedValue: () => true };

const VALUE = 'AbCdEf0123456789XyZqWe';

function input(overrides: Partial<Omit<PublicByDesignInput, 'valueStart'>>): PublicByDesignInput {
  const base = {
    tier: 'generic' as const,
    ruleId: 'PG-H006',
    value: VALUE,
    lineText: `const API_KEY = "${VALUE}";`,
    file: 'src/app.js',
    ...overrides,
  };
  return { ...base, valueStart: base.lineText.indexOf(base.value) };
}

describe('publicByDesignReason: what can never be public by design', () => {
  it.each(['provider', 'pii'] as const)('never downgrades a %s finding, whatever the context', tier => {
    const everything = input({
      tier,
      lineText: `const NEXT_PUBLIC_KEY = "${VALUE}";`,
      file: '.env.example',
    });

    expect(publicByDesignReason(everything, always)).toBeNull();
  });
});

describe('publicByDesignReason: client-exposed variables', () => {
  it('downgrades an API key assigned to a client-exposed variable', () => {
    const reason = publicByDesignReason(input({ lineText: `const NEXT_PUBLIC_MAPS_API_KEY = "${VALUE}";` }), never);

    expect(reason).toContain('NEXT_PUBLIC_MAPS_API_KEY');
  });

  it.each(['NEXT_PUBLIC_', 'NUXT_PUBLIC_', 'EXPO_PUBLIC_', 'REACT_APP_', 'GATSBY_', 'VITE_'])(
    'recognises the %s prefix',
    prefix => {
      const line = `${prefix}MAPS_API_KEY=${'"'}${VALUE}${'"'}`.replace('=', ' = ');

      expect(publicByDesignReason(input({ lineText: line }), never)).not.toBeNull();
    },
  );

  it('ignores a prefix that only appears in a comment on the same line', () => {
    const line = `const apiKey = "${VALUE}"; // VITE_ see docs`;

    expect(publicByDesignReason(input({ lineText: line }), never)).toBeNull();
  });

  it('ignores a prefix that belongs to another variable on the line', () => {
    const line = `cfg = { VITE_MODE: mode, api_key: "${VALUE}" }`;

    expect(publicByDesignReason(input({ lineText: line }), never)).toBeNull();
  });

  it('does not treat a secret-sounding name as public because of its prefix', () => {
    for (const name of ['REACT_APP_API_SECRET', 'NEXT_PUBLIC_PRIVATE_API_KEY', 'VITE_TOKEN_API_KEY']) {
      expect(publicByDesignReason(input({ lineText: `${name} = "${VALUE}"` }), never)).toBeNull();
    }
  });

  it('only applies to API keys, not to passwords, database credentials or bearer tokens', () => {
    for (const ruleId of ['PG-H007', 'PG-H008', 'PG-H009']) {
      const line = `NEXT_PUBLIC_THING = "${VALUE}"`;

      expect(publicByDesignReason(input({ ruleId, lineText: line }), never)).toBeNull();
    }
  });
});

describe('publicByDesignReason: env templates', () => {
  it('downgrades a placeholder value in a template', () => {
    const reason = publicByDesignReason(
      input({ value: 'changemechangeme1234', lineText: 'API_KEY="changemechangeme1234"', file: '.env.example' }),
      never,
    );

    expect(reason).toContain('placeholder');
  });

  it('keeps a realistic value blocked even in a template, the classic copy of a real .env', () => {
    expect(publicByDesignReason(input({ lineText: `API_KEY="${VALUE}"`, file: '.env.example' }), never)).toBeNull();
  });

  it('does not treat a placeholder in an ordinary file as public', () => {
    const reason = publicByDesignReason(
      input({ value: 'changemechangeme1234', lineText: 'API_KEY="changemechangeme1234"', file: 'src/app.js' }),
      never,
    );

    expect(reason).toBeNull();
  });
});

describe('publicByDesignReason: values already published', () => {
  it('downgrades a value that is already in a published template or README', () => {
    expect(publicByDesignReason(input({}), always)).toContain('already published');
  });

  it('asks about the matched value, never the variable name or the line', () => {
    const asked: string[] = [];
    publicByDesignReason(input({ lineText: `const STRIPE_SECRET_API_KEY = "${VALUE}";` }), {
      isPublishedValue: value => {
        asked.push(value);
        return false;
      },
    });

    expect(asked).toEqual([VALUE]);
  });

  it('does not ask about identifiers or short values, which are not secrets', () => {
    const asked: string[] = [];
    const deps = {
      isPublishedValue: (value: string) => {
        asked.push(value);
        return true;
      },
    };

    expect(publicByDesignReason(input({ value: 'ANTHROPIC_API_KEY' }), deps)).toBeNull();
    expect(publicByDesignReason(input({ value: 'short1' }), deps)).toBeNull();
    expect(asked).toEqual([]);
  });
});
