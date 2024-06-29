import * as yup from 'yup';

export const importUrlSchema = yup.object({
  name: yup.string().required(),
});
