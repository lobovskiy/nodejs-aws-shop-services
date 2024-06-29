import * as yup from 'yup';

export const productSchema = yup.object({
  title: yup.string().required(),
  description: yup.string().required(),
  price: yup.number().positive().required(),
  count: yup.number().integer().positive().required(),
});
