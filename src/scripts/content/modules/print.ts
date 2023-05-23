import * as logger from '@/utils/logger';

export const printLine = (line: string) => {
  logger.debug('===> FROM THE PRINT MODULE:', line);
};
