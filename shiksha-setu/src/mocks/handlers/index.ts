import { schemeHandlers } from './schemes';
import { applicationHandlers } from './applications';
import { statsHandlers } from './stats';
import { notificationHandlers } from './notifications';

export const handlers = [
  ...schemeHandlers,
  ...applicationHandlers,
  ...statsHandlers,
  ...notificationHandlers,
];
