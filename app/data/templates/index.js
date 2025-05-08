import { code as jsBasic } from './javascript/basic';
import { code as jsAsync } from './javascript/async';
import { code as jsReact } from './javascript/react';

export const templates = {
  javascript: {
    basic: jsBasic,
    async: jsAsync,
    react: jsReact
  }
};

export const languages = Object.keys(templates);

export const getTemplatesForLanguage = (language) => {
  return Object.keys(templates[language] || {});
}; 