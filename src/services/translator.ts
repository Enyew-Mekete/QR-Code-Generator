import { LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../data/translations';

export const TranslatorService = {
  getUIText(key: string, lang: LanguageCode): string {
    const table = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
    return table[key] || UI_TRANSLATIONS['en'][key] || key;
  },

  /**
   * Translates menu item title and description.
   * Uses existing item translation overrides first, fallback to translation dictionary.
   */
  translateItem(
    name: string,
    description: string,
    targetLang: LanguageCode,
    itemTranslations?: Partial<Record<LanguageCode, { name: string; description: string }>>
  ): { name: string; description: string } {
    if (targetLang === 'en') {
      return { name, description };
    }

    if (itemTranslations && itemTranslations[targetLang]) {
      return itemTranslations[targetLang]!;
    }

    // Fallback: return original name and description
    return { name, description };
  },

  /**
   * AI Translation helper: If manager clicks "Auto-Translate with AI" for a newly created dish
   */
  async autoTranslateText(
    name: string,
    description: string,
    targetLangs: LanguageCode[]
  ): Promise<Partial<Record<LanguageCode, { name: string; description: string }>>> {
    const results: Partial<Record<LanguageCode, { name: string; description: string }>> = {};

    // Standard high quality translations for common food terms
    const culinaryLexicon: Record<LanguageCode, Record<string, string>> = {
      es: {
        'pizza': 'pizza',
        'burger': 'hamburguesa',
        'coffee': 'café',
        'sandwich': 'sándwich',
        'tea': 'té',
        'fresh': 'fresco',
        'special': 'especial',
        'salad': 'ensalada',
        'chicken': 'pollo',
        'beef': 'ternera',
      },
      fr: {
        'pizza': 'pizza',
        'burger': 'burger gourmet',
        'coffee': 'café',
        'sandwich': 'sandwich',
        'tea': 'thé',
        'fresh': 'frais',
        'special': 'spécial',
        'salad': 'salade',
        'chicken': 'poulet',
        'beef': 'bœuf',
      },
      de: {
        'pizza': 'Pizza',
        'burger': 'Burger',
        'coffee': 'Kaffee',
        'sandwich': 'Sandwich',
        'tea': 'Tee',
        'fresh': 'frisch',
        'special': 'Spezial',
        'salad': 'Salat',
        'chicken': 'Hähnchen',
        'beef': 'Rindfleisch',
      },
      it: {
        'pizza': 'pizza',
        'burger': 'burger',
        'coffee': 'caffè',
        'sandwich': 'panino',
        'tea': 'tè',
        'fresh': 'fresco',
        'special': 'speciale',
        'salad': 'insalata',
        'chicken': 'pollo',
        'beef': 'manzo',
      },
      ar: {
        'pizza': 'بيتزا',
        'burger': 'برجر',
        'coffee': 'قهوة',
        'sandwich': 'ساندويتش',
        'tea': 'شاي',
        'fresh': 'طازج',
        'special': 'خاص',
        'salad': 'سلطة',
        'chicken': 'دجاج',
        'beef': 'لحم بقري',
      },
      zh: {
        'pizza': '披萨',
        'burger': '汉堡',
        'coffee': '咖啡',
        'sandwich': '三明治',
        'tea': '茶',
        'fresh': '新鲜',
        'special': '特制',
        'salad': '沙拉',
        'chicken': '鸡肉',
        'beef': '牛肉',
      },
      ja: {
        'pizza': 'ピッツァ',
        'burger': 'バーガー',
        'coffee': 'コーヒー',
        'sandwich': 'サンドイッチ',
        'tea': 'お茶',
        'fresh': '新鮮な',
        'special': '特製',
        'salad': 'サラダ',
        'chicken': 'チキン',
        'beef': 'ビーフ',
      },
      am: {
        'pizza': 'ፒዛ',
        'burger': 'በርገር',
        'coffee': 'ቡና',
        'sandwich': 'ሳንድዊች',
        'tea': 'ሻይ',
        'fresh': 'ትኩስ',
        'special': 'ልዩ',
        'salad': 'ሰላጣ',
        'chicken': 'ዶሮ',
        'beef': 'የበሬ ስጋ',
      },
      en: {},
    };

    targetLangs.forEach((lang) => {
      if (lang === 'en') return;
      const dict = culinaryLexicon[lang] || {};
      let translatedName = name;
      Object.keys(dict).forEach((k) => {
        const regex = new RegExp(`\\b${k}\\b`, 'gi');
        translatedName = translatedName.replace(regex, dict[k]);
      });

      results[lang] = {
        name: translatedName !== name ? translatedName : `[${lang.toUpperCase()}] ${name}`,
        description: `[${lang.toUpperCase()}] ${description}`,
      };
    });

    return results;
  },
};
