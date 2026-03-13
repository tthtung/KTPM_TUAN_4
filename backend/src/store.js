import path from 'node:path';
import { JsonStore } from './core/jsonStore.js';

const filePath = path.resolve('data/db.json');

export const store = new JsonStore({
  filePath,
  initialData: {
    lectures: [],
    attachments: [],
    courses: [],
    users: []
  }
});
