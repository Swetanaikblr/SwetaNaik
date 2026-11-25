import { useNavigate } from 'react-router-dom';
import { CATEGORY_META } from '../data/categories';
import { useStore } from '../store/useStore';
import type { Category } from '../types';

const RECENT_MS = 3 * 60 * 1000;

/** Open a category because the CHILD chose it. Records whether it was voluntary or after an Echo suggestion. */
export function useOpenCategory() {
  const navigate = useNavigate();
  return (c: Category, fromEchoChip = false) => {
    const { lastEchoOffer, logEvent } = useStore.getState();
    let via: 'tile' | 'tile_after_echo' | 'echo_chip' = 'tile';
    if (fromEchoChip) via = 'echo_chip';
    else if (lastEchoOffer && lastEchoOffer.categories.includes(c) && Date.now() - lastEchoOffer.at < RECENT_MS) via = 'tile_after_echo';
    if (fromEchoChip) logEvent('echo_suggestion_accepted', { category: c });
    else if (lastEchoOffer && !lastEchoOffer.categories.includes(c)) logEvent('echo_suggestion_ignored');
    logEvent('category_opened', { category: c, via });
    useStore.setState({ lastEchoOffer: null });
    navigate(CATEGORY_META[c].path);
  };
}
