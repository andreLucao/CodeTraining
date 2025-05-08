import { code as jsBasic } from './javascript/basic';
import { code as jsAsync } from './javascript/async';
import { code as jsReact } from './javascript/react';
import { code as jsMongoDB } from './javascript/mongodb-api';

export const templates = {
  javascript: {
    basic: jsBasic,
    async: jsAsync,
    react: jsReact,
    'mongodb-api': jsMongoDB
  }
};

export const languages = Object.keys(templates);

export const getTemplatesForLanguage = (language) => {
  return Object.keys(templates[language] || {});
}; 