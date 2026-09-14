export const apiResponse = (data = {}, meta = undefined) => {
  const response = { data };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return response;
};
