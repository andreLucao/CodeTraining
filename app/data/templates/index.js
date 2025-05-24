import { code as jsBasic } from './javascript/basic';
import { code as jsAsync } from './javascript/async';
import { code as jsReact } from './javascript/react';
import { code as jsMongoDB } from './javascript/mongodb-api';
import { code as jsUserSchema } from './javascript/user-schema';
import { code as jsGetUser } from './javascript/get-user';

export const templates = {
  javascript: {
    basic: jsBasic,
    async: jsAsync,
    react: jsReact,
    'mongodb-api': jsMongoDB,
    'user-schema': jsUserSchema,
    'get-user': jsGetUser
  }
};

export const languages = Object.keys(templates);

export const getTemplatesForLanguage = (language) => {
  return Object.keys(templates[language] || {});
}; 