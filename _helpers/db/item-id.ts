export class ItemIdAllocator {
    // String.PadStart() can be used to ensure ID always conforms to same structure - i.e. '123' and '4' equate to '00123' and '00004'
    // WorkerIndex can be used to create unique ID per worker fixture, avoiding DB conflict with parallel tests

    private counter : number = 0;

    public getID(workerIndex : number) {
        let paddedString : string = this.counter.toString().padStart(4, '0');
        this.counter++;
        return workerIndex.toString() + paddedString;
    }
}