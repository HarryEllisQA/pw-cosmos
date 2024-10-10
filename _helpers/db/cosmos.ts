import { Container, ContainerResponse, CosmosClient, Database, DatabaseRequest, DatabaseResponse } from '@azure/cosmos'

export class CosmosConnector {

    private container : Container | undefined;
    
    constructor() {};

    private async connect() : Promise<void> {

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        let cosmosClient : CosmosClient = new CosmosClient({
            endpoint: 'https://localhost:8081/',
            key: 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=='
        });

        let { database } : DatabaseResponse = await cosmosClient.databases.createIfNotExists({
            id: 'cosmicworks',
            throughput: 400
        });

        let { container } : ContainerResponse = await database.containers.createIfNotExists({
            id: 'products',
            partitionKey: { paths: ['/id'] }
        });

        this.container = container;

    };

    private async checkConnection() : Promise<void> { if (this.container === undefined) { await this.connect(); }}

    public async addProduct(product : {id : string, name : string}) : Promise<void> {

        await this.checkConnection();
        await this.container?.items.upsert(product);

    }

}