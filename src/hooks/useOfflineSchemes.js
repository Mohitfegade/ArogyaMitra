import { useEffect, useState, useCallback } from 'react';

const CACHE_KEY = 'arogyamitra_schemes_cache';
const CACHE_TIMESTAMP_KEY = 'arogyamitra_schemes_cached_at';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useOfflineSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [isSchemesCached, setIsSchemesCached] = useState(false);

  useEffect(() => {
    const loadSchemes = async () => {
      // 1. Try loading from localStorage first (works offline)
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedAt = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      const isStale = !cachedAt || Date.now() - parseInt(cachedAt) > CACHE_TTL_MS;

      if (cached) {
        try {
          setSchemes(JSON.parse(cached));
          setIsSchemesCached(true);
        } catch {
          // Corrupted cache, will re-fetch below
        }
      }

      // 2. If online and stale (or no cache), refresh from network
      if (navigator.onLine && isStale) {
        try {
          const res = await fetch('/schemes.json');
          if (res.ok) {
            const data = await res.json();
            setSchemes(data);
            setIsSchemesCached(true);
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
          }
        } catch (e) {
          console.warn('[OfflineSchemes] Failed to refresh schemes from network:', e.message);
        }
      }
    };

    loadSchemes();
  }, []);

  /**
   * Client-side scheme search. Matches the user's query against scheme keywords,
   * name, and description fields. Returns the top 3 matches.
   */
  const searchSchemes = useCallback((query, lang = 'Hindi') => {
    if (!query || schemes.length === 0) return [];

    const q = query.toLowerCase();

    const scored = schemes.map((scheme) => {
      let score = 0;
      const keywordMatch = scheme.keywords?.some(k => q.includes(k.toLowerCase()) || k.toLowerCase().includes(q));
      if (keywordMatch) score += 3;
      if (scheme.name.toLowerCase().includes(q)) score += 2;
      if (scheme.description?.toLowerCase().includes(q)) score += 1;
      return { scheme, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.scheme);
  }, [schemes]);

  /**
   * Format matched schemes into a human-readable response in the preferred language.
   */
  const formatOfflineSchemeResponse = useCallback((matchedSchemes, lang = 'Hindi') => {
    if (matchedSchemes.length === 0) {
      if (lang === 'Hindi') return '📶 ऑफलाइन मोड: मुझे इससे मिलती-जुलती कोई योजना नहीं मिली। ऑनलाइन होने पर दोबारा पूछें।';
      if (lang === 'Marathi') return '📶 ऑफलाइन मोड: मला संबंधित योजना सापडली नाही. ऑनलाइन झाल्यावर पुन्हा विचारा.';
      return '📶 Offline mode: No matching scheme found in cached data. Try again when online.';
    }

    const prefix = lang === 'Hindi'
      ? `📶 ऑफलाइन मोड — ये जानकारी स्थानीय डेटा से है, ताज़ा जानकारी के लिए ऑनलाइन होने पर दोबारा पूछें:\n\n`
      : lang === 'Marathi'
        ? `📶 ऑफलाइन मोड — ही माहिती स्थानिक डेटामधून आहे. अधिक माहितीसाठी ऑनलाइन झाल्यावर विचारा:\n\n`
        : `📶 Offline mode — showing cached scheme info (may not be fully personalized):\n\n`;

    const schemeLines = matchedSchemes.map((s, i) => {
      const name = lang === 'Hindi' ? (s.name_hi || s.name) : lang === 'Marathi' ? (s.name_mr || s.name) : s.name;
      const desc = lang === 'Hindi' ? (s.description_hi || s.description) : lang === 'Marathi' ? (s.description_mr || s.description) : s.description;
      return `${i + 1}. **${name}**\n   ${desc}`;
    }).join('\n\n');

    return prefix + schemeLines;
  }, [schemes]);

  return { schemes, isSchemesCached, searchSchemes, formatOfflineSchemeResponse };
}
