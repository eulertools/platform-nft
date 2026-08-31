export class ValidationError extends Error {

    public statusCode:number;

    public description:string;

    constructor(statusCode:number, description:string, internalMessage:string) {
        super(internalMessage);
        this.statusCode = statusCode;
        this.description = description;
    }
};