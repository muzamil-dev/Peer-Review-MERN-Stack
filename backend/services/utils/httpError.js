// Error class to throw errors from service functions
// Includes a status parameter, allowing endpoints to receive specific status codes
// when a service function throws an error
class HttpError extends Error{
    constructor(message, status){
        super(message);
        this.status = status;
    }
}

export default HttpError;