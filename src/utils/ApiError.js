class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrorng",
    errors = [],
    stack = ""
  ) {
    super(message); //super beacuse there are parent class named Error and we also have to call this constructor of parent class..
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
