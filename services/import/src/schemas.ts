import * as yup from 'yup';

export const importUrlSchema = yup.object({
  name: yup.string().required(),
});

export const productSchema = yup.object({
  title: yup.string().required(),
  description: yup.string().required(),
  price: yup.number().positive().required(),
  count: yup.number().integer().positive().required(),
  image: yup.string(),
});
