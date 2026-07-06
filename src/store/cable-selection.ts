import { Cable } from '@/services/cables';

// Module-level cache — survives navigation within the same session.
let _cable: Cable | null = null;

export const cableStore = {
  set(cable: Cable) { _cable = cable; },
  get(): Cable | null { return _cable; },
  clear() { _cable = null; },
};
