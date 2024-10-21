import { test as base } from '@playwright/test';
import { CosmosConnector } from '../_helpers/db/cosmos';
import { ItemIdAllocator } from '../_helpers/db/item-id';

type testFixtures = {
    
};

type workerFixtures = {
    db : CosmosConnector,
    idAllocator : ItemIdAllocator
};

export const test = base.extend<testFixtures, workerFixtures>({
    
    // Test-Scoped Fixtures

    // Worker-Scoped Fixtures
    db : [async ({}, use, workerInfo) => {
        const db : CosmosConnector = new CosmosConnector(workerInfo.parallelIndex);
        await use(db);
    }, { scope: 'worker' }],

});

export { expect } from '@playwright/test';