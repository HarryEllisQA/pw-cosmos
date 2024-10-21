import { Container, ContainerResponse, CosmosClient, DatabaseResponse } from '@azure/cosmos'
import { CosmosItem } from './item';
import { ItemIdAllocator } from './item-id';

/** Connect to an instance of Cosmos DB Emulator. This object should be created as a worker-scoped fixture to safely leverage test parallelisation. */
export class CosmosConnector {

    /** References the Cosmos Container that items will be created/deleted from. */
    private container : Container;
    /** References the promise made when connecting to Cosmos DB Emulator. If null, a connection is not established. */
    private connectionPromise : Promise<void> | null;
    /** List of items created within the scope of a Playwright worker. Prevents accidental deletion of records being used by other worker processes. */
    private itemStack : CosmosItem[] = [];
    /** References the unique parallel index of the Playwright worker that this object is within the scope of. */
    private playwrightWorkerParallelIndex : number;
    private idAllocator : ItemIdAllocator = new ItemIdAllocator();

    constructor(workerIndex : number) { 
        this.connectionPromise = null;
        this.playwrightWorkerParallelIndex = workerIndex;
    }

    /** Internal method for logging Cosmos HTTP status codes and throwing an error when a bad code is returned.
     *  
     * For more information, see {@link https://learn.microsoft.com/en-us/rest/api/cosmos-db/http-status-codes-for-cosmosdb}.
     */
    private cosmosStatusHandler(statusCode : number) : void {
        switch (statusCode) {
            case 200 : console.log('200 - Successful Operation!'); break;
            case 201 : console.log('201 - Resource Created Successfully!'); break;
            case 204 : console.log('204 - Successful DELETE Operation!'); break;
            case 400 : console.log('400 - Bad Request!'); break;
            case 401 : console.log('401 - Unauthorised!'); break;
            case 403 : console.log('403 - Forbidden!'); break;
            case 404 : console.log('404 - Resource Not Found!'); break;
            case 408 : console.log('408 - Operation Timed Out!'); break;
            case 409 : console.log('409 - Resource ID Conflict!'); break;
            case 412 : console.log('412 - Precondition Failure!'); break;
            case 413 : console.log('413 - Requested Entity Too Large!'); break;
            case 423 : console.log('423 - Operation Locked!'); break;
            case 424 : console.log('424 - Failed Dependency!'); break;
            case 429 : console.log('429 - Too Many Requests, Throughput Limit Exceeded!'); break;
            case 449 : console.log('449 - Transient Error, Please Retry!'); break;
            case 500 : console.log('500 - Internal Server Error!'); break;
            case 503 : console.log('503 - Service Unavailable!'); break;
            default : console.log('Unhandled Response Code!'); break;
        }
        if (statusCode > 204) { throw new Error('Bad Response Code'); };
    }
    
    /** Internal method for connecting to Cosmos DB Emulator. This method will create, or connect to, a database named 'register' and a container named 'products'. */
    private async connect() : Promise<void> {

        console.log('Connecting to Cosmos...');

        try {

            // Disable certificate verification
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            
            // Connect to Cosmos DB instance
            let cosmosClient : CosmosClient = new CosmosClient({
                endpoint: 'https://localhost:8081/',
                key: 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=='
            });
            
            // Create or return a database named 'register'
            let { database } : DatabaseResponse = await cosmosClient.databases.createIfNotExists({
                id: 'register',
                throughput: 400
            });

            // Create or return a container named 'products'
            let { statusCode, container } : ContainerResponse = await database.containers.createIfNotExists({
                id: 'products',
                partitionKey: { paths: ['/id'] }
            });

            // Check status code of container
            this.cosmosStatusHandler(statusCode);

            this.container = container;

            console.log('...Connection Successful!');

        } catch (error) {
            console.log('...Connection Failed!');
        }

    }

    /** Internal method for checking whether there's a connection to Cosmos DB Emulator. If no connection exists, one will be attempted. */
    private async checkConnection() : Promise<void | null> { 
        console.log('Checking Connection...');
        if (!this.connectionPromise) { this.connectionPromise = this.connect(); }
        return this.connectionPromise;
    }
    
    /** Create an item within Cosmos DB. */
    public async addItem(...items : CosmosItem[]) {
        await this.checkConnection();
        for (let item of items) { // Loop through the items provided
            await this.container.items.create(item); // For each item, create within Cosmos Container
            this.itemStack.push(item); // And then push into the item stack for future deletion
        };
    }
    
    /** Delete an item from Cosmos DB. */
    public async removeItem(...items : CosmosItem[]) { 
        await this.checkConnection();
        for (let item of items) { // Loop through the items provided
            await this.container.item(item.id, item.id).delete(); // For each item, delete from Cosmos Container
            this.itemStack = this.itemStack.filter((stackItem) => stackItem.id == item.id); // And then remove the item from the item stack
        };
    }

    /** Remove all items from Cosmos DB.
     * 
     * NOTE: This will only remove items from within the item stack of the current worker. This is to protect tests running in other workers in the event of test parallelisation.
     */
    public async resetContainer() : Promise<void> {
        await this.checkConnection();
        await this.removeItem(...this.itemStack);
    }

};