const HTTP_STATUS_MESSAGES = {
  400: 'Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to do this.",
  404: 'The requested item was not found.',
  409: 'This item already exists.',
  500: 'Something went wrong. Please try again.',
};

export const getFriendlyError = (err) => {
  if (err?.message && err.message !== 'Network Error' && !err.message.startsWith('Request failed')) {
    return err.message;
  }
  const status = err?.response?.status;
  if (status && HTTP_STATUS_MESSAGES[status]) return HTTP_STATUS_MESSAGES[status];
  return 'Something went wrong. Please try again.';
};
